import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FoodEntry {
  id: string;
  food_name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

export default function FoodLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("created_at", { ascending: false });
    if (data) setEntries(data as FoodEntry[]);
  };

  useEffect(() => { fetchEntries(); }, [user]);

  const autoFill = async () => {
    if (!foodName.trim()) return toast.error("Enter a food name first");
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { foodName: foodName.trim() },
      });
      if (error) throw error;
      if (data) {
        setCalories(String(data.calories || 0));
        setProtein(String(data.protein || 0));
        setCarbs(String(data.carbs || 0));
        setFat(String(data.fat || 0));
        toast.success("Nutrition info filled by AI!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze food");
    } finally {
      setAiLoading(false);
    }
  };

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAdding(true);
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      food_name: foodName,
      meal_type: mealType,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      date: today,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Food logged!");
      setFoodName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
      fetchEntries();
    }
    setAdding(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("food_logs").delete().eq("id", id);
    fetchEntries();
  };

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      protein: acc.protein + Number(e.protein),
      carbs: acc.carbs + Number(e.carbs),
      fat: acc.fat + Number(e.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Food Log</h1>

      {/* Add form */}
      <form onSubmit={addEntry} className="glass-card rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Food Name</label>
            <div className="flex gap-2">
              <Input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Chicken breast 200g" required />
              <Button type="button" variant="outline" onClick={autoFill} disabled={aiLoading} className="shrink-0">
                <Sparkles size={16} className={aiLoading ? "animate-spin" : ""} />
                {aiLoading ? "..." : "AI"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Meal Type</label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Calories</label>
            <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Protein (g)</label>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Carbs (g)</label>
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fat (g)</label>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" />
          </div>
        </div>

        <Button type="submit" disabled={adding}>
          <Plus size={16} className="mr-1" /> Add Entry
        </Button>
      </form>

      {/* Daily totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Calories</p>
          <p className="text-xl font-display font-bold text-primary">{totals.calories}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Protein</p>
          <p className="text-xl font-display font-bold">{totals.protein}g</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Carbs</p>
          <p className="text-xl font-display font-bold">{totals.carbs}g</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Fat</p>
          <p className="text-xl font-display font-bold">{totals.fat}g</p>
        </div>
      </div>

      {/* Entries table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Food</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Meal</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Cal</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Protein</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Carbs</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Fat</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">{e.food_name}</td>
                  <td className="p-4 capitalize text-muted-foreground">{e.meal_type}</td>
                  <td className="p-4 text-right">{e.calories}</td>
                  <td className="p-4 text-right">{e.protein}g</td>
                  <td className="p-4 text-right">{e.carbs}g</td>
                  <td className="p-4 text-right">{e.fat}g</td>
                  <td className="p-4">
                    <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No food logged today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
