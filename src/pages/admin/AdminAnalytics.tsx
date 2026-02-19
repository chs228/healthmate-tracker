import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAnalytics() {
  const [dailySignups, setDailySignups] = useState<{ date: string; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ name: string; logs: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      // Signups by day (from profiles created_at)
      const { data: profiles } = await supabase.from("profiles").select("created_at").order("created_at");
      if (profiles) {
        const byDate: Record<string, number> = {};
        profiles.forEach((p) => {
          const d = new Date(p.created_at).toISOString().split("T")[0];
          byDate[d] = (byDate[d] || 0) + 1;
        });
        setDailySignups(Object.entries(byDate).map(([date, count]) => ({ date, count })));
      }

      // Top users by food log count
      const { data: logs } = await supabase.from("food_logs").select("user_id");
      if (logs) {
        const countMap: Record<string, number> = {};
        logs.forEach((l) => { countMap[l.user_id] = (countMap[l.user_id] || 0) + 1; });
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const userIds = sorted.map(([id]) => id);
        const { data: names } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const nameMap: Record<string, string> = {};
        names?.forEach((n) => { nameMap[n.user_id] = n.full_name || "Unknown"; });

        setTopUsers(sorted.map(([id, count]) => ({ name: nameMap[id] || id.slice(0, 8), logs: count })));
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Analytics</h1>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Daily New Users</h3>
        {dailySignups.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailySignups}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">No signup data</p>
        )}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Top Active Users</h3>
        {topUsers.length > 0 ? (
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-display font-bold text-primary">#{i + 1}</span>
                  <span className="font-medium">{u.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{u.logs} logs</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No activity data</p>
        )}
      </div>
    </div>
  );
}
