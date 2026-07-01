"use client";

import { Bell, Search, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search campaigns, leads..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500"></span>
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 overflow-hidden rounded-full border bg-muted flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
          <UserCircle className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
