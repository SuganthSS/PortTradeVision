import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import csvParser from "csv-parser";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { subDays, subMonths, format, startOfDay, endOfDay } from "date-fns";
import { Readable } from "stream";
import OpenAI from "openai";
import bcrypt from "bcrypt";

const SessionStore = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

function requireAuth(req: Request, res: Response, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "porttrade-vision-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }

        req.session.userId = user.id;
        res.json({ message: "Login successful", user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/ports", requireAuth, async (req: Request, res: Response) => {
    try {
      const ports = await storage.getAllPorts();
      res.json(ports);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch ports" });
    }
  });

  app.get("/api/products", requireAuth, async (req: Request, res: Response) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch products" });
    }
  });

  app.get("/api/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const lastMonth = subMonths(now, 1);
      const transactions = await storage.getTransactionsByDateRange(lastMonth, now);

      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonth = subMonths(currentMonth, 1);

      const currentMonthTransactions = transactions.filter(
        (t) => new Date(t.date) >= currentMonth
      );
      const previousMonthTransactions = await storage.getTransactionsByDateRange(
        previousMonth,
        currentMonth
      );

      const totalImports = transactions
        .filter((t) => t.type === "import")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const totalExports = transactions
        .filter((t) => t.type === "export")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const currentImports = currentMonthTransactions
        .filter((t) => t.type === "import")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const previousImports = previousMonthTransactions
        .filter((t) => t.type === "import")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const currentExports = currentMonthTransactions
        .filter((t) => t.type === "export")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const previousExports = previousMonthTransactions
        .filter((t) => t.type === "export")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const importChange = previousImports
        ? ((currentImports - previousImports) / previousImports) * 100
        : 0;

      const exportChange = previousExports
        ? ((currentExports - previousExports) / previousExports) * 100
        : 0;

      const totalValue = transactions.reduce((sum, t) => sum + parseFloat(t.value), 0);
      const activePorts = new Set(transactions.map((t) => t.portId)).size;
      const topProducts = new Set(transactions.map((t) => t.productId)).size;

      res.json({
        totalImports: Math.round(totalImports),
        totalExports: Math.round(totalExports),
        totalValue: Math.round(totalValue),
        activePorts,
        topProducts,
        importChange: parseFloat(importChange.toFixed(1)),
        exportChange: parseFloat(exportChange.toFixed(1)),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
    }
  });

  app.get("/api/chart-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      const transactions = await storage.getTransactionsByDateRange(sixMonthsAgo, now);

      const monthlyData = new Map<string, { imports: number; exports: number }>();
      transactions.forEach((t) => {
        const month = format(new Date(t.date), "MMM");
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { imports: 0, exports: 0 });
        }
        const data = monthlyData.get(month)!;
        if (t.type === "import") {
          data.imports += parseFloat(t.quantity);
        } else {
          data.exports += parseFloat(t.quantity);
        }
      });

      const monthly = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        imports: Math.round(data.imports),
        exports: Math.round(data.exports),
      }));

      const products = await storage.getAllProducts();
      const productData = new Map<string, number>();
      transactions.forEach((t) => {
        const current = productData.get(t.productId) || 0;
        productData.set(t.productId, current + parseFloat(t.value));
      });

      const topProducts = Array.from(productData.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, value]) => {
          const product = products.find((p) => p.id === productId);
          return {
            name: product?.name || "Unknown",
            value: Math.round(value),
          };
        });

      res.json({ monthly, topProducts });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch chart data" });
    }
  });

  app.get("/api/transactions/recent", requireAuth, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      const ports = await storage.getAllPorts();
      const products = await storage.getAllProducts();

      const recentTransactions = transactions.slice(0, 10).map((transaction) => ({
        ...transaction,
        port: ports.find((p) => p.id === transaction.portId),
        product: products.find((p) => p.id === transaction.productId),
      }));

      res.json(recentTransactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch transactions" });
    }
  });

  app.get("/api/query", requireAuth, async (req: Request, res: Response) => {
    try {
      const { dateRange, selectedPort, selectedProduct, selectedType, customStartDate, customEndDate } = req.query;

      let startDate: Date;
      let endDate: Date;

      if (dateRange === "custom" && customStartDate && customEndDate) {
        startDate = startOfDay(new Date(customStartDate as string));
        endDate = endOfDay(new Date(customEndDate as string));
      } else {
        endDate = new Date();
        switch (dateRange) {
          case "7days":
            startDate = subDays(endDate, 7);
            break;
          case "30days":
            startDate = subDays(endDate, 30);
            break;
          case "3months":
            startDate = subMonths(endDate, 3);
            break;
          case "6months":
            startDate = subMonths(endDate, 6);
            break;
          default:
            startDate = subDays(endDate, 30);
        }
      }

      let transactions = await storage.getTransactionsByFilters({
        startDate,
        endDate,
        portId: selectedPort as string,
        productId: selectedProduct as string,
        type: selectedType as string,
      });

      const ports = await storage.getAllPorts();
      const products = await storage.getAllProducts();

      const transactionsWithDetails = transactions.map((t) => {
        const port = ports.find((p) => p.id === t.portId);
        const product = products.find((p) => p.id === t.productId);
        return {
          ...t,
          port: port || { id: t.portId, name: "Unknown", code: "UNK", location: "", country: "" },
          product: product || { id: t.productId, name: "Unknown", code: "UNK", category: "" },
        };
      });

      const chartDataMap = new Map<string, { imports: number; exports: number }>();
      transactions.forEach((t) => {
        const date = format(new Date(t.date), "MMM dd");
        if (!chartDataMap.has(date)) {
          chartDataMap.set(date, { imports: 0, exports: 0 });
        }
        const data = chartDataMap.get(date)!;
        if (t.type === "import") {
          data.imports += parseFloat(t.quantity);
        } else {
          data.exports += parseFloat(t.quantity);
        }
      });

      const chartData = Array.from(chartDataMap.entries())
        .map(([date, data]) => ({
          date,
          imports: Math.round(data.imports),
          exports: Math.round(data.exports),
        }))
        .slice(-20);

      const totalImports = transactions
        .filter((t) => t.type === "import")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const totalExports = transactions
        .filter((t) => t.type === "export")
        .reduce((sum, t) => sum + parseFloat(t.quantity), 0);

      const totalValue = transactions.reduce((sum, t) => sum + parseFloat(t.value), 0);

      res.json({
        transactions: transactionsWithDetails.slice(0, 50),
        chartData,
        summary: {
          totalImports: Math.round(totalImports),
          totalExports: Math.round(totalExports),
          totalValue: Math.round(totalValue),
          count: transactions.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to query data" });
    }
  });

  // Upload route — diagnostic mode using csv-parser (no require)
  app.post("/api/upload", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      // Ensure file exists
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded (diagnostic)" });
      }

      // Ensure mapping exists
      if (!req.body.mapping) {
        return res.status(400).json({ message: "Column mapping is required" });
      }

      // Parse mapping
      let mapping: Record<string, string>;
      try {
        mapping = JSON.parse(req.body.mapping);
      } catch (err) {
        return res.status(400).json({ message: "Invalid mapping format" });
      }

      // Convert buffer to readable stream and parse CSV using csv-parser
      const fileBuffer = req.file.buffer;
      const stream = Readable.from(fileBuffer.toString("utf8"));

      const rows: any[] = [];
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on("data", (row) => rows.push(row))
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });

      if (!rows || rows.length === 0) {
        return res.status(400).json({ message: "CSV file is empty or has no data rows" });
      }

      // Diagnostic processing: map, normalize and validate each row (no DB writes)
      const results: Array<{ rowIndex: number; mapped: any; success: boolean; error?: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const mapped: any = {
            date: mapping.date ? row[mapping.date] : (row.date ?? row.Date ?? row["Date"]),
            port: mapping.port ? row[mapping.port] : (row.port ?? row.Port ?? row["Port"] ?? row["Port Name"]),
            product: mapping.product ? row[mapping.product] : (row.product ?? row.Product ?? row["Product"]),
            type: mapping.type ? row[mapping.type] : (row.type ?? row.Type ?? row["Type"]),
            quantity: mapping.quantity ? row[mapping.quantity] : (row.quantity ?? row.Quantity ?? row["Qty"]),
            value: mapping.value ? row[mapping.value] : (row.value ?? row.Value ?? row["Amount"]),
          };

          // Normalization: DD-MM-YYYY -> YYYY-MM-DD
          if (mapped.date && typeof mapped.date === "string" && mapped.date.includes("-")) {
            const parts = mapped.date.split("-");
            if (parts.length === 3 && parts[2].length === 4) {
              mapped.date = `${parts[2].padStart(4, "0")}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            }
          }

          // Numeric cleanup: remove commas & parse
          const q = mapped.quantity ? Number(String(mapped.quantity).replace(/,/g, "").trim()) : null;
          const v = mapped.value ? Number(String(mapped.value).replace(/,/g, "").trim()) : null;
          mapped.quantity = Number.isFinite(q) ? q : null;
          mapped.value = Number.isFinite(v) ? v : null;

          // Basic validation
          if (!mapped.date || !mapped.port || !mapped.product) {
            throw new Error("Missing required field(s): date, port or product");
          }

          // Validate type if present
          if (mapped.type) {
            const tv = mapped.type.toString().trim().toLowerCase();
            if (tv !== "import" && tv !== "export") {
              throw new Error(`Invalid transaction type: ${mapped.type}`);
            }
            mapped.type = tv;
          }

          // Row OK
          results.push({ rowIndex: i + 1, mapped, success: true });
        } catch (err: any) {
          results.push({
            rowIndex: i + 1,
            mapped: row,
            success: false,
            error: (err && err.message) ? err.message : String(err),
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      return res.json({
        message: `Diagnostic: parsed ${results.length} rows`,
        total: results.length,
        successCount,
        failCount,
        results,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Diagnostic upload failed" });
    }
  });

  // Chatbot route — uses local handlers for known patterns and OpenAI for others.
  app.post("/api/chatbot", requireAuth, async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const lowerMessage = message.toLowerCase();
      let response = "";
      let useOpenAI = false;

      if (
        lowerMessage.includes("export") &&
        (lowerMessage.includes("naphtha") || lowerMessage.includes("week"))
      ) {
        const weekAgo = subDays(new Date(), 7);
        const transactions = await storage.getTransactionsByFilters({
          startDate: weekAgo,
          endDate: new Date(),
          type: "export",
        });

        const products = await storage.getAllProducts();
        const naphtha = products.find((p) => p.name.toLowerCase().includes("naphtha"));

        if (naphtha) {
          const naphthaExports = transactions.filter((t) => t.productId === naphtha.id);
          const total = naphthaExports.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
          response = `This week, we exported ${Math.round(total)} MT of Naphtha across ${naphthaExports.length} transactions.`;
        } else {
          response = "I couldn't find Naphtha export data for this week.";
        }
      } else if (lowerMessage.includes("top") && lowerMessage.includes("port")) {
        const transactions = await storage.getAllTransactions();
        const ports = await storage.getAllPorts();
        const portVolumes = new Map<string, number>();

        transactions.forEach((t) => {
          const current = portVolumes.get(t.portId) || 0;
          portVolumes.set(t.portId, current + parseFloat(t.quantity));
        });

        const topPorts = Array.from(portVolumes.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([portId, volume]) => {
            const port = ports.find((p) => p.id === portId);
            return `${port?.name}: ${Math.round(volume)} MT`;
          });

        response = `The top importing/exporting ports are: ${topPorts.join(", ")}`;
      } else if (lowerMessage.includes("import") && lowerMessage.includes("month")) {
        const monthAgo = subMonths(new Date(), 1);
        const transactions = await storage.getTransactionsByFilters({
          startDate: monthAgo,
          endDate: new Date(),
          type: "import",
        });

        const total = transactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
        response = `This month, total imports were ${Math.round(total)} MT across ${transactions.length} transactions.`;
      } else if (lowerMessage.includes("help") || lowerMessage.includes("what can you")) {
        response =
          "I can help you with queries like:\n• 'Show exports of Naphtha this week'\n• 'What are the top importing ports?'\n• 'Total imports this month'\n• 'Export trends'\nJust ask me anything about your import/export data!";
      } else {
        useOpenAI = true;
      }

      if (useOpenAI && process.env.OPENAI_API_KEY) {
        try {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 10000,
          });

          const transactions = await storage.getAllTransactions();
          const ports = await storage.getAllPorts();
          const products = await storage.getAllProducts();

          const context = `You are a helpful assistant for PortTrade Vision, an import/export analytics platform.
- Total transactions: ${transactions.length}
- Ports: ${ports.map((p) => p.name).join(", ")}
- Products: ${products.map((p) => p.name).join(", ")}

Provide helpful insights based on this data. Keep responses concise and professional.`;

          // Try older chat.completions API first, else fallback to responses API
          let aiText = "";
          if (openai.chat && openai.chat.completions && typeof openai.chat.completions.create === "function") {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: context },
                { role: "user", content: message },
              ],
              max_tokens: 300,
            });
            aiText = completion.choices?.[0]?.message?.content ?? "";
          } else if (openai.responses && typeof openai.responses.create === "function") {
            const resp = await openai.responses.create({
              model: "gpt-4o-mini",
              input: [
                { role: "system", content: context },
                { role: "user", content: message },
              ],
              max_output_tokens: 300,
            });

            aiText = resp.output_text || "";
          } else {
            throw new Error("OpenAI SDK does not expose compatible methods (check package version).");
          }

          response = aiText || "I'm sorry, I couldn't process that request.";
        } catch (error: any) {
          console.error("OpenAI error:", error);
          response =
            "I understand you're asking about trade data. Try questions like 'Show exports of Naphtha this week' or 'What are the top importing ports?' for specific insights.";
        }
      } else if (useOpenAI && !process.env.OPENAI_API_KEY) {
        response =
          "I understand you're asking about trade data. Try questions like 'Show exports of Naphtha this week' or 'What are the top importing ports?' for specific insights.";
      }

      res.json({ message: response });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Chatbot error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
