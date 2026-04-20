import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Ship, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/query", label: "Query" },
  { path: "/upload", label: "Upload" },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Ship className="w-8 h-8 text-primary" data-testid="icon-logo" />
              <h1 className="text-xl font-semibold text-foreground">PortTrade Vision</h1>
            </div>
            <nav className="flex items-center gap-1" data-testid="nav-main">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={location === item.path ? "secondary" : "ghost"}
                    data-testid={`button-nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
