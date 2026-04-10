import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

// Wrap adapter methods to distinguish DB errors from config errors
const wrappedAdapter: typeof adapter = {
  ...adapter,
  createUser: async (data) => {
    try {
      return await adapter.createUser!(data);
    } catch (e) {
      console.error("[auth] Database error in createUser:", e);
      throw new Error("DatabaseError");
    }
  },
  getUserByEmail: async (email) => {
    try {
      return await adapter.getUserByEmail!(email);
    } catch (e) {
      console.error("[auth] Database error in getUserByEmail:", e);
      throw new Error("DatabaseError");
    }
  },
  getUserByAccount: async (account) => {
    try {
      return await adapter.getUserByAccount!(account);
    } catch (e) {
      console.error("[auth] Database error in getUserByAccount:", e);
      throw new Error("DatabaseError");
    }
  },
  linkAccount: async (account) => {
    try {
      return await adapter.linkAccount!(account);
    } catch (e) {
      console.error("[auth] Database error in linkAccount:", e);
      throw new Error("DatabaseError");
    }
  },
  createSession: async (session) => {
    try {
      return await adapter.createSession!(session);
    } catch (e) {
      console.error("[auth] Database error in createSession:", e);
      throw new Error("DatabaseError");
    }
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: wrappedAdapter,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    error: "/auth/error",
  },
});
