"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  ShoppingCart,
  MoreHorizontal,
} from "lucide-react";

const bottomItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/chores", label: "Chores", icon: ListChecks },
  { href: "/grocery-list", label: "Grocery", icon: ShoppingCart },
];

interface BottomNavProps {
  userRole?: string;
}

export function BottomNav({ userRole: _userRole }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white lg:hidden">
      <div className="flex items-center justify-around py-2">
        {bottomItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/meals"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs",
            pathname.startsWith("/meals") ||
              pathname.startsWith("/messages") ||
              pathname.startsWith("/budget") ||
              pathname.startsWith("/vault") ||
              pathname.startsWith("/pets") ||
              pathname.startsWith("/settings")
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </Link>
      </div>
    </nav>
  );
}
