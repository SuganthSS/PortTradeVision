import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Ship, TrendingUp, Globe, ArrowRight } from "lucide-react";

const sampleImportData = [
  { month: "Jan", imports: 4200, exports: 2800 },
  { month: "Feb", imports: 3900, exports: 3200 },
  { month: "Mar", imports: 5100, exports: 3600 },
  { month: "Apr", imports: 4700, exports: 3900 },
  { month: "May", imports: 5300, exports: 4200 },
  { month: "Jun", imports: 4900, exports: 3800 },
];

const exportTrendData = [
  { month: "Jan", value: 2800 },
  { month: "Feb", value: 3200 },
  { month: "Mar", value: 3600 },
  { month: "Apr", value: 3900 },
  { month: "May", value: 4200 },
  { month: "Jun", value: 3800 },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ship className="w-8 h-8 text-primary" data-testid="icon-logo" />
            <h1 className="text-2xl font-semibold text-foreground">PortTrade Vision</h1>
          </div>
          <Link href="/login">
            <Button data-testid="button-login">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-foreground mb-4">
              Enterprise Import/Export Analytics
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real-time visibility into global trade operations with AI-powered insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card data-testid="card-kpi-1">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
                <TrendingUp className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-total-volume">28,450</div>
                <p className="text-sm text-muted-foreground mt-1">MT this quarter</p>
              </CardContent>
            </Card>

            <Card data-testid="card-kpi-2">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Ports</CardTitle>
                <Globe className="w-5 h-5 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-active-ports">12</div>
                <p className="text-sm text-muted-foreground mt-1">Across regions</p>
              </CardContent>
            </Card>

            <Card data-testid="card-kpi-3">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Growth Rate</CardTitle>
                <TrendingUp className="w-5 h-5 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-growth-rate">+12.5%</div>
                <p className="text-sm text-muted-foreground mt-1">Year over year</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <Card data-testid="card-chart-imports">
              <CardHeader>
                <CardTitle className="text-foreground">Import/Export Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sampleImportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="imports" fill="hsl(var(--chart-1))" name="Imports (MT)" />
                    <Bar dataKey="exports" fill="hsl(var(--chart-2))" name="Exports (MT)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-chart-exports">
              <CardHeader>
                <CardTitle className="text-foreground">Export Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={exportTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }} 
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Volume (MT)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary text-primary-foreground mb-16" data-testid="card-cta">
            <CardContent className="p-12 text-center">
              <h3 className="text-3xl font-semibold mb-4">Ready to get started?</h3>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Access comprehensive analytics, AI-powered insights, and real-time data visualization
              </p>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="gap-2" data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">PortTrade Vision</h4>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade import/export analytics platform for HPCL
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Real-time Analytics</li>
                <li>AI-Powered Insights</li>
                <li>Custom Reporting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Documentation</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6">
            <p className="text-sm text-center text-muted-foreground">
              © 2025 HPCL. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
