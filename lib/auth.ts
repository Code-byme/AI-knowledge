import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from './database';

export const authOptions: NextAuthOptions = {
  providers: [
    // Only add Google provider if credentials are provided
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    CredentialsProvider({
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

          if (!user || !user.password_hash) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
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
    async jwt({ token, user, account }) {
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
      // Update last login time when user signs in
      if (user?.id) {
        try {
          await query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), parseInt(user.id)]);
        } catch (error) {
          console.error('Failed to update last login:', error);
          // Don't block login if this fails
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
};
