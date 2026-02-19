import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Premium() {
  const { user, profile, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const redeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRedeeming(true);

    try {
      // Find voucher
      const { data: voucher, error: vErr } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (vErr || !voucher) throw new Error("Invalid voucher code");
      if (new Date(voucher.expiry_date) < new Date()) throw new Error("Voucher has expired");
      if (voucher.used_count >= voucher.usage_limit) throw new Error("Voucher usage limit reached");

      // Activate premium
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + voucher.duration_days);

      await supabase.from("profiles").update({
        is_premium: true,
        premium_expiry: expiry.toISOString(),
      }).eq("user_id", user.id);

      // Increment voucher count
      await supabase.from("vouchers").update({
        used_count: voucher.used_count + 1,
      }).eq("id", voucher.id);

      await refreshProfile();
      toast.success("Premium activated! 🎉");
      setCode("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  const isPremium = profile?.is_premium && profile.premium_expiry && new Date(profile.premium_expiry) > new Date();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Premium</h1>

      {isPremium ? (
        <div className="glass-card rounded-xl p-8 text-center stat-glow">
          <Crown className="mx-auto text-primary mb-4" size={48} />
          <h2 className="text-2xl font-display font-bold mb-2">You're Premium!</h2>
          <p className="text-muted-foreground">
            Your premium expires on{" "}
            <span className="font-medium text-foreground">
              {new Date(profile!.premium_expiry!).toLocaleDateString()}
            </span>
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card rounded-xl p-8">
            <div className="text-center mb-8">
              <Crown className="mx-auto text-primary mb-4" size={48} />
              <h2 className="text-2xl font-display font-bold mb-2">Go Premium</h2>
              <p className="text-muted-foreground">Unlock all features with a voucher code</p>
            </div>

            <div className="space-y-4 mb-8">
              {["Advanced analytics & reports", "AI-powered food analysis", "Priority support", "Extended history"].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-accent">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <form onSubmit={redeemVoucher} className="flex gap-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter voucher code"
                className="flex-1 uppercase"
                required
              />
              <Button type="submit" disabled={redeeming}>
                <Sparkles size={16} className="mr-1" />
                {redeeming ? "Redeeming..." : "Redeem"}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
