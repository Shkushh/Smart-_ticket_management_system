import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle2, Clock, Ticket, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type TicketType = {
  id: string;
  title: string;
  description: string;
  status: Database['public']['Enums']['ticket_status'];
  priority: Database['public']['Enums']['ticket_priority'];
  created_at: string;
  customer_id: string;
  agent_id: string | null;
};

type Stats = {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
};

const statusColors: Record<string, string> = {
  open: "bg-primary",
  in_progress: "bg-warning",
  resolved: "bg-success",
  closed: "bg-muted",
};

const AgentDashboard = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('agent-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load tickets");
    } else {
      setTickets(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

  const calculateStats = (ticketData: TicketType[]) => {
    const stats = {
      total: ticketData.length,
      open: ticketData.filter(t => t.status === 'open').length,
      in_progress: ticketData.filter(t => t.status === 'in_progress').length,
      resolved: ticketData.filter(t => t.status === 'resolved').length,
    };
    setStats(stats);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('tickets')
      .update({ 
        status: newStatus as Database['public']['Enums']['ticket_status'], 
        agent_id: user.id 
      })
      .eq('id', ticketId);

    if (error) {
      toast.error("Failed to update ticket");
    } else {
      toast.success("Ticket updated successfully");
      fetchTickets();
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Agent Dashboard</h2>
        <p className="text-muted-foreground">Manage and resolve service requests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Tickets" value={stats.total} icon={Ticket} color="text-primary" />
        <StatCard title="Open" value={stats.open} icon={Clock} color="text-primary" />
        <StatCard title="In Progress" value={stats.in_progress} icon={TrendingUp} color="text-warning" />
        <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle2} color="text-success" />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        {['all', 'open', 'in_progress', 'resolved'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tickets
                  .filter(t => status === 'all' || t.status === status)
                  .map((ticket) => (
                    <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle>{ticket.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{ticket.description}</CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge className={statusColors[ticket.status]}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleStatusChange(ticket.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AgentDashboard;
