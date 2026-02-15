"use client";

import { Menu, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface HeaderProps {
  onMenuClick: () => void;
  userName?: string;
  userAvatar?: string | null;
  userColor?: string;
  onSignOut: () => void;
}

export function Header({
  onMenuClick,
  userName,
  userAvatar,
  userColor,
  onSignOut,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md hover:bg-secondary"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="lg:hidden text-lg font-bold text-primary">
        Home Track
      </div>

      <div className="flex items-center gap-3">
        {userName && (
          <div className="flex items-center gap-2">
            <Avatar
              src={userAvatar}
              name={userName}
              color={userColor}
              size="sm"
            />
            <span className="hidden sm:inline text-sm font-medium">
              {userName}
            </span>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="p-2 rounded-md hover:bg-secondary text-muted-foreground"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
