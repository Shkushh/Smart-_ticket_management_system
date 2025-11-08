import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserRole, UserRole } from "@/lib/supabase";
import CustomerDashboard from "@/components/dashboard/CustomerDashboard";
import AgentDashboard from "@/components/dashboard/AgentDashboard";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
      setLoading(false);
    };

    fetchRole();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Smart Service Desk</h1>
            <p className="text-sm text-muted-foreground capitalize">{role} Dashboard</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {role === "customer" && <CustomerDashboard />}
        {role === "agent" && <AgentDashboard />}
        {!role && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No role assigned. Please contact support.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
