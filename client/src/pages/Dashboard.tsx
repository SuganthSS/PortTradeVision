import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Ship, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Transaction, Port, Product } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalImports: number;
    totalExports: number;
    totalValue: number;
    activePorts: number;
    topProducts: number;
    importChange: number;
    exportChange: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<{
    monthly: Array<{ month: string; imports: number; exports: number }>;
    topProducts: Array<{ name: string; value: number }>;
  }>({
    queryKey: ["/api/chart-data"],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<
    Array<Transaction & { port: Port; product: Product }>
  >({
    queryKey: ["/api/transactions/recent"],
  });

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Overview of import/export operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-kpi-imports">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Imports</CardTitle>
              <ArrowDownRight className="w-5 h-5 text-chart-1" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-total-imports">
                    {stats?.totalImports?.toLocaleString() || "0"}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {(stats?.importChange || 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-chart-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <span className={`text-sm ${(stats?.importChange || 0) >= 0 ? "text-chart-4" : "text-destructive"}`}>
                      {Math.abs(stats?.importChange || 0).toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">vs last month</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-kpi-exports">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Exports</CardTitle>
              <ArrowUpRight className="w-5 h-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-total-exports">
                    {stats?.totalExports?.toLocaleString() || "0"}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {(stats?.exportChange || 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-chart-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <span className={`text-sm ${(stats?.exportChange || 0) >= 0 ? "text-chart-4" : "text-destructive"}`}>
                      {Math.abs(stats?.exportChange || 0).toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">vs last month</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-kpi-ports">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Ports</CardTitle>
              <Ship className="w-5 h-5 text-chart-3" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-active-ports">
                    {stats?.activePorts || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Across regions</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-kpi-products">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Products</CardTitle>
              <Package className="w-5 h-5 text-chart-5" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-top-products">
                    {stats?.topProducts || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Active categories</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-testid="card-chart-monthly">
            <CardHeader>
              <CardTitle className="text-foreground">Monthly Import/Export Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="imports" fill="hsl(var(--chart-1))" name="Imports (MT)" />
                    <Bar dataKey="exports" fill="hsl(var(--chart-2))" name="Exports (MT)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-chart-products">
            <CardHeader>
              <CardTitle className="text-foreground">Top Products Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData?.topProducts || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(chartData?.topProducts || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-recent-transactions">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions?.map((transaction) => (
                    <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell>{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{transaction.port?.name || "N/A"}</TableCell>
                      <TableCell>{transaction.product?.name || "N/A"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            transaction.type === "import"
                              ? "bg-chart-1/10 text-chart-1"
                              : "bg-chart-2/10 text-chart-2"
                          }`}
                        >
                          {transaction.type === "import" ? "Import" : "Export"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(transaction.quantity).toLocaleString()} MT
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${parseFloat(transaction.value).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
