import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
type Role = string;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // 30-day session
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) return null;

        // Check account is not suspended
        if (user.status === "suspended") return null;

        const passwordValid = await compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordValid) return null;

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl ?? null,
        };
      },
    }),
  ],

  callbacks: {
    // Persist role + id into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.status = (user as { status: string }).status;
        token.avatarUrl = (user as { avatarUrl: string | null }).avatarUrl;
      }
      return token;
    },

    // Expose role + id on the client-side session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    },
  },

  // Improve security
  secret: process.env.NEXTAUTH_SECRET,
};
