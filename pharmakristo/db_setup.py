import sqlite3
from pathlib import Path

from data import PRODUCTS
from werkzeug.security import generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "pharmakristo.db"


def setup_database():
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS drugs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            generic TEXT NOT NULL,
            batch TEXT NOT NULL,
            qty INTEGER NOT NULL,
            min_qty INTEGER NOT NULL,
            expiry TEXT NOT NULL,
            cost REAL NOT NULL,
            sell REAL NOT NULL,
            supplier TEXT NOT NULL,
            status TEXT NOT NULL
        )
        """
    )

    row = conn.execute("SELECT COUNT(*) FROM drugs").fetchone()
    is_empty = row[0] == 0
    if is_empty:
        conn.executemany(
            """
            INSERT INTO drugs (name, generic, batch, qty, min_qty, expiry, cost, sell, supplier, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    item["name"],
                    item["generic"],
                    item["batch"],
                    int(item["qty"]),
                    int(item["min"]),
                    item["expiry"],
                    float(item["cost"]),
                    float(item["sell"]),
                    item["supplier"],
                    item["status"],
                )
                for item in PRODUCTS
            ],
        )
        conn.commit()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drug_id INTEGER NOT NULL,
            drug_name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            total_price REAL NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'cashier'))
        )
        """
    )

    sales_count = conn.execute("SELECT COUNT(*) FROM sales").fetchone()[0]
    if sales_count == 0:
        conn.executemany(
            """
            INSERT INTO sales (drug_id, drug_name, qty, total_price, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """,
            [
                (22, "Paracetamol 500mg (100s)", 3, 36.00, "2026-05-27T09:15:00"),
                (11, "Cetirizine 10mg (30s)", 2, 24.00, "2026-05-27T10:10:00"),
            ],
        )

    expense_count = conn.execute("SELECT COUNT(*) FROM expenses").fetchone()[0]
    if expense_count == 0:
        conn.executemany(
            """
            INSERT INTO expenses (description, amount, category, timestamp)
            VALUES (?, ?, ?, ?)
            """,
            [
                ("Electricity bill", 890.30, "Utilities", "2026-05-27T08:30:00"),
                ("Supplier restock payment", 2800.00, "Supplies", "2026-05-27T11:40:00"),
            ],
        )

    user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if user_count == 0:
        conn.executemany(
            """
            INSERT INTO users (username, password_hash, role)
            VALUES (?, ?, ?)
            """,
            [
                ("admin", generate_password_hash("pharmakristo123"), "admin"),
                ("cashier", generate_password_hash("cashier123"), "cashier"),
            ],
        )
    conn.commit()

    conn.close()
    return DB_PATH


if __name__ == "__main__":
    path = setup_database()
    print(f"SQLite database ready: {path}")
