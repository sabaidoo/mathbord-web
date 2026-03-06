import { type Role } from "@prisma/client";
import { type DefaultSession, type DefaultUser } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";

// Augment the built-in Session, User, and JWT types with Mathbord fields

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: string;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    status: string;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    status: string;
    avatarUrl: string | null;
  }
}
