import sqlite3
from pathlib import Path
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash

from db_setup import setup_database

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "pharmakristo.db"

app = Flask(__name__, static_folder=".")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "generic": row["generic"],
        "batch": row["batch"],
        "qty": row["qty"],
        "min": row["min_qty"],
        "expiry": row["expiry"],
        "cost": row["cost"],
        "sell": row["sell"],
        "supplier": row["supplier"],
        "status": row["status"],
    }


def validate_payload(payload, partial=False):
    required = ["name", "generic", "batch", "qty", "min", "expiry", "cost", "sell", "supplier", "status"]
    if not partial:
        missing = [k for k in required if k not in payload]
        if missing:
            return f"Missing required fields: {', '.join(missing)}"
    return None


def sale_row_to_dict(row):
    return {
        "id": row["id"],
        "drug_id": row["drug_id"],
        "drug_name": row["drug_name"],
        "qty": row["qty"],
        "total_price": row["total_price"],
        "timestamp": row["timestamp"],
    }


def expense_row_to_dict(row):
    return {
        "id": row["id"],
        "description": row["description"],
        "amount": row["amount"],
        "category": row["category"],
        "timestamp": row["timestamp"],
    }


def get_request_role(payload=None):
    header_role = request.headers.get("X-User-Role", "").strip().lower()
    if header_role:
        return header_role
    if isinstance(payload, dict):
        return str(payload.get("user_role", "")).strip().lower()
    return ""


def require_admin(payload=None):
    if get_request_role(payload) != "admin":
        return jsonify({"error": "Admin role required"}), 403
    return None


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "PharmaKristo.html")


@app.route("/api/drugs", methods=["GET"])
def get_drugs():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM drugs ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([row_to_dict(row) for row in rows])


@app.route("/api/drugs", methods=["POST"])
def add_drug():
    payload = request.get_json(silent=True) or {}
    admin_error = require_admin(payload)
    if admin_error:
        return admin_error
    err = validate_payload(payload, partial=False)
    if err:
        return jsonify({"error": err}), 400

    conn = get_conn()
    cur = conn.execute(
        """
        INSERT INTO drugs (name, generic, batch, qty, min_qty, expiry, cost, sell, supplier, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload["name"],
            payload["generic"],
            payload["batch"],
            int(payload["qty"]),
            int(payload["min"]),
            payload["expiry"],
            float(payload["cost"]),
            float(payload["sell"]),
            payload["supplier"],
            payload["status"],
        ),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM drugs WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row)), 201


@app.route("/api/drugs/<int:drug_id>", methods=["PUT", "PATCH"])
def update_drug(drug_id):
    payload = request.get_json(silent=True) or {}
    admin_error = require_admin(payload)
    if admin_error:
        return admin_error
    partial = request.method == "PATCH"
    err = validate_payload(payload, partial=partial)
    if err:
        return jsonify({"error": err}), 400

    fields = {
        "name": "name",
        "generic": "generic",
        "batch": "batch",
        "qty": "qty",
        "min": "min_qty",
        "expiry": "expiry",
        "cost": "cost",
        "sell": "sell",
        "supplier": "supplier",
        "status": "status",
    }
    updates = []
    values = []
    for key, column in fields.items():
        if key in payload:
            updates.append(f"{column} = ?")
            value = payload[key]
            if key in ("qty", "min"):
                value = int(value)
            if key in ("cost", "sell"):
                value = float(value)
            values.append(value)

    if not updates:
        return jsonify({"error": "No fields to update"}), 400

    values.append(drug_id)
    conn = get_conn()
    cur = conn.execute(f"UPDATE drugs SET {', '.join(updates)} WHERE id = ?", values)
    if cur.rowcount == 0:
        conn.close()
        return jsonify({"error": "Drug not found"}), 404
    conn.commit()
    row = conn.execute("SELECT * FROM drugs WHERE id = ?", (drug_id,)).fetchone()
    conn.close()
    return jsonify(row_to_dict(row))


@app.route("/api/drugs/<int:drug_id>", methods=["DELETE"])
def delete_drug(drug_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    conn = get_conn()
    cur = conn.execute("DELETE FROM drugs WHERE id = ?", (drug_id,))
    if cur.rowcount == 0:
        conn.close()
        return jsonify({"error": "Drug not found"}), 404
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/sales", methods=["GET"])
def get_sales():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM sales ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([sale_row_to_dict(row) for row in rows])


@app.route("/api/sales", methods=["POST"])
def create_sales():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items")
    if not isinstance(items, list) or not items:
        return jsonify({"error": "Payload must include a non-empty items array"}), 400

    timestamp = payload.get("timestamp") or datetime.utcnow().isoformat(timespec="seconds")
    created = []
    conn = get_conn()
    try:
        conn.execute("BEGIN")
        for item in items:
            drug_id = item.get("drug_id")
            qty = int(item.get("qty", 0))
            total_price = float(item.get("total_price", 0))
            if not drug_id or qty <= 0 or total_price < 0:
                raise ValueError("Each sale item requires drug_id, qty > 0, and total_price >= 0")

            drug = conn.execute("SELECT id, name, qty FROM drugs WHERE id = ?", (drug_id,)).fetchone()
            if not drug:
                raise ValueError(f"Drug {drug_id} not found")
            if drug["qty"] < qty:
                raise ValueError(f"Insufficient stock for {drug['name']}")

            conn.execute("UPDATE drugs SET qty = qty - ? WHERE id = ?", (qty, drug_id))
            cur = conn.execute(
                """
                INSERT INTO sales (drug_id, drug_name, qty, total_price, timestamp)
                VALUES (?, ?, ?, ?, ?)
                """,
                (drug_id, drug["name"], qty, total_price, timestamp),
            )
            row = conn.execute("SELECT * FROM sales WHERE id = ?", (cur.lastrowid,)).fetchone()
            created.append(sale_row_to_dict(row))

        conn.commit()
        return jsonify(created), 201
    except ValueError as exc:
        conn.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        conn.close()


@app.route("/api/sales/<int:sale_id>", methods=["DELETE"])
def delete_sale(sale_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    conn = get_conn()
    try:
        conn.execute("BEGIN")
        row = conn.execute("SELECT * FROM sales WHERE id = ?", (sale_id,)).fetchone()
        if not row:
            conn.rollback()
            return jsonify({"error": "Sale not found"}), 404

        conn.execute("UPDATE drugs SET qty = qty + ? WHERE id = ?", (row["qty"], row["drug_id"]))
        conn.execute("DELETE FROM sales WHERE id = ?", (sale_id,))
        conn.commit()
        return jsonify({"ok": True})
    finally:
        conn.close()


@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM expenses ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([expense_row_to_dict(row) for row in rows])


@app.route("/api/expenses", methods=["POST"])
def create_expense():
    payload = request.get_json(silent=True) or {}
    description = (payload.get("description") or "").strip()
    category = (payload.get("category") or "").strip()
    amount = payload.get("amount")

    if not description or not category:
        return jsonify({"error": "Description and category are required"}), 400
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400
    if amount <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    timestamp = payload.get("timestamp") or datetime.utcnow().isoformat(timespec="seconds")
    conn = get_conn()
    cur = conn.execute(
        """
        INSERT INTO expenses (description, amount, category, timestamp)
        VALUES (?, ?, ?, ?)
        """,
        (description, amount, category, timestamp),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM expenses WHERE id = ?", (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify(expense_row_to_dict(row)), 201


@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    admin_error = require_admin()
    if admin_error:
        return admin_error
    conn = get_conn()
    cur = conn.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    if cur.rowcount == 0:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/dashboard/summary", methods=["GET"])
def dashboard_summary():
    selected_range = request.args.get("range", "all")
    date_filter_clause = ""
    date_filter_params = ()
    if selected_range in ("7d", "30d"):
        days = 7 if selected_range == "7d" else 30
        date_filter_clause = "WHERE DATE(timestamp) >= DATE('now', ?)"
        date_filter_params = (f"-{days - 1} days",)

    conn = get_conn()
    revenue_row = conn.execute(
        """
        SELECT COALESCE(SUM(total_price), 0.0) AS total_revenue
        FROM sales
        """
        + date_filter_clause,
        date_filter_params,
    ).fetchone()
    expense_row = conn.execute(
        """
        SELECT COALESCE(SUM(amount), 0.0) AS total_expenses
        FROM expenses
        """
        + date_filter_clause,
        date_filter_params,
    ).fetchone()
    inventory_row = conn.execute(
        """
        SELECT COALESCE(SUM(qty * cost), 0.0) AS inventory_value
        FROM drugs
        """
    ).fetchone()
    conn.close()

    total_revenue = float(revenue_row["total_revenue"] or 0.0)
    total_expenses = float(expense_row["total_expenses"] or 0.0)
    inventory_value = float(inventory_row["inventory_value"] or 0.0)
    gross_profit = total_revenue - total_expenses

    return jsonify(
        {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "gross_profit": gross_profit,
            "inventory_value": inventory_value,
        }
    )


@app.route("/api/dashboard/sales-trend", methods=["GET"])
def dashboard_sales_trend():
    selected_range = request.args.get("range", "all")
    date_filter_clause = ""
    date_filter_params = ()
    if selected_range in ("7d", "30d"):
        days = 7 if selected_range == "7d" else 30
        date_filter_clause = "WHERE DATE(timestamp) >= DATE('now', ?)"
        date_filter_params = (f"-{days - 1} days",)

    conn = get_conn()
    rows = conn.execute(
        """
        SELECT DATE(timestamp) as sale_date, SUM(total_price) as daily_revenue
        FROM sales
        """
        + date_filter_clause
        + """
        GROUP BY DATE(timestamp)
        ORDER BY sale_date ASC
        """,
        date_filter_params,
    ).fetchall()
    conn.close()

    trend = [
        {
            "date": row["sale_date"],
            "revenue": float(row["daily_revenue"] or 0.0),
        }
        for row in rows
    ]
    return jsonify(trend)


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    conn = get_conn()
    row = conn.execute(
        "SELECT username, password_hash, role FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    conn.close()
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401
    return jsonify({"username": row["username"], "role": row["role"]})


if __name__ == "__main__":
    setup_database()
    print("=" * 52)
    print("  PharmaKristo running at http://localhost:5000")
    print("=" * 52)
    app.run(debug=True, port=5000)
