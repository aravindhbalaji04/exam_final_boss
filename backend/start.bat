@echo off
REM Production startup script for backend (Windows)

REM Activate virtual environment if it exists
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)

REM Load environment variables if .env exists
if exist .env (
    for /f "tokens=*" %%a in (.env) do set %%a
)

REM Start uvicorn server
uvicorn main:app --host 0.0.0.0 --port %PORT% --workers 4

