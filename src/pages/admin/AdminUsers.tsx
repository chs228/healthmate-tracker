import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Ban, CheckCircle } from "lucide-react";

interface UserRow {
  id: string;
  user_id: string;
  full_name: string | null;
  is_premium: boolean;
  suspended: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data as UserRow[]);
  };

  useEffect(() => { fetchUsers(); }, []);

  const togglePremium = async (userId: string, current: boolean) => {
    const expiry = !current ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() : null;
    await supabase.from("profiles").update({
      is_premium: !current,
      premium_expiry: expiry,
    }).eq("user_id", userId);
    toast.success(!current ? "Premium activated" : "Premium revoked");
    fetchUsers();
  };

  const toggleSuspend = async (userId: string, current: boolean) => {
    await supabase.from("profiles").update({ suspended: !current }).eq("user_id", userId);
    toast.success(!current ? "User suspended" : "User unsuspended");
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-bold">User Management</h1>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Premium</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="p-4 font-medium">{u.full_name || "Unknown"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${u.suspended ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>
                      {u.suspended ? <Ban size={12} /> : <CheckCircle size={12} />}
                      {u.suspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.is_premium && <Crown size={16} className="text-primary" />}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => togglePremium(u.user_id, u.is_premium)}>
                      {u.is_premium ? "Revoke Premium" : "Give Premium"}
                    </Button>
                    <Button size="sm" variant={u.suspended ? "default" : "destructive"} onClick={() => toggleSuspend(u.user_id, u.suspended)}>
                      {u.suspended ? "Unsuspend" : "Suspend"}
                    </Button>
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
