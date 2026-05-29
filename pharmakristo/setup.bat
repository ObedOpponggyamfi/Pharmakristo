@echo off
echo === PharmaKristo Setup ===
pip install flask
python -c "import db; db.init_db(); db.seed_db(); print('Database ready.')"
echo.
echo Setup complete! Run: python app.py
pause
