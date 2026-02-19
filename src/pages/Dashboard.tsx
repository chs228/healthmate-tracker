import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import {
  Scale,
  Target,
  Flame,
  Drumstick,
  Droplets,
  Footprints,
  Moon,
  Heart,
  Activity,
  Crown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [todayFood, setTodayFood] = useState({ calories: 0, protein: 0 });
  const [todayHealth, setTodayHealth] = useState({
    steps: 0,
    water_ml: 0,
    sleep_hours: 0,
    bpm_avg: 0,
    spo2_avg: 0,
  });

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    supabase
      .from("food_logs")
      .select("calories, protein")
      .eq("user_id", user.id)
      .eq("date", today)
      .then(({ data }) => {
        if (data) {
          const cals = data.reduce((s, r) => s + Number(r.calories || 0), 0);
          const prot = data.reduce((s, r) => s + Number(r.protein || 0), 0);
          setTodayFood({ calories: cals, protein: prot });
        }
      });

    supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTodayHealth({
            steps: data.steps || 0,
            water_ml: data.water_ml || 0,
            sleep_hours: Number(data.sleep_hours) || 0,
            bpm_avg: data.bpm_avg || 0,
            spo2_avg: data.spo2_avg || 0,
          });
        }
      });
  }, [user]);

  const bmi =
    profile?.current_weight && profile?.height_cm
      ? (Number(profile.current_weight) / ((Number(profile.height_cm) / 100) ** 2)).toFixed(1)
      : "--";

  const weightProgress =
    profile?.current_weight && profile?.goal_weight
      ? Math.min(100, Math.round((Number(profile.goal_weight) / Number(profile.current_weight)) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || "User"}!</p>
        </div>
        {profile?.is_premium && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
            <Crown size={14} />
            Premium
          </div>
        )}
      </div>

      {/* Weight progress */}
      <div className="glass-card rounded-xl p-6 stat-glow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Weight Goal Progress</h3>
          <span className="text-sm text-muted-foreground">
            {profile?.current_weight ?? "--"} kg → {profile?.goal_weight ?? "--"} kg
          </span>
        </div>
        <Progress value={weightProgress} className="h-3" />
        <p className="text-xs text-muted-foreground mt-2">{weightProgress}% towards your goal</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Weight" value={`${profile?.current_weight ?? "--"} kg`} icon={<Scale size={20} />} />
        <StatCard label="Goal" value={`${profile?.goal_weight ?? "--"} kg`} icon={<Target size={20} />} />
        <StatCard label="BMI" value={bmi} icon={<Activity size={20} />} />
        <StatCard label="Calories" value={todayFood.calories} subtitle="kcal today" icon={<Flame size={20} />} />
        <StatCard label="Protein" value={`${todayFood.protein}g`} subtitle="today" icon={<Drumstick size={20} />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Water" value={`${todayHealth.water_ml} ml`} icon={<Droplets size={20} />} />
        <StatCard label="Steps" value={todayHealth.steps.toLocaleString()} icon={<Footprints size={20} />} />
        <StatCard label="Sleep" value={`${todayHealth.sleep_hours}h`} icon={<Moon size={20} />} />
        <StatCard label="BPM Avg" value={todayHealth.bpm_avg || "--"} icon={<Heart size={20} />} />
        <StatCard label="SpO2 Avg" value={todayHealth.spo2_avg ? `${todayHealth.spo2_avg}%` : "--"} icon={<Activity size={20} />} />
      </div>
    </div>
  );
}
