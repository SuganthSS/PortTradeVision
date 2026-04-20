import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Download, Search } from "lucide-react";
import { format, subDays, subMonths, subWeeks } from "date-fns";
import type { Transaction, Port, Product } from "@shared/schema";

type DateRange = "7days" | "30days" | "3months" | "6months" | "custom";

export default function Query() {
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedPort, setSelectedPort] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: ports } = useQuery<Port[]>({
    queryKey: ["/api/ports"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: results, isLoading } = useQuery<{
    transactions: Array<Transaction & { port: Port; product: Product }>;
    chartData: Array<{ date: string; imports: number; exports: number }>;
    summary: { totalImports: number; totalExports: number; totalValue: number; count: number };
  }>({
    queryKey: ["/api/query", dateRange, selectedPort, selectedProduct, selectedType, customStartDate, customEndDate],
    enabled: dateRange !== "custom" || (customStartDate !== "" && customEndDate !== ""),
    queryFn: async () => {
      const params = new URLSearchParams({
        dateRange,
        selectedPort,
        selectedProduct,
        selectedType,
      });
      
      if (dateRange === "custom" && customStartDate && customEndDate) {
        params.set("customStartDate", customStartDate);
        params.set("customEndDate", customEndDate);
      }
      
      const res = await fetch(`/api/query?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return res.json();
    },
  });

  function getDateRangeText() {
    if (dateRange === "custom" && customStartDate && customEndDate) {
      return `${format(new Date(customStartDate), "MMM d, yyyy")} - ${format(new Date(customEndDate), "MMM d, yyyy")}`;
    }
    const ranges = {
      "7days": "Last 7 Days",
      "30days": "Last 30 Days",
      "3months": "Last 3 Months",
      "6months": "Last 6 Months",
      "custom": "Custom Range",
    };
    return ranges[dateRange];
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-foreground mb-2">Query Data</h2>
          <p className="text-muted-foreground">Filter and analyze import/export transactions</p>
        </div>

        <Card className="mb-8" data-testid="card-filters">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date Range</label>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Start Date</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      data-testid="input-custom-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">End Date</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      data-testid="input-custom-end-date"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2" style={{ gridColumn: dateRange === "custom" ? "1" : "auto" }}>
                <label className="text-sm font-medium text-foreground">Port</label>
                <Select value={selectedPort} onValueChange={setSelectedPort}>
                  <SelectTrigger data-testid="select-port">
                    <SelectValue placeholder="All Ports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ports</SelectItem>
                    {ports?.map((port) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card data-testid="card-summary-imports">
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Imports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-query-imports">
                    {results?.summary.totalImports.toLocaleString() || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">MT</p>
                </CardContent>
              </Card>

              <Card data-testid="card-summary-exports">
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Exports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-query-exports">
                    {results?.summary.totalExports.toLocaleString() || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">MT</p>
                </CardContent>
              </Card>

              <Card data-testid="card-summary-value">
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold font-mono text-foreground" data-testid="text-query-value">
                    ${results?.summary.totalValue.toLocaleString() || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{results?.summary.count || 0} transactions</p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-results">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0">
                <CardTitle className="text-foreground">
                  Results for {getDateRangeText()}
                </CardTitle>
                <Button variant="outline" size="sm" data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="chart" data-testid="tabs-results">
                  <TabsList className="mb-4">
                    <TabsTrigger value="chart" data-testid="tab-chart">Chart View</TabsTrigger>
                    <TabsTrigger value="table" data-testid="tab-table">Table View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="chart">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={results?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
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
                  </TabsContent>
                  <TabsContent value="table">
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
                        {results?.transactions.map((transaction) => (
                          <TableRow key={transaction.id} data-testid={`row-query-${transaction.id}`}>
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
