# db.py — PharmaKristo SQLite database layer
# Replaces data.py mock store with persistent SQLite storage.

import sqlite3
import os
from collections import defaultdict
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "pharmakristo.db")


# ─── Schema ───────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    generic     TEXT NOT NULL DEFAULT '',
    batch       TEXT NOT NULL DEFAULT '',
    qty         INTEGER NOT NULL DEFAULT 0,
    min_qty     INTEGER NOT NULL DEFAULT 0,
    expiry      TEXT NOT NULL DEFAULT '',
    cost        REAL NOT NULL DEFAULT 0,
    sell        REAL NOT NULL DEFAULT 0,
    supplier    TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'in_stock',
    low         INTEGER NOT NULL DEFAULT 0,
    expiring    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales (
    id          TEXT PRIMARY KEY,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    customer    TEXT NOT NULL DEFAULT 'Walk-in',
    total       REAL NOT NULL DEFAULT 0,
    payment     TEXT NOT NULL DEFAULT 'Cash',
    cashier     TEXT NOT NULL DEFAULT 'Araba Yeboah'
);

CREATE TABLE IF NOT EXISTS sale_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id     TEXT NOT NULL REFERENCES sales(id),
    name        TEXT NOT NULL,
    qty         INTEGER NOT NULL DEFAULT 1,
    price       REAL NOT NULL DEFAULT 0,
    total       REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'Other',
    amount      REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'cashier',
    status        TEXT NOT NULL DEFAULT 'active',
    phone         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number     TEXT NOT NULL,
    supplier      TEXT NOT NULL DEFAULT '',
    order_date    TEXT NOT NULL DEFAULT '',
    expected_date TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'pending',
    total         REAL NOT NULL DEFAULT 0,
    notes         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS po_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id        INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    qty          INTEGER NOT NULL DEFAULT 0,
    unit_cost    REAL NOT NULL DEFAULT 0,
    total        REAL NOT NULL DEFAULT 0
);
"""


# ─── Connection ───────────────────────────────────────────────────────────────

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ─── Init ─────────────────────────────────────────────────────────────────────

def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.executescript(SCHEMA)


def ensure_default_auth_users():
    """Ensure admin and cashier1 exist with password 12345 (email field stores username)."""
    password_hash = generate_password_hash("12345")
    defaults = [
        ("Admin", "admin", "admin"),
        ("Cashier One", "cashier1", "cashier"),
    ]
    with get_db() as conn:
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if user_count == 0:
            for name, username, role in defaults:
                conn.execute(
                    """INSERT INTO users (name, email, password_hash, role, status, phone)
                       VALUES (?,?,?,?,?,?)""",
                    (name, username, password_hash, role, "active", ""),
                )
            return
        for name, username, role in defaults:
            row = conn.execute(
                "SELECT id FROM users WHERE email=?", (username,)
            ).fetchone()
            if row:
                conn.execute(
                    """UPDATE users SET name=?, password_hash=?, role=?, status='active'
                       WHERE email=?""",
                    (name, password_hash, role, username),
                )
            else:
                conn.execute(
                    """INSERT INTO users (name, email, password_hash, role, status, phone)
                       VALUES (?,?,?,?,?,?)""",
                    (name, username, password_hash, role, "active", ""),
                )


def seed_db():
    """Seed with data from data.py if tables are empty."""
    # Import here to avoid circular imports
    import data as _data

    ensure_default_auth_users()

    with get_db() as conn:
        # Only seed if products table is empty
        count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count > 0:
            return

        # Seed products
        for p in _data.PRODUCTS:
            conn.execute(
                """INSERT INTO products
                   (id, name, generic, batch, qty, min_qty, expiry, cost, sell,
                    supplier, status, low, expiring)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    p["id"], p["name"], p.get("generic", ""), p.get("batch", ""),
                    p.get("qty", 0), p.get("min", 0), p.get("expiry", ""),
                    p.get("cost", 0), p.get("sell", 0), p.get("supplier", ""),
                    p.get("status", "in_stock"),
                    1 if p.get("low") else 0,
                    1 if p.get("expiring") else 0,
                ),
            )

        # Seed sales + sale_items
        for s in _data.SALES:
            conn.execute(
                """INSERT OR IGNORE INTO sales (id, date, time, customer, total, payment, cashier)
                   VALUES (?,?,?,?,?,?,?)""",
                (s["id"], s["date"], s["time"], s["customer"],
                 s["total"], s["payment"], s["cashier"]),
            )
            for item in s.get("items", []):
                conn.execute(
                    """INSERT INTO sale_items (sale_id, name, qty, price, total)
                       VALUES (?,?,?,?,?)""",
                    (s["id"], item["name"], item["qty"],
                     item["price"], item["total"]),
                )

        # Seed expenses
        for e in _data.EXPENSES:
            conn.execute(
                """INSERT INTO expenses (id, date, description, category, amount)
                   VALUES (?,?,?,?,?)""",
                (e["id"], e["date"], e["description"], e["category"], e["amount"]),
            )

        # Seed users from STAFF — map role descriptions to canonical roles
        role_map = {
            "Admin Pharmacist":      "admin",
            "Dispensary Technician": "pharmacist",
            "Accounts Officer":      "accounts",
            "Store Keeper":          "store_keeper",
            "Sales Attendant":       "cashier",
        }
        default_pw = generate_password_hash("password123")
        for s in _data.STAFF:
            email = s.get("email") or ""
            if not email:
                first = s["name"].split()[0].lower()
                email = f"{first}@pharmakristo.com"
            role = role_map.get(s.get("role", ""), "cashier")
            # First user (Araba) is always admin
            if s.get("id") == 1:
                role = "admin"
                email = "admin@pharmakristo.com"
            conn.execute(
                """INSERT OR IGNORE INTO users (id, name, email, password_hash, role, status, phone)
                   VALUES (?,?,?,?,?,?,?)""",
                (s["id"], s["name"], email, default_pw, role,
                 s.get("status", "active"), s.get("phone", "")),
            )

        # Seed purchase orders
        sample_pos = [
            {"po_number": "PO-2026-001", "supplier": "Ayrton Drug Manufacturing",
             "order_date": "May 12, 2026", "expected_date": "May 25, 2026",
             "status": "received", "total": 4250.00,
             "notes": "Restock of common pain relievers and antibiotics."},
            {"po_number": "PO-2026-002", "supplier": "Kinapharma Ltd",
             "order_date": "May 18, 2026", "expected_date": "Jun 02, 2026",
             "status": "pending", "total": 6890.50,
             "notes": "Bulk multivitamins and ORS for the rainy season."},
            {"po_number": "PO-2026-003", "supplier": "Ernest Chemists",
             "order_date": "May 20, 2026", "expected_date": "Jun 05, 2026",
             "status": "pending", "total": 3120.75,
             "notes": "Cetirizine, Omeprazole, multivitamins."},
            {"po_number": "PO-2026-004", "supplier": "Phyto-Riker Pharmaceuticals",
             "order_date": "May 08, 2026", "expected_date": "May 22, 2026",
             "status": "received", "total": 5400.00, "notes": "Folic acid & ORS."},
            {"po_number": "PO-2026-005", "supplier": "Danadams Pharmaceutical",
             "order_date": "May 22, 2026", "expected_date": "Jun 06, 2026",
             "status": "pending", "total": 2890.00, "notes": "Plasters and contraceptives."},
        ]
        for po in sample_pos:
            conn.execute(
                """INSERT INTO purchase_orders
                   (po_number, supplier, order_date, expected_date, status, total, notes)
                   VALUES (?,?,?,?,?,?,?)""",
                (po["po_number"], po["supplier"], po["order_date"],
                 po["expected_date"], po["status"], po["total"], po["notes"]),
            )


# ─── Product CRUD ─────────────────────────────────────────────────────────────

def get_products(filter=None, supplier=None, q=None):
    """Return filtered list of products as dicts."""
    sql = "SELECT * FROM products WHERE 1=1"
    params = []

    if filter == "low":
        sql += " AND (low=1 OR status='low_stock')"
    elif filter == "expiring":
        sql += " AND expiring=1"
    elif filter == "expired":
        sql += " AND status='expired'"

    if supplier and supplier != "All Suppliers":
        sql += " AND supplier=?"
        params.append(supplier)

    if q:
        ql = f"%{q.lower()}%"
        sql += " AND (LOWER(name) LIKE ? OR LOWER(generic) LIKE ? OR LOWER(batch) LIKE ?)"
        params.extend([ql, ql, ql])

    sql += " ORDER BY id"

    with get_db() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [_product_row(r) for r in rows]


def get_product(pid):
    """Return a single product dict or None."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM products WHERE id=?", (pid,)).fetchone()
    return _product_row(row) if row else None


def add_product(data_dict):
    """Insert a new product, return new id."""
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO products
               (name, generic, batch, qty, min_qty, expiry, cost, sell,
                supplier, status, low, expiring)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                data_dict.get("name", ""),
                data_dict.get("generic", ""),
                data_dict.get("batch", ""),
                int(data_dict.get("qty", 0)),
                int(data_dict.get("min_qty", 0)),
                data_dict.get("expiry", ""),
                float(data_dict.get("cost", 0)),
                float(data_dict.get("sell", 0)),
                data_dict.get("supplier", ""),
                data_dict.get("status", "in_stock"),
                1 if data_dict.get("low") else 0,
                1 if data_dict.get("expiring") else 0,
            ),
        )
        return cur.lastrowid


def update_product(pid, data_dict):
    """Update an existing product by id."""
    with get_db() as conn:
        conn.execute(
            """UPDATE products SET
               name=?, generic=?, batch=?, qty=?, min_qty=?, expiry=?,
               cost=?, sell=?, supplier=?, status=?, low=?, expiring=?
               WHERE id=?""",
            (
                data_dict.get("name", ""),
                data_dict.get("generic", ""),
                data_dict.get("batch", ""),
                int(data_dict.get("qty", 0)),
                int(data_dict.get("min_qty", 0)),
                data_dict.get("expiry", ""),
                float(data_dict.get("cost", 0)),
                float(data_dict.get("sell", 0)),
                data_dict.get("supplier", ""),
                data_dict.get("status", "in_stock"),
                1 if data_dict.get("low") else 0,
                1 if data_dict.get("expiring") else 0,
                pid,
            ),
        )


def delete_product(pid):
    """Delete a product by id."""
    with get_db() as conn:
        conn.execute("DELETE FROM products WHERE id=?", (pid,))


# ─── Stats ────────────────────────────────────────────────────────────────────

def get_stats():
    """Return dashboard stats. DB-computed counts, hardcoded demo aggregates."""
    with get_db() as conn:
        total_products = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        low_stock      = conn.execute(
            "SELECT COUNT(*) FROM products WHERE low=1 OR status='low_stock' OR status='out_stock'"
        ).fetchone()[0]
        expiring_soon  = conn.execute(
            "SELECT COUNT(*) FROM products WHERE expiring=1 OR status='expiring_soon'"
        ).fetchone()[0]

        today_sales_rows = conn.execute(
            "SELECT total FROM sales WHERE date='May 27, 2026'"
        ).fetchall()

    daily_rev  = sum(r[0] for r in today_sales_rows)
    daily_txns = len(today_sales_rows)

    # Hardcoded demo aggregate values (prototype)
    monthly_revenue = 19127.00
    gross_profit    = 27771.00
    month_expenses  = 72889.82

    return {
        "daily_sales":     daily_rev,
        "daily_txns":      daily_txns,
        "monthly_revenue": monthly_revenue,
        "monthly_txns":    121,
        "net_profit":      round(gross_profit - month_expenses, 2),
        "stock_alerts":    low_stock,
        "total_products":  total_products,
        "low_stock":       low_stock,
        "expiring_soon":   expiring_soon,
        "expired":         10,
        "stock_value":     952784.00,
        "month_expenses":  month_expenses,
        "top_category":    "Salaries",
        "gross_profit":    gross_profit,
        "yearly_net":      -821836.04,
    }


def _parse_display_date(value):
    """Parse dates stored as 'May 27, 2026'."""
    if not value:
        return None
    for fmt in ("%b %d, %Y", "%b %-d, %Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def _range_start(range_key):
    if range_key == "7d":
        return date.today() - timedelta(days=6)
    if range_key == "30d":
        return date.today() - timedelta(days=29)
    return None


def _in_range(value, start):
    if start is None:
        return True
    parsed = _parse_display_date(value)
    if parsed is None:
        return True
    return parsed >= start


def get_dashboard_summary(range_key="7d"):
    """Aggregate sales/expenses for dashboard cards."""
    start = _range_start(range_key)
    with get_db() as conn:
        sales_rows = conn.execute("SELECT total, date FROM sales").fetchall()
        expense_rows = conn.execute("SELECT amount, date FROM expenses").fetchall()

    revenue = sum(float(r["total"]) for r in sales_rows if _in_range(r["date"], start))
    txns = sum(1 for r in sales_rows if _in_range(r["date"], start))
    expenses = sum(
        float(r["amount"])
        for r in expense_rows
        if _in_range(r["date"], start)
    )

    base = get_stats()
    return {
        "revenue": round(revenue, 2),
        "transactions": txns,
        "expenses": round(expenses, 2),
        "net_profit": round(revenue - expenses, 2),
        "stock_alerts": base["stock_alerts"],
        "low_stock": base["low_stock"],
        "expiring_soon": base["expiring_soon"],
        "total_products": base["total_products"],
    }


def get_sales_trend(range_key="7d"):
    """Daily sales totals for charting."""
    start = _range_start(range_key)
    buckets = defaultdict(float)
    with get_db() as conn:
        rows = conn.execute("SELECT date, total FROM sales").fetchall()

    for row in rows:
        if not _in_range(row["date"], start):
            continue
        buckets[row["date"]] += float(row["total"])

    points = [
        {"date": d, "total": round(total, 2)}
        for d, total in sorted(
            buckets.items(),
            key=lambda item: _parse_display_date(item[0]) or date.min,
        )
    ]
    return points


# ─── Sales ────────────────────────────────────────────────────────────────────

def add_sale(customer, items, payment):
    """Insert a new sale with items, return dict with id and total."""
    from datetime import datetime
    now   = datetime.now()
    total = sum(float(i.get("qty", 1)) * float(i.get("price", 0)) for i in items)

    with get_db() as conn:
        # Generate next sale id
        max_row = conn.execute("SELECT id FROM sales ORDER BY id DESC LIMIT 1").fetchone()
        if max_row:
            try:
                last_num = int(max_row[0].split("-")[1])
            except (IndexError, ValueError):
                last_num = 1284
        else:
            last_num = 1284
        sale_id = f"S-{last_num + 1}"

        conn.execute(
            "INSERT INTO sales (id, date, time, customer, total, payment, cashier) VALUES (?,?,?,?,?,?,?)",
            (sale_id, now.strftime("%b %-d, %Y"), now.strftime("%H:%M"),
             customer or "Walk-in", total, payment, "Araba Yeboah"),
        )
        for item in items:
            qty   = int(item.get("qty", 1))
            price = float(item.get("price", 0))
            conn.execute(
                "INSERT INTO sale_items (sale_id, name, qty, price, total) VALUES (?,?,?,?,?)",
                (sale_id, item.get("name", ""), qty, price, qty * price),
            )

    return {"id": sale_id, "total": total}


def get_recent_sales(n=5):
    """Return the n most recent sales with their items."""
    with get_db() as conn:
        sales = conn.execute(
            "SELECT * FROM sales ORDER BY id DESC LIMIT ?", (n,)
        ).fetchall()
        result = []
        for s in sales:
            s_dict = dict(s)
            items  = conn.execute(
                "SELECT * FROM sale_items WHERE sale_id=?", (s["id"],)
            ).fetchall()
            s_dict["items"] = [dict(i) for i in items]
            result.append(s_dict)
    return result


# ─── Expenses ─────────────────────────────────────────────────────────────────

def add_expense(description, category, amount):
    """Insert a new expense."""
    today = date.today().strftime("%b %-d, %Y")
    with get_db() as conn:
        conn.execute(
            "INSERT INTO expenses (date, description, category, amount) VALUES (?,?,?,?)",
            (today, description, category, float(amount)),
        )


def get_expenses(category=None, q=None):
    """Return filtered expense list."""
    sql    = "SELECT * FROM expenses WHERE 1=1"
    params = []

    if category and category != "All Categories":
        sql += " AND category=?"
        params.append(category)

    if q:
        sql += " AND LOWER(description) LIKE ?"
        params.append(f"%{q.lower()}%")

    sql += " ORDER BY id DESC"

    with get_db() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def delete_expense(expense_id):
    """Delete an expense by id."""
    with get_db() as conn:
        conn.execute("DELETE FROM expenses WHERE id=?", (expense_id,))


def get_alert_counts():
    """Counts for notification badge."""
    stats = get_stats()
    return {
        "low_stock": stats["low_stock"],
        "expiring_soon": stats["expiring_soon"],
        "expired": stats["expired"],
        "total": stats["low_stock"] + stats["expiring_soon"] + stats["expired"],
    }


# ─── Low-stock helper ─────────────────────────────────────────────────────────

def get_low_stock(n=6):
    """Return up to n low-stock / out-of-stock products."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT * FROM products
               WHERE status IN ('out_stock','low_stock')
               ORDER BY qty ASC LIMIT ?""",
            (n,),
        ).fetchall()
    return [_product_row(r) for r in rows]


# ─── Suppliers ────────────────────────────────────────────────────────────────

def get_suppliers():
    """Return sorted list of unique supplier strings."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT DISTINCT supplier FROM products ORDER BY supplier"
        ).fetchall()
    return [r[0] for r in rows if r[0]]


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _product_row(row):
    """Convert a sqlite3.Row (or None) to a plain dict."""
    if row is None:
        return None
    d = dict(row)
    # Normalise boolean-ish integers to Python bool
    d["low"]      = bool(d.get("low", 0))
    d["expiring"] = bool(d.get("expiring", 0))
    # Alias min_qty → min for template compatibility
    d["min"] = d.get("min_qty", 0)
    return d


# ─── Users / Auth ─────────────────────────────────────────────────────────────

def get_users():
    """Return all users as dicts (sans password hash)."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name, email, role, status, phone FROM users ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


def get_user(uid):
    """Return one user dict by id (sans password hash), or None."""
    if uid is None:
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, name, email, role, status, phone FROM users WHERE id=?", (uid,)
        ).fetchone()
    return dict(row) if row else None


def get_user_by_email(email):
    """Return one user dict by email (sans password hash), or None."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, name, email, role, status, phone FROM users WHERE email=?",
            (email,),
        ).fetchone()
    return dict(row) if row else None


def verify_password(email, password):
    """Check email + password. Return user dict on match, else None."""
    if not email or not password:
        return None
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email=?", (email.strip().lower(),)
        ).fetchone()
    if not row:
        return None
    if not check_password_hash(row["password_hash"], password):
        return None
    d = dict(row)
    d.pop("password_hash", None)
    return d


def add_user(data_dict):
    """Insert a new user; password is required. Return new id."""
    pw = data_dict.get("password") or "password123"
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO users (name, email, password_hash, role, status, phone)
               VALUES (?,?,?,?,?,?)""",
            (
                data_dict.get("name", "").strip(),
                (data_dict.get("email", "") or "").strip().lower(),
                generate_password_hash(pw),
                data_dict.get("role", "cashier"),
                data_dict.get("status", "active"),
                data_dict.get("phone", ""),
            ),
        )
        return cur.lastrowid


def update_user(uid, data_dict):
    """Update a user. Password is optional — if blank, keep existing."""
    with get_db() as conn:
        if data_dict.get("password"):
            conn.execute(
                """UPDATE users
                   SET name=?, email=?, role=?, status=?, phone=?, password_hash=?
                   WHERE id=?""",
                (
                    data_dict.get("name", "").strip(),
                    (data_dict.get("email", "") or "").strip().lower(),
                    data_dict.get("role", "cashier"),
                    data_dict.get("status", "active"),
                    data_dict.get("phone", ""),
                    generate_password_hash(data_dict["password"]),
                    uid,
                ),
            )
        else:
            conn.execute(
                """UPDATE users
                   SET name=?, email=?, role=?, status=?, phone=?
                   WHERE id=?""",
                (
                    data_dict.get("name", "").strip(),
                    (data_dict.get("email", "") or "").strip().lower(),
                    data_dict.get("role", "cashier"),
                    data_dict.get("status", "active"),
                    data_dict.get("phone", ""),
                    uid,
                ),
            )


def delete_user(uid):
    """Delete a user by id."""
    with get_db() as conn:
        conn.execute("DELETE FROM users WHERE id=?", (uid,))


# ─── Purchase Orders ──────────────────────────────────────────────────────────

def get_purchase_orders(status=None):
    """Return purchase orders, optionally filtered by status."""
    sql    = "SELECT * FROM purchase_orders WHERE 1=1"
    params = []
    if status and status != "all":
        sql += " AND status=?"
        params.append(status)
    sql += " ORDER BY id DESC"
    with get_db() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def get_purchase_order(po_id):
    """Return one purchase order (with items) by id."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM purchase_orders WHERE id=?", (po_id,)
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        items = conn.execute(
            "SELECT * FROM po_items WHERE po_id=?", (po_id,)
        ).fetchall()
        d["items"] = [dict(i) for i in items]
    return d


def add_purchase_order(data_dict):
    """Insert a new purchase order. Return new id."""
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO purchase_orders
               (po_number, supplier, order_date, expected_date, status, total, notes)
               VALUES (?,?,?,?,?,?,?)""",
            (
                data_dict.get("po_number", "").strip(),
                data_dict.get("supplier", "").strip(),
                data_dict.get("order_date", "").strip(),
                data_dict.get("expected_date", "").strip(),
                data_dict.get("status", "pending"),
                float(data_dict.get("total", 0) or 0),
                data_dict.get("notes", ""),
            ),
        )
        return cur.lastrowid


def update_purchase_order(po_id, data_dict):
    """Update an existing purchase order."""
    with get_db() as conn:
        conn.execute(
            """UPDATE purchase_orders
               SET po_number=?, supplier=?, order_date=?, expected_date=?,
                   status=?, total=?, notes=?
               WHERE id=?""",
            (
                data_dict.get("po_number", "").strip(),
                data_dict.get("supplier", "").strip(),
                data_dict.get("order_date", "").strip(),
                data_dict.get("expected_date", "").strip(),
                data_dict.get("status", "pending"),
                float(data_dict.get("total", 0) or 0),
                data_dict.get("notes", ""),
                po_id,
            ),
        )


def update_po_status(po_id, status):
    """Update only the status of a purchase order."""
    with get_db() as conn:
        conn.execute(
            "UPDATE purchase_orders SET status=? WHERE id=?", (status, po_id)
        )


def delete_purchase_order(po_id):
    """Delete a purchase order by id."""
    with get_db() as conn:
        conn.execute("DELETE FROM po_items WHERE po_id=?", (po_id,))
        conn.execute("DELETE FROM purchase_orders WHERE id=?", (po_id,))
