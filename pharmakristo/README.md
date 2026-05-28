# PharmaKristo — Pharmacy Management System

**App name:** PharmaKristo  
**Stack:** Python 3 / Flask + Jinja2 (backend) · React prototype (HTML preview)

## Quick start (Python)

```bash
cd pharmakristo
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000**

## File structure

```
pharmakristo/
├── app.py                  # Flask routes
├── data.py                 # In-memory data store (replace with SQLite/Postgres)
├── requirements.txt        # flask
├── PharmaKristo.html       # ← interactive HTML prototype (no server needed)
├── pk-style.css            # Design system CSS
├── pk-data.js              # Mock data for the prototype
├── pk-shared.jsx           # Shared React components (Sidebar, Header, Icons)
├── pk-dashboard.jsx        # Dashboard page
├── pk-products.jsx         # Products page
├── pk-sales.jsx            # Point of Sale page
├── pk-expenses.jsx         # Expenses page
├── pk-reports.jsx          # Reports page
├── pk-main.jsx             # App router + mount
├── static/
│   ├── css/style.css       # Flask static CSS (copy of pk-style.css)
│   └── js/app.js           # Shared client JS
└── templates/
    ├── base.html           # Jinja layout (sidebar + header)
    ├── dashboard.html
    ├── products.html
    ├── sales.html
    ├── expenses.html
    ├── reports.html
    └── placeholder.html    # Procurement / Receipts / Staff / Settings stubs
```

## Pages

| Route | Description |
|---|---|
| `/` or `/dashboard` | KPI cards, recent sales, low-stock alerts |
| `/products` | Full product catalog with filter / search |
| `/sales` | Point-of-sale with quick-select grid + cart |
| `/expenses` | Expense tracker with add form |
| `/reports` | Financial summary + quick comparison |
| `/procurement` | Stub — ready for purchase order module |
| `/staff` | Stub — ready for HR module |

## API endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/sales/process` | POST | Accept `{items, customer, payment}` JSON, return `{receipt_id, total}` |
| `/api/products/search?q=` | GET | Search products, return JSON |
| `/expenses/add` | POST | Add expense via form POST |

## Next steps
- Swap `data.py` dicts for **SQLAlchemy + SQLite** (or Postgres)
- Add **authentication** (Flask-Login)
- Add **receipt PDF generation** (WeasyPrint or ReportLab)
- Attach **client name** to PHARMACY dict when confirmed
- Add **branch management** (multi-location support)
