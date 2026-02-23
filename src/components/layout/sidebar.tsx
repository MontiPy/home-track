"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  ListChecks,
  UtensilsCrossed,
  ShoppingCart,
  MessageSquare,
  Wallet,
  Lock,
  PawPrint,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/chores", label: "Chores", icon: ListChecks },
  { href: "/meals", label: "Meals", icon: UtensilsCrossed },
  { href: "/grocery-list", label: "Grocery List", icon: ShoppingCart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/budget", label: "Budget", icon: Wallet, roles: ["ADMIN", "MEMBER"] },
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/pets", label: "Pets", icon: PawPrint },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
}

export function Sidebar({ open, onClose, userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/" className="text-xl font-bold text-primary">
            Family Hub
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
