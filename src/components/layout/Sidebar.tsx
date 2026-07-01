"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Globe, 
  Inbox, 
  Users, 
  Send, 
  Mailbox,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Mailboxes", href: "/mailboxes", icon: Inbox },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Unified Inbox", href: "/inbox", icon: Mailbox },
  { name: "Deliverability", href: "/deliverability", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          RI Outreach
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
