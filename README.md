# ScholarOS

A multi-tenant school management platform built with **Laravel + Inertia.js + React 19** (converted from a Vite + Convex SPA).

## Stack

- **Backend:** Laravel 13, MySQL, session-based auth
- **Frontend:** React 19 + TypeScript via Inertia.js, Tailwind CSS v4, shadcn/radix UI
- **Build:** Vite (`laravel-vite-plugin`)

## Features

22 dashboard modules: students, staff, classes, subjects, admissions, attendance, timetable, academics (assignments / exams / online classes), library, finance (fees / payments / expenses), payroll & HR, transport, dormitory, campus (maintenance / security), meetings, assets, analytics, messages, notifications, parent portal, and superadmin school management.

## Getting started

```bash
# 1. Install dependencies
composer install
npm install

# 2. Configure environment
cp .env.example .env
php artisan key:generate
# Set DB_* values in .env (MySQL database "scholaros" by default)

# 3. Migrate and seed demo data (ABAMA International Schools)
php artisan migrate:fresh --seed

# 4. Run dev servers (two terminals)
php artisan serve
npm run dev
```

Then open http://127.0.0.1:8000.

## Demo logins

| Role | Email | Password |
|---|---|---|
| School admin | `admin@abama.edu.gh` | `password` |
| Superadmin | `superadmin@scholaros.test` | `password` |

## Project layout

- `app/Http/Controllers/` — one controller per dashboard module
- `routes/web.php` + `routes/modules/*.php` — module route files auto-loaded under `/dashboard` with `auth` middleware
- `app/Models/` — Eloquent models (serialized with camelCase keys for the React frontend)
- `resources/js/pages/` — Inertia page components
- `resources/js/components/ui/` — shadcn-style UI kit
- `database/migrations/`, `database/seeders/` — schema + demo data

## Production build

```bash
npm run build
```
