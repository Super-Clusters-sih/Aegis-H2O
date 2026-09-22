"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ================================================================
   TYPES
================================================================ */

interface SidebarProps {
  isAdmin?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

/* ================================================================
   ICONS
================================================================ */

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  );
}

function IconContact() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function WaterDropLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3C12 3 6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 3C12 3 6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11-6-11Z" />
      <path d="m9.5 14.5 1.7 1.7 3.5-3.8" />
    </svg>
  );
}

/* ================================================================
   NAV ITEMS
================================================================ */

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <IconDashboard />,
  },
  {
    label: "Prediction History",
    href: "/dashboard/history",
    icon: <IconHistory />,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <IconProfile />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <IconSettings />,
  },
  {
    label: "Contact Us",
    href: "/contact",
    icon: <IconContact />,
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: <IconAdmin />,
    adminOnly: true,
  },
];

/* ================================================================
   SIDEBAR CONTENT
================================================================ */

function SidebarContent({
  isAdmin,
  onClose,
}: {
  isAdmin: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--surface-sidebar)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--border-default)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/dashboard"
          onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <WaterDropLogo />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Aegis{" "}
              <span className="rainbow-text">H2O</span>
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Water Monitoring
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              background: "none",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "var(--text-muted)",
              borderRadius: "8px",
            }}
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
        aria-label="Main navigation"
      >
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "9px",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: active ? 700 : 500,
                color: active ? "#14b8a6" : "var(--text-secondary)",
                background: active
                  ? "rgba(20, 184, 166, 0.09)"
                  : "transparent",
                border: active
                  ? "1px solid rgba(20, 184, 166, 0.18)"
                  : "1px solid transparent",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "var(--surface-hover)";
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "var(--text-secondary)";
                }
              }}
            >
              <span
                style={{
                  opacity: active ? 1 : 0.6,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {item.icon}
              </span>
              {item.label}
              {item.adminOnly && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "9px",
                    fontWeight: 800,
                    color: "#8b5cf6",
                    background: "rgba(139,92,246,0.1)",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    letterSpacing: "0.05em",
                  }}
                >
                  ADMIN
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid var(--border-default)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {/* User row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "9px",
            background: "var(--surface-hover)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "white",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {user?.firstName?.[0] ??
              user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ??
              "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.firstName
                ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                : "Account"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "var(--text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.emailAddresses[0]?.emailAddress ?? ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            borderRadius: "9px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "13.5px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            width: "100%",
            textAlign: "left",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(239, 68, 68, 0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-secondary)";
          }}
        >
          <span style={{ opacity: 0.6, display: "flex", alignItems: "center" }}>
            <IconLogout />
          </span>
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   SIDEBAR — Desktop + Mobile wrapper
================================================================ */

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────── */}
      <aside
        aria-label="Sidebar"
        style={{
          width: "var(--sidebar-width, 240px)",
          flexShrink: 0,
          display: "none",
        }}
        className="lg:block"
      >
        <div style={{ position: "sticky", top: 0, height: "100vh" }}>
          <SidebarContent isAdmin={isAdmin} />
        </div>
      </aside>

      {/* ── Mobile hamburger ───────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: "12px",
          left: "12px",
          zIndex: 60,
        }}
        className="lg:hidden"
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "10px",
            padding: "8px",
            cursor: "pointer",
            color: "var(--text-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconMenu />
        </button>
      </div>

      {/* ── Mobile overlay ────────────────────────── */}
      {mobileOpen && (
        <>
          {/* backdrop */}
          <div
            ref={overlayRef}
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 70,
              backdropFilter: "blur(2px)",
            }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="sidebar-mobile-open"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "260px",
              zIndex: 80,
            }}
          >
            <SidebarContent
              isAdmin={isAdmin}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

/* ================================================================
   APP SHELL — wraps content with sidebar
================================================================ */

export function AppShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--surface-page)",
      }}
    >
      <Sidebar isAdmin={isAdmin} />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
