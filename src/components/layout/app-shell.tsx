"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userAvatar?: string | null;
  userColor?: string;
  userRole?: string;
}

export function AppShell({
  children,
  userName,
  userAvatar,
  userColor,
  userRole,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />

      <div className="flex flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          userName={userName}
          userAvatar={userAvatar}
          userColor={userColor}
          onSignOut={() => signOut({ callbackUrl: "/sign-in" })}
        />

        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">{children}</main>

        <BottomNav userRole={userRole} />
      </div>
    </div>
  );
}
