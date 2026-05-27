import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import ResendProvider from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }

  interface User {
    roles: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    Google,
    ResendProvider({
      from: process.env.EMAIL_FROM ?? "FamilyPulse <no-reply@familypulse.com>",
      sendVerificationRequest: async ({ identifier: to, url, provider: { from } }) => {
        await sendEmail({
          to,
          subject: "Sign in to FamilyPulse",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1c2020;">
              <h2 style="color: #2e7d32;">Sign in to FamilyPulse</h2>
              <p>Click the button below to sign in to your account.</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Sign in to FamilyPulse</a>
              <p style="font-size: 14px; line-height: 1.6; color: #555e5e;">
                This link is valid for a single use. If you didn't request this email, you can safely ignore it.
              </p>
            </div>
          `,
          text: `Sign in to FamilyPulse by opening this link:\n\n${url}\n\nIf you didn't request this email, you can safely ignore it.`,
          from: from as string,
        });
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 365 * 24 * 60 * 60,
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.roles = user.roles ?? ["USER"];
      }
      return session;
    },
  },
});
