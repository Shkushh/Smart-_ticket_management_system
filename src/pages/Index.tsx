import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Clock, Shield, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Smart Service Desk</h1>
          <Button onClick={() => navigate("/auth")}>
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Smart Service Request Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Streamline your support operations with real-time ticket tracking, role-based dashboards, and powerful analytics
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Start Managing Tickets
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Real-time Updates"
            description="Get instant notifications when ticket status changes"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Role-based Access"
            description="Secure dashboards for customers and agents"
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Analytics Dashboard"
            description="Track resolution metrics and system performance"
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="Efficient Workflow"
            description="Streamlined ticket management and assignment"
          />
        </div>

        <div className="bg-card rounded-lg p-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="1"
              title="Sign Up"
              description="Choose your role: Customer or Agent"
            />
            <Step
              number="2"
              title="Submit or Manage"
              description="Customers create tickets, Agents resolve them"
            />
            <Step
              number="3"
              title="Track Progress"
              description="Real-time updates on ticket status"
            />
          </div>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Smart Service Desk. Built with modern technology.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card p-6 rounded-lg border hover:shadow-md transition-shadow">
    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
      {icon}
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const Step = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="text-center">
    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
      {number}
    </div>
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;
