# app.py — PharmaKristo Flask backend
# Run:  pip install flask && python app.py
# Then open: http://localhost:5000

import os
import random
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for,
    jsonify, flash, session, g, send_from_directory, abort,
)
from werkzeug.security import generate_password_hash, check_password_hash

from data import PHARMACY, STAFF
import db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR)
app.secret_key = "pharmakristo-secret-2026"

SPA_ASSETS = {
    "AppContext.jsx",
    "Login.jsx",
    "PharmaKristo.html",
    "pk-data.js",
    "pk-style.css",
    "pk-shared.jsx",
    "pk-dashboard.jsx",
    "pk-products.jsx",
    "pk-sales.jsx",
    "pk-expenses.jsx",
    "pk-reports.jsx",
    "pk-main.jsx",
}


# ─── Auth helpers ────────────────────────────────────────────────────────

def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized"}), 401
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return redirect(url_for("login", next=request.path))
        user = db.get_user(session.get("user_id"))
        if not user or user.get("role") != "admin":
            flash("You don't have permission to view that page.", "error")
            return redirect(url_for("dashboard"))
        return view(*args, **kwargs)
    return wrapped


@app.before_request
def load_current_user():
    uid = session.get("user_id")
    g.current_user = db.get_user(uid) if uid else None


@app.context_processor
def inject_user():
    """Make current_user available in all templates."""
    user = getattr(g, "current_user", None)
    return {"current_user": user}


# ─── Auth routes ─────────────────────────────────────────────────────────

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        password = request.form.get("password") or ""
        user = db.verify_password(email, password)
        if user:
            session.clear()
            session["user_id"] = user["id"]
            nxt = request.args.get("next") or url_for("dashboard")
            return redirect(nxt)
        flash("Invalid email or password.", "error")
        return render_template("login.html", email=email), 401
    # Already logged in?
    if session.get("user_id"):
        return redirect(url_for("dashboard"))
    return render_template("login.html", email="")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ─── Dashboard ──────────────────────────────────────────────────────────
@app.route("/")
@app.route("/dashboard")
@login_required
def dashboard():
    stats     = db.get_stats()
    low_stock = db.get_low_stock(6)
    recent    = db.get_recent_sales(5)
    return render_template("dashboard.html",
        pharmacy=PHARMACY, stats=stats,
        low_stock=low_stock, recent=recent,
        active="dashboard")


# ─── Products ───────────────────────────────────────────────────────────
@app.route("/products")
@login_required
def products():
    q        = request.args.get("q", "").lower()
    f        = request.args.get("filter", "all")
    supplier = request.args.get("supplier", "All Suppliers")

    prods       = db.get_products(filter=f, supplier=supplier, q=q)
    all_prods   = db.get_products()
    suppliers   = db.get_suppliers()
    stats       = db.get_stats()

    return render_template("products.html",
        pharmacy=PHARMACY, products=prods, all_products=all_prods,
        suppliers=suppliers, stats=stats,
        current_filter=f, current_supplier=supplier, q=q,
        active="products")


# ─── Sales / POS ────────────────────────────────────────────────────────
@app.route("/sales")
@login_required
def sales():
    q     = request.args.get("q", "").lower()
    prods = db.get_products(q=q) if q else [
        p for p in db.get_products() if p["status"] != "out_stock"
    ][:16]
    return render_template("sales.html",
        pharmacy=PHARMACY, products=prods, active="sales")


@app.route("/sales/process", methods=["POST"])
@login_required
def process_sale():
    """Accept a JSON cart payload, record the sale, return receipt id."""
    data     = request.get_json()
    items    = data.get("items", [])
    customer = data.get("customer", "Walk-in")
    payment  = data.get("payment", "cash")
    if not items:
        return jsonify({"error": "Cart is empty"}), 400
    receipt = db.add_sale(customer, items, payment)
    return jsonify({"receipt_id": receipt["id"], "total": receipt["total"]})


# ─── Expenses ────────────────────────────────────────────────────────────
@app.route("/expenses")
@login_required
def expenses():
    q   = request.args.get("q", "").lower()
    cat = request.args.get("category", "All Categories")
    exp = db.get_expenses(category=cat if cat != "All Categories" else None, q=q or None)

    all_exp     = db.get_expenses()
    month_total = sum(e["amount"] for e in all_exp)
    categories  = ["All Categories", "Salaries", "Rent", "Utilities", "Supplies", "Maintenance", "Other"]

    return render_template("expenses.html",
        pharmacy=PHARMACY, expenses=exp, month_total=month_total,
        categories=categories, current_cat=cat, q=q,
        active="expenses")


@app.route("/expenses/add", methods=["POST"])
@login_required
def add_expense_route():
    description = request.form.get("description", "")
    category    = request.form.get("category", "Other")
    amount      = float(request.form.get("amount", 0))
    if description and amount:
        db.add_expense(description, category, amount)
        flash("Expense added successfully.", "success")
    return redirect(url_for("expenses"))


# ─── Reports ─────────────────────────────────────────────────────────────
def _build_chart_data():
    """Build chart datasets for the reports page."""
    # 1. Sales-over-time: last 30 days, trending up
    today = datetime.now().date()
    labels = []
    values = []
    rng = random.Random(42)  # deterministic
    base = 900
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        labels.append(d.strftime("%b %d"))
        # gentle upward trend with daily noise
        trend = base + (29 - i) * 35
        jitter = rng.randint(-180, 380)
        values.append(max(400, trend + jitter))
    sales_over_time = {"labels": labels, "values": values}

    # 2. Top products by revenue — pull from PRODUCTS via qty*sell heuristic
    products = db.get_products()
    # rank by sell * (a deterministic "popularity" derived from id)
    weights = {1: 280, 2: 230, 3: 210, 4: 190, 5: 170}
    top_names = [
        "Paracetamol 500mg",
        "Amoxicillin 500mg",
        "Ibuprofen 400mg",
        "Cetirizine 10mg",
        "Multivitamin",
    ]
    top_values = []
    for name in top_names:
        # find first matching product by name prefix
        match = next((p for p in products if p["name"].startswith(name)), None)
        sell = match["sell"] if match else 12.0
        # synthetic revenue
        idx = top_names.index(name) + 1
        units = weights.get(idx, 100)
        top_values.append(round(sell * units, 2))
    top_products = {"labels": top_names, "values": top_values}

    # 3. Expense breakdown by category — real DB data
    cat_totals = defaultdict(float)
    for e in db.get_expenses():
        cat_totals[e["category"]] += e["amount"]
    expense_breakdown = {
        "labels": list(cat_totals.keys()),
        "values": [round(v, 2) for v in cat_totals.values()],
    }
    return sales_over_time, top_products, expense_breakdown


@app.route("/reports")
@login_required
def reports():
    stats = db.get_stats()
    sales_chart, top_products, expense_breakdown = _build_chart_data()
    return render_template("reports.html",
        pharmacy=PHARMACY, stats=stats, active="reports",
        sales_chart=sales_chart,
        top_products=top_products,
        expense_breakdown=expense_breakdown)


# ─── Procurement ─────────────────────────────────────────────────────────
@app.route("/procurement")
@login_required
def procurement():
    pos = db.get_purchase_orders()
    suppliers = db.get_suppliers()

    total_orders = len(pos)
    pending = sum(1 for p in pos if p["status"] == "pending")
    received_this_month = sum(1 for p in pos if p["status"] == "received")
    total_value = sum(p["total"] for p in pos)

    stats = {
        "total_orders": total_orders,
        "pending": pending,
        "received_this_month": received_this_month,
        "total_value": total_value,
    }
    return render_template("procurement.html",
        pharmacy=PHARMACY, purchase_orders=pos, suppliers=suppliers,
        po_stats=stats, active="procurement")


# ─── Receipts ────────────────────────────────────────────────────────────
@app.route("/receipts")
@login_required
def receipts():
    recent = db.get_recent_sales(50)
    return render_template("placeholder.html", pharmacy=PHARMACY,
        title="Receipts", sub="View and print transaction receipts",
        items=recent, active="receipts")


# ─── Staff ──────────────────────────────────────────────────────────────
@app.route("/staff")
@login_required
def staff():
    users = db.get_users()
    total = len(users)
    active = sum(1 for u in users if u["status"] == "active")
    on_leave = sum(1 for u in users if u["status"] == "on_leave")
    staff_stats = {"total": total, "active": active, "on_leave": on_leave}
    return render_template("staff.html",
        pharmacy=PHARMACY, users=users,
        staff_stats=staff_stats, active="staff")


# ─── Settings ────────────────────────────────────────────────────────────
@app.route("/settings")
@login_required
def settings():
    return render_template("placeholder.html", pharmacy=PHARMACY,
        title="Settings", sub="Configure your pharmacy settings", active="settings")


# ─── API: Products ──────────────────────────────────────────────────────
@app.route("/api/products/search")
@login_required
def api_search():
    q     = request.args.get("q", "")
    prods = db.get_products(q=q)
    return jsonify(prods)


@app.route("/api/products", methods=["GET"])
@login_required
def api_products_list():
    pid = request.args.get("id")
    if pid:
        p = db.get_product(int(pid))
        if p is None:
            return jsonify({"error": "Not found"}), 404
        return jsonify(p)

    q        = request.args.get("q", "").lower() or None
    f        = request.args.get("filter", None)
    supplier = request.args.get("supplier", None)
    prods    = db.get_products(filter=f, supplier=supplier, q=q)
    return jsonify(prods)


@app.route("/api/products", methods=["POST"])
@login_required
def api_products_add():
    data = request.get_json(force=True) or {}
    try:
        new_id = db.add_product(data)
        return jsonify({"id": new_id, "ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/products/<int:pid>", methods=["PUT"])
@login_required
def api_products_update(pid):
    data = request.get_json(force=True) or {}
    try:
        db.update_product(pid, data)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/products/<int:pid>", methods=["DELETE"])
@login_required
def api_products_delete(pid):
    try:
        db.delete_product(pid)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── API: Purchase Orders ────────────────────────────────────────────────
@app.route("/api/purchase-orders", methods=["POST"])
@login_required
def api_po_add():
    data = request.get_json(force=True) or {}
    try:
        new_id = db.add_purchase_order(data)
        return jsonify({"id": new_id, "ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/purchase-orders/<int:po_id>", methods=["PUT"])
@login_required
def api_po_update(po_id):
    data = request.get_json(force=True) or {}
    try:
        db.update_purchase_order(po_id, data)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/purchase-orders/<int:po_id>", methods=["DELETE"])
@login_required
def api_po_delete(po_id):
    try:
        db.delete_purchase_order(po_id)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── API: Staff ─────────────────────────────────────────────────────────
@app.route("/api/staff", methods=["POST"])
@login_required
def api_staff_add():
    data = request.get_json(force=True) or {}
    try:
        new_id = db.add_user(data)
        return jsonify({"id": new_id, "ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/staff/<int:uid>", methods=["PUT"])
@login_required
def api_staff_update(uid):
    data = request.get_json(force=True) or {}
    try:
        db.update_user(uid, data)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/staff/<int:uid>", methods=["DELETE"])
@login_required
def api_staff_delete(uid):
    try:
        db.delete_user(uid)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ─── API: Chat (Krista) ─────────────────────────────────────────────────
def _format_cedis(v):
    return "₵{:,.2f}".format(float(v or 0))


def _krista_response(message):
    """Mock AI: keyword-matched responses pulling real DB values."""
    m = (message or "").lower().strip()
    if not m:
        return ("I didn't catch that. Could you ask about expenses, stock, "
                "sales, top products, or profit?")

    # Expenses / spending
    if "expense" in m or "spending" in m or "cost" in m:
        cat_totals = defaultdict(float)
        for e in db.get_expenses():
            cat_totals[e["category"]] += e["amount"]
        sorted_cats = sorted(cat_totals.items(), key=lambda x: -x[1])[:3]
        if not sorted_cats:
            return "No expenses recorded yet. Want to add your first one?"
        total = sum(cat_totals.values())
        parts = []
        for i, (c, v) in enumerate(sorted_cats, 1):
            parts.append(f"{i}) {c} {_format_cedis(v)}")
        top_name, top_val = sorted_cats[0]
        pct = (top_val / total * 100) if total else 0
        return (
            f"Your top expense categories this month are: {' '.join(parts)}. "
            f"{top_name} dominates at {pct:.0f}% of total — typical for a pharmacy of your size. "
            "Would you like to see a breakdown by week?"
        )

    # Low stock
    if "low" in m or "stock" in m or "running out" in m or "reorder" in m:
        low = db.get_low_stock(5)
        if not low:
            return "Good news — no products are currently low on stock. Want me to check expiring items instead?"
        lines = []
        for p in low:
            lines.append(f"- {p['name']} (qty: {p['qty']})")
        return (
            "Here are your lowest-stock items right now:\n"
            + "\n".join(lines) +
            "\nShould I draft a purchase order for any of these?"
        )

    # Profitability
    if "profit" in m or "margin" in m:
        s = db.get_stats()
        revenue = s.get("monthly_revenue", 0)
        expenses_total = s.get("month_expenses", 0)
        net = s.get("net_profit", 0)
        ratio = (expenses_total / revenue * 100) if revenue else 0
        comment = "Your expense ratio is high relative to revenue — payroll is the main driver."
        if net > 0:
            comment = "You're operating profitably this month — keep an eye on inventory turnover."
        return (
            f"Net profit this month: {_format_cedis(net)} "
            f"(revenue {_format_cedis(revenue)}, expenses {_format_cedis(expenses_total)}, "
            f"expense ratio {ratio:.0f}%). {comment} "
            "Want suggestions on where to trim costs?"
        )

    # Sales / revenue
    if "sales" in m or "revenue" in m or "income" in m:
        s = db.get_stats()
        return (
            f"This month you've recorded {s.get('monthly_txns', 0)} transactions "
            f"totaling {_format_cedis(s.get('monthly_revenue', 0))} in revenue. "
            f"Today's sales: {s.get('daily_txns', 0)} transactions, "
            f"{_format_cedis(s.get('daily_sales', 0))}. "
            "Want a daily breakdown for the last week?"
        )

    # Top products / best-sellers
    if "top" in m or "best" in m or "product" in m or "seller" in m:
        prods = db.get_products()
        # proxy: prods with highest sell * qty
        ranked = sorted(prods, key=lambda p: (p["sell"] * p["qty"]), reverse=True)[:5]
        if not ranked:
            return "No products on file yet. Want to add one?"
        lines = []
        for i, p in enumerate(ranked, 1):
            est = p["sell"] * p["qty"]
            lines.append(f"{i}) {p['name']} — est. {_format_cedis(est)}")
        return (
            "Top 5 products by estimated stock value:\n"
            + "\n".join(lines) +
            "\nWant me to compare these against last month?"
        )

    # Help
    if "help" in m or "what can you" in m or "how do" in m:
        return (
            "I can analyze:\n"
            "- Expenses (top categories, breakdowns)\n"
            "- Low stock & reorder suggestions\n"
            "- Sales & revenue trends\n"
            "- Top-selling products\n"
            "- Profitability\n"
            "Just ask in plain English — what would you like to explore first?"
        )

    # Fallback
    return (
        "I can help analyze expenses, stock levels, sales trends, top products, "
        "and profitability. Try one of the quick prompts above! "
        "What would you like to look at first?"
    )


@app.route("/api/chat", methods=["POST"])
@login_required
def api_chat():
    data = request.get_json(silent=True) or {}
    msg = data.get("message", "")
    return jsonify({"response": _krista_response(msg)})


# ─── SPA auth + static JSX (React build) ─────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def api_auth_login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip().lower()
    password = payload.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    user = db.verify_password(username, password)
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401
    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"username": user["email"], "role": user["role"]})


@app.route("/api/auth/logout", methods=["POST"])
def api_auth_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/dashboard/summary")
@login_required
def api_dashboard_summary():
    range_key = request.args.get("range", "7d")
    if range_key not in ("7d", "30d", "all"):
        range_key = "7d"
    return jsonify(db.get_dashboard_summary(range_key))


@app.route("/api/dashboard/sales-trend")
@login_required
def api_dashboard_sales_trend():
    range_key = request.args.get("range", "7d")
    if range_key not in ("7d", "30d", "all"):
        range_key = "7d"
    return jsonify(db.get_sales_trend(range_key))


@app.route("/api/sales/recent")
@login_required
def api_recent_sales():
    limit = request.args.get("limit", 5, type=int)
    return jsonify(db.get_recent_sales(max(1, min(limit, 20))))


@app.route("/AppContext.jsx")
def serve_context():
    return send_from_directory(BASE_DIR, "AppContext.jsx")


@app.route("/Login.jsx")
def serve_login():
    return send_from_directory(BASE_DIR, "Login.jsx")


@app.route("/PharmaKristo.html")
@app.route("/spa")
def serve_spa():
    return send_from_directory(BASE_DIR, "PharmaKristo.html")


@app.route("/<path:asset>")
def serve_spa_asset(asset):
    if asset in SPA_ASSETS:
        return send_from_directory(BASE_DIR, asset)
    abort(404)


# ─── Startup ─────────────────────────────────────────────────────────────
db.init_db()
db.seed_db()
db.ensure_default_auth_users()

if __name__ == "__main__":
    print("=" * 52)
    print("  PharmaKristo starting on http://localhost:5000")
    print("=" * 52)
    app.run(debug=True, port=5000)
