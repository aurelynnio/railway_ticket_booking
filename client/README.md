# Railway Ticket Booking — Frontend Client

A modern, high-performance web application for train ticket booking, schedule browsing, seat selection, and ticket management built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**.

This frontend client interacts with the [Railway Ticket Booking Backend Services](https://github.com/aurelynnio/railway_ticket_booking) via a centralized NestJS API Gateway.

---

## 🌟 Key Features

* **Train Schedule & Ticket Search**: Search routes, filter by time of day, train code, station, and seat class.
* **Interactive Carriage & Seat Selection**: Visual coach layouts with real-time seat availability (soft seats, hard seats, 4-berth and 6-berth sleepers).
* **Voucher & Promotion Engine**: Apply coupon codes with instant discount calculations and validations.
* **Payment Integration**: Seamless checkout flow with VNPay gateway integration and real-time status callbacks.
* **Electronic Boarding Passes & QR Codes**: Dynamic client-side QR code generation for gate check-in and booking lookup.
* **Order & Ticket Management**: Real-time order tracking, cancellation, refund requests, and PDF/printable boarding passes.
* **Authentication & Profiles**: Cookie-based HttpOnly JWT authentication, token refresh deduplication, and Google OAuth flow.
* **Admin Management Console**: Dedicated portal for managing routes, schedules, ticket inventories, orders, payments, and users.
* **Responsive & Accessible Design**: Crafted using Radix UI primitives, shadcn/ui components, and smooth GSAP animations.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack
* **Core Library**: [React 19](https://react.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **State & Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest) & [Zustand](https://zustand-demo.pmnd.rs/)
* **Form & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
* **UI Components**: [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Animations**: [GSAP](https://gsap.com/) & `@gsap/react`
* **HTTP Client**: [Axios](https://axios-http.com/) with automatic refresh-token deduplication

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) >= 20.x
* [npm](https://www.npmjs.com/) >= 10.x

### 1. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/<your-username>/railway-ticket-client.git
cd railway-ticket-client
npm install
```

### 2. Environment Configuration

Copy the example environment configuration file:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

```env
# URL of the backend API Gateway (or reverse proxy)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> **Note**: Variables prefixed with `NEXT_PUBLIC_` are baked into the client bundle at build time by Next.js. If you deploy to production (e.g. Vercel or Docker), set this to your public API Gateway domain (e.g. `https://api.yourdomain.com`).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack and hot reload |
| `npm run build` | Compiles and optimizes production build (`.next`) |
| `npm run start` | Runs the production Next.js server (requires `npm run build` first) |
| `npm run lint` | Runs ESLint checks across the codebase |

---

## 🐳 Docker Deployment

You can build and run this client as a standalone Docker container.

### Build Docker Image

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  -t railway-ticket-client .
```

### Run Container

```bash
docker run -d \
  -p 3000:3000 \
  --name railway-ticket-client \
  railway-ticket-client
```

Access the application at `http://localhost:3000`.

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. In the Vercel project settings, add the environment variable:
   * `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com` (your production backend API Gateway URL).
4. Click **Deploy**. Vercel will automatically build and distribute the app across its global Edge network.

> **Important**: Ensure your backend API Gateway allows the Vercel domain in its `CLIENT_ORIGIN` environment variable so CORS requests succeed with credentials enabled.

---

## 📂 Project Structure

```
├── app/                  # Next.js App Router (pages, layouts, route handlers)
│   ├── (auth)/           # Login, register, forgot-password
│   ├── admin/            # Admin management pages (tickets, orders, users, vouchers)
│   ├── orders/           # Order summary, detail, and checkout pages
│   ├── payments/         # Payment callbacks (VNPay return handler)
│   ├── profile/          # User profile and ticket history
│   ├── tickets/          # Ticket detail and seat booking
│   ├── globals.css       # Tailwind CSS v4 styling & design tokens
│   ├── layout.tsx        # Root layout with providers & navigation
│   └── page.tsx          # Homepage with trip search & hero section
├── components/           # Reusable UI & domain-specific components
│   ├── seat/             # Seat selection map & coach layouts
│   ├── ticket/           # Boarding passes, QR codes, search cards
│   ├── ui/               # Radix UI / shadcn/ui primitives
│   └── shell/            # Header, footer, and navigation bars
├── hooks/                # Custom React hooks (auth, tickets, orders, vouchers)
├── lib/                  # Utilities, API client (Axios), formatters, store
│   ├── http.ts           # Axios instance with refresh deduplication
│   └── stores/           # Zustand state management
├── public/               # Static assets (images, icons)
├── Dockerfile            # Multi-stage production Dockerfile
└── next.config.ts        # Next.js configuration
```

---

## 📄 License

This project is private and proprietary.
