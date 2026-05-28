# data.py — PharmaKristo mock data store
# In production, replace with SQLAlchemy + PostgreSQL / SQLite.
# All amounts in Ghana Cedis (₵).

from datetime import date

PHARMACY = {
    "name":   "Kristo Health Pharmacy",
    "branch": "All Branches",
    "user":   {"name": "Araba Yeboah", "role": "Admin", "email": "admin1.adoma@d.."},
}

PRODUCTS = [
    {"id":1,  "name":"Adhesive Plaster (100s)",       "generic":"Bandage",          "batch":"BACC35536", "qty":254, "min":20,  "expiry":"Jan 20, 2029", "cost":8.00,  "sell":15.00, "supplier":"Ayrton Drug Manufacturing",  "status":"in_stock"},
    {"id":2,  "name":"Adhesive Plaster (100s)",       "generic":"Bandage",          "batch":"BELG59720", "qty":87,  "min":20,  "expiry":"Oct 31, 2027", "cost":8.00,  "sell":15.00, "supplier":"Unichem Industries",          "status":"in_stock"},
    {"id":3,  "name":"Adhesive Plaster (100s)",       "generic":"Bandage",          "batch":"BKUM70479", "qty":76,  "min":20,  "expiry":"May 16, 2028", "cost":8.00,  "sell":15.00, "supplier":"Danadams Pharmaceutical",     "status":"in_stock"},
    {"id":4,  "name":"Amlodipine 10mg (28s)",         "generic":"Amlodipine",       "batch":"BKUM68348", "qty":147, "min":20,  "expiry":"Nov 29, 2027", "cost":9.00,  "sell":18.00, "supplier":"M&G Pharmaceuticals",         "status":"in_stock"},
    {"id":5,  "name":"Amlodipine 5mg (28s)",          "generic":"Amlodipine",       "batch":"BKUM70480", "qty":3,   "min":12,  "expiry":"May 16, 2028", "cost":7.00,  "sell":14.00, "supplier":"Danadams Pharmaceutical",     "status":"low_stock",  "low":True},
    {"id":6,  "name":"Amlodipine 5mg (28s)",          "generic":"Amlodipine",       "batch":"BKGH44210", "qty":64,  "min":12,  "expiry":"Aug 03, 2027", "cost":7.00,  "sell":14.00, "supplier":"Ernest Chemists",             "status":"in_stock"},
    {"id":7,  "name":"Amlodipine 5mg (28s)",          "generic":"Amlodipine",       "batch":"BKUM77012", "qty":90,  "min":12,  "expiry":"Dec 14, 2028", "cost":7.00,  "sell":14.00, "supplier":"Kinapharma Ltd",              "status":"in_stock"},
    {"id":8,  "name":"Amoxicillin 500mg (21 caps)",   "generic":"Amoxicillin",      "batch":"AMOX22101", "qty":144, "min":24,  "expiry":"Aug 31, 2026", "cost":12.00, "sell":20.00, "supplier":"Phyto-Riker Pharmaceuticals", "status":"in_stock"},
    {"id":9,  "name":"Amoxicillin 500mg (21 caps)",   "generic":"Amoxicillin",      "batch":"AMOX30042", "qty":22,  "min":24,  "expiry":"Jan 15, 2027", "cost":12.00, "sell":20.00, "supplier":"Phyto-Riker Pharmaceuticals", "status":"low_stock",  "low":True},
    {"id":10, "name":"Artemether+Lumefantrine (24s)", "generic":"Artemether",       "batch":"ARTL10023", "qty":28,  "min":10,  "expiry":"Mar 20, 2027", "cost":22.00, "sell":38.00, "supplier":"Ayrton Drug Manufacturing",   "status":"in_stock"},
    {"id":11, "name":"Cetirizine 10mg (30s)",         "generic":"Cetirizine",       "batch":"CETI55001", "qty":210, "min":30,  "expiry":"Jul 10, 2028", "cost":6.00,  "sell":12.00, "supplier":"Ernest Chemists",             "status":"in_stock"},
    {"id":12, "name":"Ciprofloxacin 500mg (10s)",     "generic":"Ciprofloxacin",    "batch":"CIPR88012", "qty":38,  "min":18,  "expiry":"Sep 05, 2027", "cost":14.00, "sell":25.00, "supplier":"Kinapharma Ltd",              "status":"in_stock"},
    {"id":13, "name":"Diclofenac 50mg (30s)",         "generic":"Diclofenac",       "batch":"DICL44301", "qty":188, "min":30,  "expiry":"Dec 30, 2027", "cost":7.00,  "sell":13.00, "supplier":"Unichem Industries",          "status":"in_stock"},
    {"id":14, "name":"Folic Acid 5mg (100s)",         "generic":"Folic Acid",       "batch":"FOLI21109", "qty":412, "min":50,  "expiry":"Nov 14, 2028", "cost":3.00,  "sell":6.00,  "supplier":"Phyto-Riker Pharmaceuticals", "status":"in_stock"},
    {"id":15, "name":"Ibuprofen 400mg (100s)",        "generic":"Ibuprofen",        "batch":"IBUP39901", "qty":322, "min":60,  "expiry":"Feb 28, 2028", "cost":10.00, "sell":18.00, "supplier":"M&G Pharmaceuticals",         "status":"in_stock"},
    {"id":16, "name":"Lydia Contraceptive (28s)",     "generic":"Levonorgestrel",   "batch":"LYDI00010", "qty":0,   "min":17,  "expiry":"Dec 31, 2027", "cost":8.00,  "sell":16.00, "supplier":"Danadams Pharmaceutical",     "status":"out_stock"},
    {"id":17, "name":"Maternity Multivitamin (30s)",  "generic":"Multivitamin",     "batch":"MULT55801", "qty":0,   "min":12,  "expiry":"Jun 30, 2028", "cost":9.00,  "sell":18.00, "supplier":"Kinapharma Ltd",              "status":"out_stock"},
    {"id":18, "name":"Metronidazole 400mg (21s)",     "generic":"Metronidazole",    "batch":"METR00123", "qty":96,  "min":24,  "expiry":"Oct 10, 2027", "cost":8.00,  "sell":14.00, "supplier":"Ayrton Drug Manufacturing",   "status":"in_stock"},
    {"id":19, "name":"Multivitamin (30s)",            "generic":"Multivitamin",     "batch":"MULT22801", "qty":380, "min":50,  "expiry":"Mar 15, 2029", "cost":5.00,  "sell":10.00, "supplier":"Ernest Chemists",             "status":"in_stock"},
    {"id":20, "name":"ORS Sachet",                   "generic":"Oral Rehydration", "batch":"ORSS00401", "qty":56,  "min":30,  "expiry":"Jul 20, 2028", "cost":1.00,  "sell":2.50,  "supplier":"Phyto-Riker Pharmaceuticals", "status":"in_stock"},
    {"id":21, "name":"Paracetamol 500mg (100s)",     "generic":"Paracetamol",      "batch":"PARA00001", "qty":0,   "min":18,  "expiry":"Apr 30, 2027", "cost":6.00,  "sell":12.00, "supplier":"Kinapharma Ltd",              "status":"out_stock"},
    {"id":22, "name":"Paracetamol 500mg (100s)",     "generic":"Paracetamol",      "batch":"PARA55021", "qty":480, "min":100, "expiry":"Jun 15, 2028", "cost":6.00,  "sell":12.00, "supplier":"M&G Pharmaceuticals",         "status":"in_stock"},
    {"id":23, "name":"Paracetamol Syrup 120mg/5mL",  "generic":"Paracetamol",      "batch":"PARSYR001", "qty":24,  "min":18,  "expiry":"Sep 01, 2026", "cost":8.00,  "sell":15.00, "supplier":"Danadams Pharmaceutical",     "status":"low_stock",  "low":True},
    {"id":24, "name":"Zinc Sulphate (10s)",           "generic":"Zinc Sulphate",    "batch":"ZINC00201", "qty":240, "min":50,  "expiry":"Dec 05, 2028", "cost":4.00,  "sell":8.00,  "supplier":"Ayrton Drug Manufacturing",   "status":"in_stock"},
    {"id":25, "name":"Omeprazole 20mg (14s)",         "generic":"Omeprazole",       "batch":"OMEP11102", "qty":130, "min":24,  "expiry":"Nov 20, 2027", "cost":9.00,  "sell":18.00, "supplier":"Ernest Chemists",             "status":"in_stock"},
    {"id":26, "name":"Calamine Lotion 15%",           "generic":"Calamine",         "batch":"CALA88801", "qty":32,  "min":10,  "expiry":"Aug 25, 2028", "cost":12.00, "sell":22.00, "supplier":"Phyto-Riker Pharmaceuticals", "status":"in_stock"},
    {"id":27, "name":"Chloramphenicol Eye Drops",     "generic":"Chloramphenicol",  "batch":"CHLO77701", "qty":18,  "min":12,  "expiry":"May 31, 2026", "cost":8.00,  "sell":16.00, "supplier":"Kinapharma Ltd",              "status":"expiring_soon", "expiring":True},
    {"id":28, "name":"Ferrous Sulphate (200s)",       "generic":"Ferrous Sulphate", "batch":"FERR22301", "qty":9,   "min":30,  "expiry":"Jan 10, 2028", "cost":7.00,  "sell":14.00, "supplier":"Unichem Industries",          "status":"low_stock",  "low":True},
    {"id":29, "name":"Vitamin C 250mg (100s)",        "generic":"Ascorbic Acid",    "batch":"VITC01101", "qty":165, "min":40,  "expiry":"Mar 28, 2029", "cost":8.00,  "sell":15.00, "supplier":"M&G Pharmaceuticals",         "status":"in_stock"},
    {"id":30, "name":"Albendazole 400mg",             "generic":"Albendazole",      "batch":"ALBE55501", "qty":41,  "min":15,  "expiry":"Jul 31, 2027", "cost":3.00,  "sell":6.00,  "supplier":"Ayrton Drug Manufacturing",   "status":"in_stock"},
]

SALES = [
    {"id":"S-1284", "date":"May 27, 2026", "time":"10:14", "customer":"Walk-in",      "items":[{"name":"Paracetamol 500mg","qty":18,"price":12,"total":216}],                              "total":216,   "payment":"Cash",  "cashier":"Araba Yeboah"},
    {"id":"S-1283", "date":"May 27, 2026", "time":"09:52", "customer":"Mr. Mensah",   "items":[{"name":"Amoxicillin 500mg","qty":21,"price":20,"total":420},{"name":"ORS Sachet","qty":4,"price":2.5,"total":10}], "total":430,   "payment":"MoMo",  "cashier":"Araba Yeboah"},
    {"id":"S-1282", "date":"May 26, 2026", "time":"16:40", "customer":"Mrs. Owusu",   "items":[{"name":"Artemether+Lumefantrine","qty":1,"price":38,"total":38}],                          "total":38,    "payment":"Cash",  "cashier":"Kofi Ansah"},
    {"id":"S-1281", "date":"May 26, 2026", "time":"14:22", "customer":"Walk-in",      "items":[{"name":"Ibuprofen 400mg","qty":3,"price":18,"total":54},{"name":"Cetirizine 10mg","qty":1,"price":12,"total":12}], "total":66,  "payment":"Card",  "cashier":"Araba Yeboah"},
    {"id":"S-1280", "date":"May 25, 2026", "time":"11:05", "customer":"Mr. Kwame",    "items":[{"name":"Omeprazole 20mg","qty":2,"price":18,"total":36}],                                  "total":36,    "payment":"Cash",  "cashier":"Kofi Ansah"},
    {"id":"S-1279", "date":"May 24, 2026", "time":"09:30", "customer":"Walk-in",      "items":[{"name":"Zinc Sulphate","qty":2,"price":8,"total":16},{"name":"ORS Sachet","qty":6,"price":2.5,"total":15}], "total":31, "payment":"Cash",  "cashier":"Araba Yeboah"},
]

EXPENSES = [
    {"id":1,  "date":"May 15, 2026", "description":"Bi-weekly staff payroll",      "category":"Salaries",   "amount":12140.41},
    {"id":2,  "date":"May 14, 2026", "description":"Bi-weekly staff payroll",      "category":"Salaries",   "amount":8050.79},
    {"id":3,  "date":"May 10, 2026", "description":"Bi-weekly staff payroll",      "category":"Salaries",   "amount":13287.01},
    {"id":4,  "date":"May 9, 2026",  "description":"Bi-weekly staff payroll",      "category":"Salaries",   "amount":12113.02},
    {"id":5,  "date":"May 7, 2026",  "description":"Bi-weekly staff payroll",      "category":"Salaries",   "amount":7191.66},
    {"id":6,  "date":"May 2, 2026",  "description":"Bi-weekly staff payroll",      "category":"Salaries",   "amount":12111.63},
    {"id":7,  "date":"May 1, 2026",  "description":"Shop rent - May 2026",         "category":"Rent",       "amount":3500.00},
    {"id":8,  "date":"May 5, 2026",  "description":"Electricity bill",             "category":"Utilities",  "amount":890.30},
    {"id":9,  "date":"May 3, 2026",  "description":"Drug purchase - Ayrton",       "category":"Supplies",   "amount":2800.00},
    {"id":10, "date":"May 12, 2026", "description":"Internet & phone",             "category":"Utilities",  "amount":305.00},
    {"id":11, "date":"May 8, 2026",  "description":"Drug purchase - Kinapharma",   "category":"Supplies",   "amount":1500.00},
    {"id":12, "date":"May 6, 2026",  "description":"Cleaning & waste disposal",    "category":"Maintenance","amount":200.00},
]

STAFF = [
    {"id":1, "name":"Araba Yeboah", "role":"Admin Pharmacist",      "email":"admin@pharmakristo.com", "phone":"055-123-4567", "status":"active"},
    {"id":2, "name":"Kofi Ansah",   "role":"Dispensary Technician", "email":"kofi@pharmakristo.com",  "phone":"024-987-6543", "status":"active"},
    {"id":3, "name":"Ama Mensah",   "role":"Accounts Officer",      "email":"ama@pharmakristo.com",   "phone":"026-555-8901", "status":"active"},
    {"id":4, "name":"Yaw Boateng",  "role":"Store Keeper",          "email":"yaw@pharmakristo.com",   "phone":"059-222-3344", "status":"active"},
    {"id":5, "name":"Efua Darko",   "role":"Sales Attendant",       "email":"efua@pharmakristo.com",  "phone":"027-444-7788", "status":"on_leave"},
]

_sale_counter = len(SALES)


def get_stats():
    today_sales = [s for s in SALES if s["date"] == "May 27, 2026"]
    daily_rev  = sum(s["total"] for s in today_sales)
    # Reference-matched demo values for a realistic prototype
    monthly_revenue = 19127.00
    gross_profit    = 27771.00
    month_expenses  = 72889.82
    return {
        "daily_sales":     daily_rev,
        "daily_txns":      len(today_sales),
        "monthly_revenue": monthly_revenue,
        "monthly_txns":    121,
        "net_profit":      round(gross_profit - month_expenses, 2),   # -45118.82
        "stock_alerts":    61,
        "total_products":  282,
        "low_stock":       61,
        "expiring_soon":   15,
        "expired":         10,
        "stock_value":     952784.00,
        "month_expenses":  month_expenses,
        "top_category":    "Salaries",
        "gross_profit":    gross_profit,
        "yearly_net":      -821836.04,
    }


def add_sale(customer, items, payment):
    global _sale_counter
    _sale_counter += 1
    total = sum(i["qty"] * i["price"] for i in items)
    sale = {
        "id": f"S-{1284 + _sale_counter}",
        "date": "May 27, 2026",
        "time": "now",
        "customer": customer or "Walk-in",
        "items": items,
        "total": total,
        "payment": payment,
        "cashier": "Araba Yeboah",
    }
    SALES.insert(0, sale)
    return sale


def add_expense(description, category, amount):
    exp_id = max(e["id"] for e in EXPENSES) + 1
    EXPENSES.insert(0, {
        "id": exp_id,
        "date": "May 27, 2026",
        "description": description,
        "category": category,
        "amount": float(amount),
    })


def search_products(q):
    q = q.lower()
    return [p for p in PRODUCTS
            if q in p["name"].lower()
            or q in p["generic"].lower()
            or q in p["batch"].lower()]
