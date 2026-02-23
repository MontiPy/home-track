import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (!session.user.householdId) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      userName={session.user.memberName || session.user.name || "User"}
      userAvatar={session.user.image}
      userColor={session.user.memberColor}
      userRole={session.user.role}
      memberId={session.user.memberId}
      householdId={session.user.householdId}
    >
      {children}
    </AppShell>
  );
}
