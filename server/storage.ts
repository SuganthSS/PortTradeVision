import {
  type User,
  type InsertUser,
  type Port,
  type InsertPort,
  type Product,
  type InsertProduct,
  type Transaction,
  type InsertTransaction,
  insertTransactionSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

export interface IStorage {
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllPorts(): Promise<Port[]>;
  getPort(id: string): Promise<Port | undefined>;
  createPort(port: InsertPort): Promise<Port>;
  
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  getAllTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  getTransactionsByFilters(filters: {
    startDate?: Date;
    endDate?: Date;
    portId?: string;
    productId?: string;
    type?: string;
  }): Promise<Transaction[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private ports: Map<string, Port>;
  private products: Map<string, Product>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.ports = new Map();
    this.products = new Map();
    this.transactions = new Map();
    this.seedData();
  }

  private seedData() {
    const hashedPassword = bcrypt.hashSync("DemoPass123", 10);
    const demoUser: User = {
      id: randomUUID(),
      email: "demo@hpcl.com",
      password: hashedPassword,
      name: "Demo User",
    };
    this.users.set(demoUser.id, demoUser);

    const ports: Port[] = [
      { id: "port1", name: "Mumbai Port", code: "MUM", location: "Mumbai", country: "India" },
      { id: "port2", name: "Chennai Port", code: "CHE", location: "Chennai", country: "India" },
      { id: "port3", name: "Kandla Port", code: "KAN", location: "Kandla", country: "India" },
      { id: "port4", name: "Visakhapatnam Port", code: "VIS", location: "Visakhapatnam", country: "India" },
      { id: "port5", name: "Kochi Port", code: "KOC", location: "Kochi", country: "India" },
    ];
    ports.forEach((port) => this.ports.set(port.id, port));

    const products: Product[] = [
      { id: "prod1", name: "Naphtha", code: "NAP", category: "Petrochemicals", unit: "MT" },
      { id: "prod2", name: "Crude Oil", code: "CRU", category: "Oil", unit: "MT" },
      { id: "prod3", name: "LPG", code: "LPG", category: "Gas", unit: "MT" },
      { id: "prod4", name: "Diesel", code: "DIE", category: "Fuel", unit: "MT" },
      { id: "prod5", name: "Petrol", code: "PET", category: "Fuel", unit: "MT" },
    ];
    products.forEach((product) => this.products.set(product.id, product));

    const transactions: Transaction[] = [];
    const types = ["import", "export"];
    const portIds = ports.map((p) => p.id);
    const productIds = products.map((p) => p.id);

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));

      transactions.push({
        id: `trans${i + 1}`,
        date,
        portId: portIds[Math.floor(Math.random() * portIds.length)],
        productId: productIds[Math.floor(Math.random() * productIds.length)],
        type: types[Math.floor(Math.random() * types.length)],
        quantity: (Math.random() * 5000 + 1000).toFixed(2),
        value: (Math.random() * 5000000 + 500000).toFixed(2),
      });
    }
    transactions.forEach((transaction) => this.transactions.set(transaction.id, transaction));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, name: insertUser.email };
    this.users.set(id, user);
    return user;
  }

  async getAllPorts(): Promise<Port[]> {
    return Array.from(this.ports.values());
  }

  async getPort(id: string): Promise<Port | undefined> {
    return this.ports.get(id);
  }

  async createPort(insertPort: InsertPort): Promise<Port> {
    const id = randomUUID();
    const port: Port = { ...insertPort, id };
    this.ports.set(id, port);
    return port;
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const validated = insertTransactionSchema.parse(insertTransaction);
    const transaction: Transaction = { ...validated, id };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  async getTransactionsByFilters(filters: {
    startDate?: Date;
    endDate?: Date;
    portId?: string;
    productId?: string;
    type?: string;
  }): Promise<Transaction[]> {
    let results = Array.from(this.transactions.values());

    if (filters.startDate) {
      results = results.filter((t) => new Date(t.date) >= filters.startDate!);
    }

    if (filters.endDate) {
      results = results.filter((t) => new Date(t.date) <= filters.endDate!);
    }

    if (filters.portId && filters.portId !== "all") {
      results = results.filter((t) => t.portId === filters.portId);
    }

    if (filters.productId && filters.productId !== "all") {
      results = results.filter((t) => t.productId === filters.productId);
    }

    if (filters.type && filters.type !== "all") {
      results = results.filter((t) => t.type === filters.type);
    }

    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const storage = new MemStorage();