import { auth } from "./auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireHousehold() {
  const session = await requireAuth();
  if (!session.user.householdId) {
    redirect("/onboarding");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireHousehold();
  if (!allowedRoles.includes(session.user.role as Role)) {
    redirect("/");
  }
  return session;
}
