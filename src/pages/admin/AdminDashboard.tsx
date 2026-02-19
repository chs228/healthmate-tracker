import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { Users, Crown, Ticket, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0, activeVouchers: 0, totalLogs: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ count: totalUsers }, { data: premData }, { count: activeVouchers }, { count: totalLogs }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("is_premium").eq("is_premium", true),
        supabase.from("vouchers").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("food_logs").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        premiumUsers: premData?.length || 0,
        activeVouchers: activeVouchers || 0,
        totalLogs: totalLogs || 0,
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={20} />} />
        <StatCard label="Premium Users" value={stats.premiumUsers} icon={<Crown size={20} />} />
        <StatCard label="Active Vouchers" value={stats.activeVouchers} icon={<Ticket size={20} />} />
        <StatCard label="Total Food Logs" value={stats.totalLogs} icon={<BarChart3 size={20} />} />
      </div>
    </div>
  );
}
