"use client";

import {
  BarChart3,
  Image,
  LayoutDashboard,
  Package,
  Percent,
  Settings,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/pricing", label: "Pricing", icon: Percent },
  { href: "/admin/uploads", label: "Design Files", icon: Image },
  { href: "/admin/promos", label: "Promos", icon: Ticket },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminLinks({ currentPath, onNavigate }: { currentPath?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const activePath = currentPath || pathname;
  return <nav aria-label="Admin navigation" className="space-y-1">
    {adminLinks.map(({ href, label, icon: Icon }) => {
      const active = href === "/admin" ? activePath === href : activePath.startsWith(href);
      return <Link
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
        href={href}
        key={href}
        onClick={onNavigate}
      >
        <Icon size={17} />{label}
      </Link>;
    })}
  </nav>;
}
