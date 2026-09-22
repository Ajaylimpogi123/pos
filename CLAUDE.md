# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A restaurant/retail POS system: Laravel 11 (PHP 8.2) backend + Inertia.js + React (JSX) frontend, Tailwind + shadcn/ui components, built with Vite. MySQL database (`db_pos`), running under XAMPP.

## Commands

```
composer install
npm install

php artisan serve          # backend dev server
npm run dev                # vite dev server
composer run dev           # runs server + queue:listen + pail logs + vite concurrently (all-in-one dev)

npm run build               # production frontend build

php artisan migrate

vendor/bin/phpunit          # or: php artisan test
vendor/bin/phpunit --filter TestName
vendor/bin/pint             # PHP code style fixer (Laravel Pint)

php artisan printer:check {name=kitchen}   # test reachability of a configured receipt printer (cashier/kitchen/bar)
```

There is no PHP or JS linter configured beyond Pint; there's no `npm test`. Only Laravel Breeze's default auth/profile feature tests exist under `tests/` — there is no test coverage for POS domain logic (orders, stock, printing). `phpunit.xml` has the sqlite in-memory test DB lines commented out, so running the test suite hits the real `db_pos` MySQL database as configured in `.env`, not an isolated one.

## Architecture

### Route/controller organization

`routes/web.php` requires one file per domain (`category.php`, `product.php`, `menu.php`, `order.php`, `history.php`, `user.php`, `ingredient.php`, `customer.php`, `purchase.php`, `supplier.php`, `ing_conversion.php`). Controllers live flat in `app/Http/Controllers/` (no subfolders except `Auth/`), one per domain, matching the route file split.

### Database / Eloquent conventions

Every domain table uses a `tbl_` prefix (`tbl_order`, `tbl_product`, `tbl_cart`, …; `tr_role` is the one exception) and a non-standard, domain-specific primary key instead of `id` (`od_id`, `pd_id`, `cat_id`, `ing_id`, `ct_id`, `cust_id`, `oid_id`, `oii_id`, `conv_id`, `pd_ing_id`, …). `User` and `Supplier` are the only models using Laravel's default `id`/`users` conventions. Every new model must explicitly set `$table` and `$primaryKey` to match — don't assume Eloquent defaults.

### Core domain flow (ordering)

- `Cart` (`tbl_cart`) is a single shared cart, not scoped per user/session — checkout clears it entirely for everyone.
- `OrderController::store()` is the checkout entrypoint: validates per-item stock against `Product`'s linked `Ingredient`s (via the `Product_ingredient` pivot) *before* committing anything, generates `invoice_no` and a per-day `queue_no` (locked with `lockForUpdate()` to avoid race conditions across concurrent checkouts), creates the `Order` + `OrderItems`, deducts `Product.pd_qty` and each `Ingredient.ing_qty`, recomputes stock status strings (`Available` / `Low Stock` / `Out of Stock` for ingredients, `Available` / `Not Available` for products), and snapshots exactly how much of each ingredient an order item consumed into `OrderItemIngredient`. All of this happens inside one `DB::transaction`-style block.
- Cart clearing at the end of checkout uses `Cart::query()->delete()`, deliberately **not** `truncate()` — `TRUNCATE` is DDL and auto-commits any open transaction in MySQL, which silently broke the surrounding transaction when it was tried. Keep this in mind before "simplifying" similar cleanup code elsewhere.
- Kitchen ticket printing (`OrderController::printKitchen`) diffs each cart row's `ct_qty` against `ct_printed_qty` so re-clicking "print" only sends newly-added items, and only marks a row's items as printed if the specific printer that ticket was routed to actually succeeded (per-printer results, not all-or-nothing).

### Receipt printing (`app/Services/ReceiptPrinterService.php`)

Wraps `mike42/escpos-php` (ESC/POS thermal printers) behind `config/printer.php`, which defines named printer profiles (`cashier`, `kitchen`, `bar`, …) each with a connection `method` (`network` via IP:port, or `com` via serial port) and an `enabled` flag. `category_routing` maps `tbl_category.cat_id` → printer name, so items auto-route to the right physical printer (e.g. drinks → bar, food → kitchen); unmapped categories fall back to `printer.default`. The service never throws outward — every print/connect failure is caught, logged, and surfaces as a `bool` (single printer) or `array<string,bool>` (per-printer results when routing across multiple printers). Use `php artisan printer:check {name}` to test connectivity without printing.

### Frontend

Inertia + React, entry at `resources/js/app.jsx`. Pages live under `resources/js/Pages/<Domain>` mirroring the backend route/controller split (`Category`, `Customer`, `History`, `Ingredient`, `Menu`, `Order`, `Product`, `Purchase`, `Report`, `Supplier`, `User`, `Auth`, `Profile`). Shared layouts are `Layouts/AuthenticatedLayout.jsx` and `Layouts/GuestLayout.jsx`. `@/*` is aliased to `resources/js/*` (see `vite.config.js` / `jsconfig.json`). UI is shadcn/ui (`components.json`, style "new-york") with generated primitives under `resources/js/Components/ui`; `resources/js/Components/` also holds hand-written app components (nav, dashboard charts via `recharts`, data tables via `@tanstack/react-table`, drag-and-drop via `@dnd-kit`).

### Auth

Standard Laravel Breeze (session-based) scaffolding. A `Role` model/`tr_role` table exists but there is currently no role-based authorization wired up anywhere (no `Gate`, policy, or role-checking middleware) — access control is presently just the `auth` middleware.
