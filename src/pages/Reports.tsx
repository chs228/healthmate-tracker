import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ReportRow {
  date: string;
  calories_taken: number;
  calories_burned: number;
  deficit: number;
  weight_change_pct: string;
  sleep_hours: number;
  spo2_avg: number | null;
}

export default function Reports() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [{ data: food }, { data: health }, { data: weights }] = await Promise.all([
        supabase.from("food_logs").select("date, calories").eq("user_id", user.id).order("date"),
        supabase.from("health_logs").select("date, calories_burned, sleep_hours, spo2_avg").eq("user_id", user.id).order("date"),
        supabase.from("weight_logs").select("date, weight").eq("user_id", user.id).order("date"),
      ]);

      const foodByDate: Record<string, number> = {};
      food?.forEach((f) => {
        foodByDate[f.date] = (foodByDate[f.date] || 0) + Number(f.calories || 0);
      });

      const healthByDate: Record<string, { burned: number; sleep: number; spo2: number | null }> = {};
      health?.forEach((h) => {
        healthByDate[h.date] = {
          burned: Number(h.calories_burned || 0),
          sleep: Number(h.sleep_hours || 0),
          spo2: h.spo2_avg,
        };
      });

      const weightByDate: Record<string, number> = {};
      weights?.forEach((w) => { weightByDate[w.date] = Number(w.weight); });

      const dates = [...new Set([
        ...Object.keys(foodByDate),
        ...Object.keys(healthByDate),
        ...Object.keys(weightByDate),
      ])].sort();

      let prevWeight: number | null = null;
      const result: ReportRow[] = dates.map((date) => {
        const cal = foodByDate[date] || 0;
        const burned = healthByDate[date]?.burned || 0;
        const deficit = cal - burned;
        const currentW = weightByDate[date];
        let changePct = "--";
        if (currentW && prevWeight) {
          changePct = (((currentW - prevWeight) / prevWeight) * 100).toFixed(2) + "%";
        }
        if (currentW) prevWeight = currentW;

        return {
          date,
          calories_taken: cal,
          calories_burned: burned,
          deficit,
          weight_change_pct: changePct,
          sleep_hours: healthByDate[date]?.sleep || 0,
          spo2_avg: healthByDate[date]?.spo2 ?? null,
        };
      });

      setRows(result);
    };

    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Reports</h1>

      {/* Chart */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Calorie Trends</h3>
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="calories_taken" name="Calories Taken" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="calories_burned" name="Calories Burned" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">No report data yet.</p>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Cal Taken</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Cal Burned</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Deficit/Surplus</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Weight Δ%</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Sleep (h)</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">SpO2</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{r.date}</td>
                  <td className="p-4 text-right">{r.calories_taken}</td>
                  <td className="p-4 text-right">{r.calories_burned}</td>
                  <td className={`p-4 text-right font-medium ${r.deficit < 0 ? "text-primary" : "text-destructive"}`}>
                    {r.deficit}
                  </td>
                  <td className="p-4 text-right">{r.weight_change_pct}</td>
                  <td className="p-4 text-right">{r.sleep_hours}</td>
                  <td className="p-4 text-right">{r.spo2_avg ?? "--"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
