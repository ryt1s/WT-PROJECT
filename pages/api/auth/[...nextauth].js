import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Login attempt:", credentials.email); // ← here
        const user = await prisma.professor.findUnique({
          where: { email: credentials.email },
        });
         console.log("User found:", user); // ← here

        if (!user) return null; // email not found

        const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log("Password valid:", isValid); // ← here
        if (!isValid) return null; // password mismatch

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token) session.user.id = token.id;
      return session;
    },
  },
};

export default NextAuth(authOptions);
