import NextAuth, { getServerSession } from 'next-auth';
import type { AuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from './database';

const PG_INTEGER_MAX = BigInt(2147483647);

/** PostgreSQL user ids are SERIAL integers — not Google OAuth subs. */
export function isValidDbUserId(id: unknown): boolean {
  if (typeof id !== 'string' || !/^\d+$/.test(id)) return false;
  try {
    const n = BigInt(id);
    return n > BigInt(0) && n <= PG_INTEGER_MAX;
  } catch {
    return false;
  }
}

async function getOrCreateDbUserId(
  email: string,
  name?: string | null,
  image?: string | null
): Promise<string> {
  const existing = await query('SELECT id, image FROM users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    const dbUser = existing.rows[0] as { id: number; image: string | null };
    await query(
      'UPDATE users SET last_login = $1, image = $2 WHERE id = $3',
      [new Date(), image || dbUser.image, dbUser.id]
    );
    return dbUser.id.toString();
  }

  const newUser = await query(
    'INSERT INTO users (email, name, image, created_at, last_login) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [email, name ?? null, image ?? null, new Date(), new Date()]
  );
  return (newUser.rows[0] as { id: number }).id.toString();
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },
  providers: [
    // Only add Google provider if credentials are provided
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check if user exists in PostgreSQL
          const result = await query('SELECT * FROM users WHERE email = $1', [credentials.email]);
          const user = result.rows[0];

          if (!user) {
            return null; // User doesn't exist
          }

          // If user exists but has no password (Google OAuth only), reject login
          if (!user.password_hash) {
            return null; // User exists but no password set
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash as string
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = user.email;
      }

      // Google OAuth `sub` is huge and does not fit PostgreSQL INTEGER columns.
      if (user?.email && account?.provider === 'google') {
        try {
          token.id = await getOrCreateDbUserId(user.email, user.name, user.image);
        } catch (error) {
          console.error('Failed to link Google account to database user:', error);
        }
      } else if (user?.id && isValidDbUserId(user.id)) {
        token.id = user.id;
      }

      // Heal JWTs that still store Google's provider id instead of our users.id
      if (token.email && !isValidDbUserId(token.id as string)) {
        try {
          token.id = await getOrCreateDbUserId(
            token.email as string,
            token.name as string | null | undefined,
            (token.picture as string | null | undefined) ?? null
          );
        } catch (error) {
          console.error('Failed to resolve database user id for session:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token || !session.user) {
        return session;
      }

      let userId = token.id as string | undefined;

      if (!isValidDbUserId(userId) && token.email) {
        try {
          userId = await getOrCreateDbUserId(
            token.email as string,
            session.user.name,
            session.user.image
          );
        } catch (error) {
          console.error('Failed to resolve session user id:', error);
        }
      }

      if (isValidDbUserId(userId)) {
        (session.user as { id: string }).id = userId as string;
      }

      return session;
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google' && user?.email) {
          user.id = await getOrCreateDbUserId(user.email, user.name, user.image);
        } else if (user?.id && isValidDbUserId(user.id)) {
          await query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), user.id]);
        }
      } catch (error) {
        console.error('Failed to handle sign in:', error);
        if (account?.provider === 'google') {
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
};

// Create NextAuth handler for routes
export const handlers = NextAuth(authOptions);

// Export auth function using getServerSession (NextAuth v4 pattern)
export async function auth() {
  return await getServerSession(authOptions);
}

// signIn and signOut are used client-side from 'next-auth/react'
// For server-side, we don't typically export them from here
