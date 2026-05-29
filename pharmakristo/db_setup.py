# db_setup.py — Initialize database and seed default auth users
# Run: python db_setup.py

import db


def setup_database():
    db.init_db()
    db.ensure_default_auth_users()
    return db.DB_PATH


if __name__ == "__main__":
    path = setup_database()
    print(f"SQLite database ready: {path}")
    print("Default logins:")
    print("  admin / 12345 (admin)")
    print("  cashier1 / 12345 (cashier)")
