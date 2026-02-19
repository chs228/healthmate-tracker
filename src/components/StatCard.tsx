import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  className?: string;
}

export default function StatCard({ label, value, icon, subtitle, className }: StatCardProps) {
  return (
    <div className={cn("glass-card rounded-xl p-5 animate-slide-up", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}
