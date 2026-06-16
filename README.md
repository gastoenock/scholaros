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

# 4. Local DNS for tenant subdomains (Mac)
php artisan tenancy:local-setup
# Copy the printed lines into /etc/hosts, then:

# 5. Run dev servers (two terminals)
php artisan serve --host=0.0.0.0 --port=8000
npm run dev
```

Set `APP_URL=http://scholaros.test:8000` in `.env` so generated links include port `:8000`.

Sessions must stay on the **central** database (`SESSION_CONNECTION=central` in `.env`). Tenant databases do not have a `sessions` table — without this, login on a school subdomain returns **419 Page Expired**.

If you still see 419 after updating `.env`, clear cookies for `.scholaros.test` in your browser and try again.

**Important:** With `php artisan serve`, always include **`:8000`** in the URL. Visiting `http://abama-international.scholaros.test/login` (no port) hits Apache on port 80 and returns a server 404 — not Laravel.

| URL | Purpose |
|---|---|
| http://scholaros.test:8000/login/platform | Platform / superadmin login |
| http://scholaros.test:8000/login | School portal picker |
| http://abama-international.scholaros.test:8000/login | ABAMA school admin login |

Without `/etc/hosts`, platform login still works at http://127.0.0.1:8000/login/platform.

## Demo logins

| Role | URL | Email | Password |
|---|---|---|---|
| Platform superadmin | http://scholaros.test:8000/login/platform | `superadmin@scholaros.test` | `password` |
| School admin (ABAMA) | http://abama-international.scholaros.test:8000/login | `admin@abama.edu.gh` | `password` |

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
