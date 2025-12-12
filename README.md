# Karnataka Companies Data App

A Next.js application to browse and export Karnataka company registration data.

## Features

- 🔐 Simple predefined user authentication
- 📊 Analytics dashboard with charts and statistics
- 📋 Browse 194,736+ company records
- 🔍 Advanced filtering and search
- ↕️ Sortable columns
- 📈 Virtualized table for smooth scrolling
- 📥 Export filtered data to Excel

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Table**: TanStack Table + TanStack Virtual
- **Database**: Neon PostgreSQL
- **Auth**: JWT (predefined users from .env)
- **Export**: xlsx library

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Configure environment variables:
   Edit `.env` file with your Neon connection string and predefined users:
   
   ```env
   DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
   USERS=admin:yourpassword,user2:password2
   ```

3. Run the development server:
   ```bash
   bun dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Users

Users are defined in the `.env` file in the format:
```
USERS=username1:password1,username2:password2
```

Both **username** and **email format** (e.g., `admin@company.com`) are accepted for login.

## Pages

- `/login` - Login page
- `/dashboard` - Analytics dashboard with charts
- `/companies` - Data table with filtering and export

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `USERS` | Comma-separated user:password pairs | `admin:pass123,demo:demo456` |
