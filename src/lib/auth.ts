import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return false;

      const googleId = account.providerAccountId;
      const existingMember = await db.member.findUnique({
        where: { googleId },
      });

      if (existingMember) return true;

      // Check for pending invitation
      const invitation = await db.invitation.findFirst({
        where: {
          email: user.email!,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (invitation) {
        await db.member.create({
          data: {
            googleId,
            email: user.email!,
            name: user.name ?? user.email!,
            avatarUrl: user.image,
            role: invitation.role,
            householdId: invitation.householdId,
          },
        });

        await db.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });

        return true;
      }

      // New user — allow sign-in, they'll go through onboarding
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }

      if (token.googleId) {
        const member = await db.member.findUnique({
          where: { googleId: token.googleId as string },
          include: { household: true },
        });

        if (member) {
          token.memberId = member.id;
          token.householdId = member.householdId;
          token.role = member.role;
          token.memberName = member.name;
          token.memberColor = member.color;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.googleId) {
        session.user.googleId = token.googleId as string;
      }
      if (token.memberId) {
        session.user.memberId = token.memberId as string;
        session.user.householdId = token.householdId as string;
        session.user.role = token.role as string;
        session.user.memberName = token.memberName as string;
        session.user.memberColor = token.memberColor as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
});
