# PortTrade Vision

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192?style=for-the-badge&logo=postgresql)

---

## 📋 Project Description

**PortTrade Vision** is a full-stack, enterprise-grade web application designed to monitor, analyze, and query import and export trade data. It provides decision-makers and data analysts with powerful tools to gain actionable insights from their trade operations.

The platform combines interactive dashboards for real-time KPI monitoring, advanced data querying capabilities with flexible filtering, CSV import functionality for seamless data ingestion, and an AI-powered chatbot assistant that enables natural language queries against trade data. With secure authentication and an intuitive user interface, PortTrade Vision streamlines trade data analysis and empowers businesses to make data-driven decisions in the global commerce space.

**Key Capabilities:**
- Real-time monitoring of import/export metrics
- Intelligent data analysis with natural language queries
- Bulk data ingestion through CSV uploads
- Advanced filtering and custom reporting
- AI-assisted insights and recommendations

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling |
| shadcn/ui + Radix UI | Pre-built accessible components |
| Recharts | Data visualization |
| React Hook Form + Zod | Forms and validation |
| TanStack React Query | Data fetching and caching |
| Wouter | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | API framework |
| TypeScript | Type safety |
| Passport.js | Authentication |
| Multer | File uploads |
| CSV Parser | Trade data processing |
| OpenAI SDK | AI chatbot |
| Drizzle ORM | Database layer |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database |
| Drizzle ORM | Type-safe queries |
| MemStorage | In-memory storage (dev) |

---

## ✨ Features

- **Interactive Dashboard** — KPI cards, monthly trends, top products, recent transactions
- **Advanced Querying** — Filter by date range, ports, products, and transaction type
- **CSV Data Ingestion** — Drag-and-drop upload with column mapping
- **AI Chatbot** — Natural language queries against your trade data
- **Secure Authentication** — Session-based login with bcrypt password hashing

**Demo credentials:** `demo@hpcl.com` / `DemoPass123`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **npm** or **yarn**
- **OpenAI API Key** (for AI chatbot functionality)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/SuganthSS/PortTradeVision.git
cd PortTradeVision
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Environment Setup

Create a `.env` file in the project root:

```env
PORT=5000
SESSION_SECRET=your_secure_session_secret_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Getting an OpenAI API Key:**
1. Visit [OpenAI API Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file

#### 4. Start the Development Server

```bash
npm run dev
```

This starts both the Vite frontend dev server and Express backend concurrently.

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

#### 5. Login with Demo Credentials
```
Email: demo@hpcl.com
Password: DemoPass123
```

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
PortTradeVision/
├── client/              # React frontend (Vite)
│   └── src/
│       ├── components/  # UI components & Chatbot
│       ├── pages/       # Dashboard, Login, Query, Upload
│       └── lib/         # React Query & utilities
├── server/              # Express backend
│   ├── index.ts         # Server & middleware
│   ├── routes.ts        # API endpoints
│   └── storage.ts       # In-memory database
├── shared/              # Shared schemas (Zod & Drizzle)
└── Configuration files  # tsconfig, vite.config, tailwind, etc.
```

---

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | User login |
| GET | `/api/transactions` | Fetch transactions |
| POST | `/api/transactions/query` | Advanced filtering |
| POST | `/api/upload` | Upload CSV file |
| POST | `/api/chat` | AI chatbot query |
| GET | `/api/dashboard/stats` | KPI statistics |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `SESSION_SECRET` | Yes | Session encryption secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key for chatbot |

---

## 📄 License

MIT License

---

> Empowering global trade through intelligent analytics 📊
