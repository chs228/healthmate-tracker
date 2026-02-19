import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Scale } from "lucide-react";

export default function WeightTracking() {
  const { user, refreshProfile } = useAuth();
  const [weight, setWeight] = useState("");
  const [history, setHistory] = useState<{ date: string; weight: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weight_logs")
      .select("date, weight")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .limit(90);
    if (data) setHistory(data.map((d) => ({ date: d.date, weight: Number(d.weight) })));
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const logWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const w = Number(weight);

    const { error } = await supabase
      .from("weight_logs")
      .upsert({ user_id: user.id, date: today, weight: w }, { onConflict: "user_id,date" });

    if (!error) {
      await supabase.from("profiles").update({ current_weight: w }).eq("user_id", user.id);
      await refreshProfile();
      toast.success("Weight logged!");
      setWeight("");
      fetchHistory();
    } else {
      toast.error(error.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Weight Tracking</h1>

      <form onSubmit={logWeight} className="glass-card rounded-xl p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Today's Weight (kg)</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Scale className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 72.5"
                className="pl-10"
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Log Weight"}
            </Button>
          </div>
        </div>
      </form>

      {/* Chart */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Weight Progress</h3>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">No weight data yet. Start logging!</p>
        )}
      </div>
    </div>
  );
}
