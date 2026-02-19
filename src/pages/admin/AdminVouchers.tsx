import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Voucher {
  id: string;
  code: string;
  duration_days: number;
  usage_limit: number;
  used_count: number;
  expiry_date: string;
  active: boolean;
}

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [code, setCode] = useState("");
  const [duration, setDuration] = useState("30");
  const [usageLimit, setUsageLimit] = useState("10");
  const [expiryDays, setExpiryDays] = useState("90");
  const [creating, setCreating] = useState(false);

  const fetchVouchers = async () => {
    const { data } = await supabase.from("vouchers").select("*").order("created_at", { ascending: false });
    if (data) setVouchers(data as Voucher[]);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const createVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(expiryDays));

    const { error } = await supabase.from("vouchers").insert({
      code: code.trim().toUpperCase(),
      duration_days: Number(duration),
      usage_limit: Number(usageLimit),
      expiry_date: expiry.toISOString(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Voucher created!");
      setCode("");
      fetchVouchers();
    }
    setCreating(false);
  };

  const deleteVoucher = async (id: string) => {
    await supabase.from("vouchers").delete().eq("id", id);
    toast.success("Voucher deleted");
    fetchVouchers();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">Voucher Management</h1>

      <form onSubmit={createVoucher} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-display font-semibold">Create Voucher</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FIT2026" className="uppercase" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Duration</label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Usage Limit</label>
            <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} min="1" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expires in (days)</label>
            <Input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} min="1" required />
          </div>
        </div>
        <Button type="submit" disabled={creating}>
          <Plus size={16} className="mr-1" /> Create Voucher
        </Button>
      </form>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Code</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Duration</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Used/Limit</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Expires</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-4 font-mono font-medium">{v.code}</td>
                  <td className="p-4 text-right">{v.duration_days}d</td>
                  <td className="p-4 text-right">{v.used_count}/{v.usage_limit}</td>
                  <td className="p-4 text-muted-foreground text-sm">{new Date(v.expiry_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {v.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button onClick={() => deleteVoucher(v.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
