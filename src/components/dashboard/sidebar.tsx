"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavSection {
  section: string;
}

type NavEntry = NavItem | NavSection;

function isSection(entry: NavEntry): entry is NavSection {
  return "section" in entry;
}

const NAV_ITEMS: Record<string, NavEntry[]> = {
  admin: [
    { section: "Main" },
    { label: "Dashboard", href: "/dashboard/admin", icon: "⊞" },
    { section: "Manage" },
    { label: "People", href: "/dashboard/admin/people", icon: "👥" },
    { label: "Activity", href: "/dashboard/admin/activity", icon: "📋" },
    { label: "Communications", href: "/dashboard/admin/communications", icon: "💬" },
    { section: "Finance" },
    { label: "Accounting", href: "/dashboard/admin/accounting", icon: "💰" },
    { label: "Analytics", href: "/dashboard/admin/analytics", icon: "📊" },
    { section: "Config" },
    { label: "System", href: "/dashboard/admin/system", icon: "⚙️" },
    { label: "Support", href: "/dashboard/admin/support", icon: "🛟" },
  ],
  tutor: [
    { section: "Main" },
    { label: "Dashboard", href: "/dashboard/tutor", icon: "⊞" },
    { label: "My Students", href: "/dashboard/tutor/students", icon: "👥" },
    { label: "Schedule", href: "/dashboard/tutor/schedule", icon: "📅" },
    { label: "Jobs", href: "/dashboard/tutor/jobs", icon: "📌" },
    { label: "Earnings", href: "/dashboard/tutor/earnings", icon: "💰" },
    { label: "Reports", href: "/dashboard/tutor/reports", icon: "📊" },
    { label: "Support", href: "/dashboard/tutor/support", icon: "🛟" },
  ],
  client: [
    { section: "Main" },
    { label: "Dashboard", href: "/dashboard/client", icon: "⊞" },
    { label: "Students", href: "/dashboard/client/students", icon: "👥" },
    { label: "Schedule", href: "/dashboard/client/schedule", icon: "📅" },
    { label: "Invoices", href: "/dashboard/client/invoices", icon: "📄" },
    { label: "Reports", href: "/dashboard/client/reports", icon: "📊" },
    { label: "Support", href: "/dashboard/client/support", icon: "🛟" },
  ],
  student: [
    { section: "Main" },
    { label: "Dashboard", href: "/dashboard/student", icon: "⊞" },
    { label: "Schedule", href: "/dashboard/student/schedule", icon: "📅" },
    { label: "My Reports", href: "/dashboard/student/reports", icon: "📊" },
    { label: "Support", href: "/dashboard/student/support", icon: "🛟" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  tutor: "Tutor",
  client: "Parent / Guardian",
  student: "Student",
};

interface SidebarProps {
  role: string;
  userName: string;
  currentPath?: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navEntries = NAV_ITEMS[role] ?? NAV_ITEMS.student;
  const roleLabel = ROLE_LABELS[role] ?? role;

  function isActive(href: string): boolean {
    // Exact match for the base dashboard route, prefix match for sub-pages
    if (href === `/dashboard/${role}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[250px] flex flex-col z-40 bg-sidebar"
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <span
          className="text-white text-2xl tracking-tight select-none"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}
        >
          Mathbord
        </span>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-white/10 mb-4" />

      {/* Nav items */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {navEntries.map((entry, idx) => {
          if (isSection(entry)) {
            return (
              <p
                key={`section-${idx}`}
                className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30"
              >
                {entry.section}
              </p>
            );
          }

          const active = isActive(entry.href);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors relative",
                active
                  ? "text-teal bg-teal/10"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              {/* Active left border indicator */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[24px] rounded-r-full bg-teal"
                />
              )}
              <span className="text-base leading-none">{entry.icon}</span>
              <span>{entry.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className="px-6 pb-6 pt-4 border-t border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
          {roleLabel}
        </p>
        <p className="text-sm font-medium text-white/80 truncate">{userName}</p>
      </div>
    </aside>
  );
}
