import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/users";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    "placement-ai-local-dev-secret-key-super-secure-2025",
  providers: [
    CredentialsProvider({
      name: "PlacementAI Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "student@placement.ai" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const user = verifyCredentials(credentials.email, credentials.password);
        if (!user) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          targetRole: user.targetRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.targetRole = (user as { targetRole?: string }).targetRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; targetRole?: string }).id = token.id as string;
        (session.user as { id?: string; targetRole?: string }).targetRole = token.targetRole as string;
      }
      return session;
    },
  },
};
