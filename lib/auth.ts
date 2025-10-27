import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from './database';

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true, // Required for ngrok
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
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
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user?.email) {
          // Check if user already exists in database
          const existingUser = await query('SELECT * FROM users WHERE email = $1', [user.email]);
          
          if (existingUser.rows.length > 0) {
            // User exists - update last login and link the account
            const dbUser = existingUser.rows[0];
            await query(
              'UPDATE users SET last_login = $1, image = $2 WHERE id = $3',
              [new Date(), user.image || dbUser.image, dbUser.id]
            );
            // Update the user ID in the token to match database
            user.id = dbUser.id.toString();
          } else {
            // New Google user - create account in database
            const newUser = await query(
              'INSERT INTO users (email, name, image, created_at, last_login) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [user.email, user.name, user.image, new Date(), new Date()]
            );
            user.id = newUser.rows[0].id.toString();
          }
        } else if (user?.id) {
          // Regular credentials login - just update last login
          await query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), parseInt(user.id)]);
        }
      } catch (error) {
        console.error('Failed to handle sign in:', error);
        // Don't block login if database operations fail
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
});
