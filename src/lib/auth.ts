import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: process.env.DATABASE_URL
    ? PrismaAdapter(getPrisma())
    : undefined,
  providers: [Google],
  pages: {
    signIn: "/",
  },
});
