import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Utensils,
  Scale,
  BarChart3,
  Crown,
  Shield,
  Users,
  Ticket,
  TrendingUp,
  LogOut,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const userLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/food-log", icon: Utensils, label: "Food Log" },
  { to: "/weight", icon: Scale, label: "Weight" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/premium", icon: Crown, label: "Premium" },
];

const adminLinks = [
  { to: "/admin", icon: Shield, label: "Admin Panel" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/vouchers", icon: Ticket, label: "Vouchers" },
  { to: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { isAdmin, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-sidebar text-sidebar-foreground"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Heart className="text-sidebar-primary" size={28} />
            <span className="text-xl font-display font-bold text-sidebar-accent-foreground">
              Fit<span className="text-sidebar-primary">Track</span>
            </span>
          </div>
          {profile?.is_premium && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <Crown size={12} className="text-sidebar-primary" />
              <span className="text-sidebar-primary font-medium">Premium Active</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mb-2 px-3">Menu</p>
          {userLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === l.to
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <l.icon size={18} />
              {l.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <p className="text-xs uppercase tracking-wider text-sidebar-foreground/50 mt-6 mb-2 px-3">Admin</p>
              {adminLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    pathname === l.to
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <l.icon size={18} />
                  {l.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
