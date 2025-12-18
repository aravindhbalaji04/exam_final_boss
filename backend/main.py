from datetime import datetime, timedelta
from typing import Optional
import uuid
import os
from pathlib import Path

import jwt  # type: ignore
import sqlite3
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext  # type: ignore
from pydantic import BaseModel

# Environment variables with defaults
DB_PATH = os.getenv("DB_PATH", "data.sqlite")
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me-in-production")
JWT_ALG = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 6
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

# CORS origins from environment or default
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# Use a widely supported hash (avoids bcrypt issues on Windows)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    cur = conn.cursor()

    # minimal schema similar to the Node backend
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('TEACHER', 'STUDENT'))
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subject TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            created_by INTEGER NOT NULL,
            FOREIGN KEY(created_by) REFERENCES users(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            option1 TEXT NOT NULL,
            option2 TEXT NOT NULL,
            option3 TEXT NOT NULL,
            option4 TEXT NOT NULL,
            correct_option INTEGER NOT NULL,
            marks INTEGER NOT NULL DEFAULT 4,
            negative_marks REAL NOT NULL DEFAULT 1,
            image_url TEXT,
            FOREIGN KEY(exam_id) REFERENCES exams(id)
        )
        """
    )
    
    # Add image_url column to existing tables (migration)
    try:
        cur.execute("ALTER TABLE questions ADD COLUMN image_url TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            student_id INTEGER,
            student_name TEXT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            FOREIGN KEY(exam_id) REFERENCES exams(id),
            FOREIGN KEY(student_id) REFERENCES users(id)
        )
        """
    )
    
    # Add student_name column to existing tables (migration)
    try:
        cur.execute("ALTER TABLE attempts ADD COLUMN student_name TEXT")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Add roll_number, class, section columns (migration)
    for column in ["roll_number", "class", "section"]:
        try:
            cur.execute(f"ALTER TABLE attempts ADD COLUMN {column} TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
    
    # Add fullscreen_exit_count column (migration)
    try:
        cur.execute("ALTER TABLE attempts ADD COLUMN fullscreen_exit_count INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Migration: Check and fix student_id NOT NULL constraint
    # SQLite doesn't support ALTER COLUMN, so we recreate the table if needed
    try:
        cur.execute("PRAGMA table_info(attempts)")
        columns = cur.fetchall()
        student_id_info = next((col for col in columns if col[1] == "student_id"), None)
        
        # Check if student_id is NOT NULL (col[3] = 1 means NOT NULL, 0 means nullable)
        if student_id_info and student_id_info[3] == 1:
            # Need to recreate table with nullable student_id
            # Backup existing attempts
            cur.execute("SELECT * FROM attempts")
            existing_data = cur.fetchall()
            column_names = [col[1] for col in columns]
            
            # Create new table with correct schema
            cur.execute("DROP TABLE IF EXISTS attempts_old")
            cur.execute("ALTER TABLE attempts RENAME TO attempts_old")
            
            cur.execute(
                """
                CREATE TABLE attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    exam_id INTEGER NOT NULL,
                    student_id INTEGER,
                    student_name TEXT,
                    roll_number TEXT,
                    class TEXT,
                    section TEXT,
                    started_at TEXT NOT NULL,
                    finished_at TEXT,
                    FOREIGN KEY(exam_id) REFERENCES exams(id),
                    FOREIGN KEY(student_id) REFERENCES users(id)
                )
                """
            )
            
            # Restore data
            if existing_data:
                for row in existing_data:
                    # Create dict from row data
                    row_dict = {column_names[i]: row[i] for i in range(len(column_names))}
                    # Get values, handling missing columns gracefully
                    cur.execute(
                        """
                        INSERT INTO attempts (id, exam_id, student_id, student_name, roll_number, class, section, started_at, finished_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            row_dict.get("id"),
                            row_dict.get("exam_id"),
                            row_dict.get("student_id"),  # May be None
                            row_dict.get("student_name"),
                            row_dict.get("roll_number"),
                            row_dict.get("class"),
                            row_dict.get("section"),
                            row_dict.get("started_at"),
                            row_dict.get("finished_at"),
                        )
                    )
            
            cur.execute("DROP TABLE attempts_old")
            conn.commit()
    except Exception as e:
        # Migration failed, but don't crash - we'll handle in insert
        print(f"Note: Could not migrate attempts table: {e}")
        conn.rollback()
        pass

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS attempt_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            selected_option INTEGER,
            FOREIGN KEY(attempt_id) REFERENCES attempts(id),
            FOREIGN KEY(question_id) REFERENCES questions(id)
        )
        """
    )

    conn.commit()
    conn.close()


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user_id: int
    role: str
    name: str


class ExamCreate(BaseModel):
    title: str
    subject: str
    duration_minutes: int


class QuestionCreate(BaseModel):
    text: str
    option1: str
    option2: str
    option3: str
    option4: str
    correct_option: int
    marks: int = 4
    negative_marks: float = 1.0
    image_url: Optional[str] = None


class ExamWithQuestions(BaseModel):
    id: int
    title: str
    subject: str
    duration_minutes: int
    questions: list[dict]


class AttemptStart(BaseModel):
    exam_id: int
    student_name: str
    roll_number: str
    class_name: str
    section: str


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option: Optional[int] = None  # 1-4 or null if not answered


class AttemptSubmit(BaseModel):
    answers: list[AnswerSubmit]


class ExamSummary(BaseModel):
    id: int
    title: str
    subject: str
    duration_minutes: int
    question_count: int


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
        role = payload.get("role")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, role FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail="User not found")

    return {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
) -> Optional[dict]:
    if credentials is None:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = int(payload.get("sub"))
        role = payload.get("role")
    except jwt.PyJWTError:
        return None

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, role FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()

    if row is None:
        return None

    return {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can upload images")

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Return URL path (frontend will construct full URL)
    return {"url": f"http://127.0.0.1:4000/uploads/{unique_filename}"}


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: UserCreate) -> TokenResponse:
    if payload.role not in ("TEACHER", "STUDENT"):
        raise HTTPException(status_code=400, detail="Invalid role")

    password_hash = pwd_context.hash(payload.password)
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (payload.name, payload.email, password_hash, payload.role),
        )
        conn.commit()
        user_id = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already in use")

    conn.close()
    token = create_access_token(user_id, payload.role)
    return TokenResponse(token=token, user_id=user_id, role=payload.role, name=payload.name)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin) -> TokenResponse:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
        (payload.email,),
    )
    row = cur.fetchone()
    conn.close()

    if row is None or not pwd_context.verify(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(row["id"], row["role"])
    return TokenResponse(
        token=token, user_id=row["id"], role=row["role"], name=row["name"]
    )


@app.post("/exams", status_code=201)
def create_exam(
    exam: ExamCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can create exams")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO exams (title, subject, duration_minutes, created_by)
        VALUES (?, ?, ?, ?)
        """,
        (exam.title, exam.subject, exam.duration_minutes, current_user["id"]),
    )
    conn.commit()
    exam_id = cur.lastrowid
    conn.close()

    return {"id": exam_id, **exam.model_dump()}


@app.post("/exams/{exam_id}/questions", status_code=201)
def add_question(
    exam_id: int,
    question: QuestionCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can add questions")

    conn = get_db()
    cur = conn.cursor()

    # ensure exam exists and belongs to this teacher
    cur.execute(
        "SELECT id, created_by FROM exams WHERE id = ?",
        (exam_id,),
    )
    exam_row = cur.fetchone()
    if exam_row is None or exam_row["created_by"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Exam not found")

    cur.execute(
        """
        INSERT INTO questions
        (exam_id, text, option1, option2, option3, option4, correct_option, marks, negative_marks, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            exam_id,
            question.text,
            question.option1,
            question.option2,
            question.option3,
            question.option4,
            question.correct_option,
            question.marks,
            question.negative_marks,
            question.image_url,
        ),
    )
    conn.commit()
    q_id = cur.lastrowid
    conn.close()

    return {"id": q_id, **question.model_dump()}


@app.put("/exams/{exam_id}/questions/{question_id}")
def update_question(
    exam_id: int,
    question_id: int,
    question: QuestionCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can update questions")

    conn = get_db()
    cur = conn.cursor()

    # ensure exam exists and belongs to this teacher
    cur.execute(
        "SELECT id, created_by FROM exams WHERE id = ?",
        (exam_id,),
    )
    exam_row = cur.fetchone()
    if exam_row is None or exam_row["created_by"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Exam not found")

    # ensure question exists and belongs to this exam
    cur.execute(
        "SELECT id FROM questions WHERE id = ? AND exam_id = ?",
        (question_id, exam_id),
    )
    if cur.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Question not found")

    cur.execute(
        """
        UPDATE questions
        SET text = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?,
            correct_option = ?, marks = ?, negative_marks = ?, image_url = ?
        WHERE id = ? AND exam_id = ?
        """,
        (
            question.text,
            question.option1,
            question.option2,
            question.option3,
            question.option4,
            question.correct_option,
            question.marks,
            question.negative_marks,
            question.image_url,
            question_id,
            exam_id,
        ),
    )
    conn.commit()
    conn.close()

    return {"id": question_id, **question.model_dump()}


@app.delete("/exams/{exam_id}/questions/{question_id}", status_code=204)
def delete_question(
    exam_id: int,
    question_id: int,
    current_user: dict = Depends(get_current_user),
) -> None:
    if current_user["role"] != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can delete questions")

    conn = get_db()
    cur = conn.cursor()

    # ensure exam exists and belongs to this teacher
    cur.execute(
        "SELECT id, created_by FROM exams WHERE id = ?",
        (exam_id,),
    )
    exam_row = cur.fetchone()
    if exam_row is None or exam_row["created_by"] != current_user["id"]:
        conn.close()
        raise HTTPException(status_code=404, detail="Exam not found")

    # ensure question exists and belongs to this exam
    cur.execute(
        "SELECT id FROM questions WHERE id = ? AND exam_id = ?",
        (question_id, exam_id),
    )
    if cur.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Question not found")

    cur.execute("DELETE FROM questions WHERE id = ? AND exam_id = ?", (question_id, exam_id))
    conn.commit()
    conn.close()


@app.get("/exams", response_model=list[ExamSummary])
def list_exams(current_user: Optional[dict] = Depends(get_current_user_optional)) -> list[ExamSummary]:
    conn = get_db()
    cur = conn.cursor()
    
    # If teacher, show only their exams. Otherwise, show all exams with questions.
    if current_user and current_user.get("role") == "TEACHER":
        cur.execute(
            """
            SELECT e.id, e.title, e.subject, e.duration_minutes,
                   COUNT(q.id) as question_count
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            WHERE e.created_by = ?
            GROUP BY e.id, e.title, e.subject, e.duration_minutes
            ORDER BY e.id DESC
            """,
            (current_user["id"],),
        )
    else:
        # Public: show all exams that have at least one question
        cur.execute(
            """
            SELECT e.id, e.title, e.subject, e.duration_minutes,
                   COUNT(q.id) as question_count
            FROM exams e
            LEFT JOIN questions q ON e.id = q.exam_id
            GROUP BY e.id, e.title, e.subject, e.duration_minutes
            HAVING COUNT(q.id) > 0
            ORDER BY e.id DESC
            """,
        )
    
    rows = cur.fetchall()
    conn.close()

    return [
        ExamSummary(
            id=row["id"],
            title=row["title"],
            subject=row["subject"],
            duration_minutes=row["duration_minutes"],
            question_count=row["question_count"],
        )
        for row in rows
    ]


@app.get("/exams/{exam_id}", response_model=ExamWithQuestions)
def get_exam(
    exam_id: int,
    current_user: Optional[dict] = Depends(get_current_user_optional),
) -> ExamWithQuestions:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, title, subject, duration_minutes FROM exams WHERE id = ?",
        (exam_id,),
    )
    exam_row = cur.fetchone()
    if exam_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Exam not found")

    # Include correct_option only if teacher is authenticated
    is_teacher = current_user is not None and current_user.get("role") == "TEACHER"
    if is_teacher:
        cur.execute(
            """
            SELECT id, text, option1, option2, option3, option4, correct_option, marks, negative_marks, image_url
            FROM questions
            WHERE exam_id = ?
            ORDER BY id ASC
            """,
            (exam_id,),
        )
    else:
        cur.execute(
            """
            SELECT id, text, option1, option2, option3, option4, marks, negative_marks, image_url
            FROM questions
            WHERE exam_id = ?
            ORDER BY id ASC
            """,
            (exam_id,),
        )

    questions = []
    for q in cur.fetchall():
        question_data = {
            "id": q["id"],
            "text": q["text"],
            "options": [
                q["option1"],
                q["option2"],
                q["option3"],
                q["option4"],
            ],
            "marks": q["marks"],
            "negative_marks": q["negative_marks"],
        }
        if q["image_url"]:
            question_data["image_url"] = q["image_url"]
        if is_teacher:
            question_data["correct_option"] = q["correct_option"]
        questions.append(question_data)

    conn.close()

    return ExamWithQuestions(
        id=exam_row["id"],
        title=exam_row["title"],
        subject=exam_row["subject"],
        duration_minutes=exam_row["duration_minutes"],
        questions=questions,
    )


@app.post("/attempts", status_code=201)
def start_attempt(attempt: AttemptStart) -> dict:
    conn = get_db()
    cur = conn.cursor()
    
    # Verify exam exists
    cur.execute("SELECT id FROM exams WHERE id = ?", (attempt.exam_id,))
    if cur.fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Create attempt
    started_at = datetime.utcnow().isoformat()
    # Try inserting without student_id first (for nullable column)
    try:
        cur.execute(
            """
            INSERT INTO attempts (exam_id, student_name, roll_number, class, section, started_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (attempt.exam_id, attempt.student_name, attempt.roll_number, attempt.class_name, attempt.section, started_at),
        )
    except sqlite3.IntegrityError as e:
        # If student_id has NOT NULL constraint, try with a placeholder value
        if "student_id" in str(e):
            try:
                cur.execute(
                    """
                    INSERT INTO attempts (exam_id, student_id, student_name, roll_number, class, section, started_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (attempt.exam_id, 0, attempt.student_name, attempt.roll_number, attempt.class_name, attempt.section, started_at),
                )
            except Exception as e2:
                conn.close()
                raise HTTPException(
                    status_code=500,
                    detail=f"Database error. Please restart the backend server to run migrations. Error: {str(e2)}"
                )
        else:
            conn.close()
            raise HTTPException(
                status_code=500,
                detail=f"Database constraint error: {str(e)}"
            )
    
    conn.commit()
    attempt_id = cur.lastrowid
    conn.close()
    
    return {"id": attempt_id, "exam_id": attempt.exam_id, "started_at": started_at}


@app.post("/attempts/{attempt_id}/fullscreen-exit")
def record_fullscreen_exit(attempt_id: int) -> dict:
    """Record a fullscreen exit event for an attempt"""
    conn = get_db()
    cur = conn.cursor()
    
    # Verify attempt exists
    cur.execute("SELECT id, finished_at FROM attempts WHERE id = ?", (attempt_id,))
    attempt_row = cur.fetchone()
    if attempt_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    # Don't allow recording exits after submission
    if attempt_row["finished_at"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Attempt already submitted")
    
    # Increment fullscreen exit count
    cur.execute(
        """
        UPDATE attempts 
        SET fullscreen_exit_count = COALESCE(fullscreen_exit_count, 0) + 1
        WHERE id = ?
        """,
        (attempt_id,),
    )
    conn.commit()
    
    # Get updated count
    cur.execute("SELECT fullscreen_exit_count FROM attempts WHERE id = ?", (attempt_id,))
    updated_row = cur.fetchone()
    exit_count = updated_row["fullscreen_exit_count"] if updated_row else 0
    
    conn.close()
    
    return {"attempt_id": attempt_id, "fullscreen_exit_count": exit_count}


@app.post("/attempts/{attempt_id}/submit")
def submit_attempt(attempt_id: int, submission: AttemptSubmit) -> dict:
    conn = get_db()
    cur = conn.cursor()
    
    # Verify attempt exists
    cur.execute("SELECT id, exam_id, finished_at FROM attempts WHERE id = ?", (attempt_id,))
    attempt_row = cur.fetchone()
    if attempt_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt_row["finished_at"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Attempt already submitted")
    
    # Save all answers
    for answer in submission.answers:
        cur.execute(
            """
            INSERT INTO attempt_answers (attempt_id, question_id, selected_option)
            VALUES (?, ?, ?)
            """,
            (attempt_id, answer.question_id, answer.selected_option),
        )
    
    # Mark attempt as finished
    finished_at = datetime.utcnow().isoformat()
    cur.execute(
        "UPDATE attempts SET finished_at = ? WHERE id = ?",
        (finished_at, attempt_id),
    )
    
    conn.commit()
    conn.close()
    
    return {"id": attempt_id, "finished_at": finished_at, "answers_submitted": len(submission.answers)}


@app.get("/exams/{exam_id}/attempts")
def get_exam_attempts(
    exam_id: int,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get all attempts for a specific exam (teacher only)"""
    if current_user.get("role") != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can view exam attempts")
    
    conn = get_db()
    cur = conn.cursor()
    
    # Verify exam exists and belongs to teacher
    cur.execute(
        "SELECT id, title, subject FROM exams WHERE id = ? AND created_by = ?",
        (exam_id, current_user["id"]),
    )
    exam_row = cur.fetchone()
    if exam_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Exam not found or access denied")
    
    # Get all attempts for this exam with student details
    cur.execute(
        """
        SELECT 
            a.id, a.student_name, a.roll_number, a.class, a.section,
            a.started_at, a.finished_at, COALESCE(a.fullscreen_exit_count, 0) as fullscreen_exit_count
        FROM attempts a
        WHERE a.exam_id = ?
        ORDER BY a.finished_at DESC, a.started_at DESC
        """,
        (exam_id,),
    )
    attempts = cur.fetchall()
    
    # Get results for each attempt
    attempts_with_results = []
    for attempt in attempts:
        attempt_id = attempt["id"]
        
        # Calculate results for this attempt
        if attempt["finished_at"]:
            # Get questions with correct answers
            cur.execute(
                """
                SELECT id, correct_option, marks, negative_marks
                FROM questions
                WHERE exam_id = ?
                ORDER BY id ASC
                """,
                (exam_id,),
            )
            questions = cur.fetchall()
            
            # Get submitted answers
            cur.execute(
                """
                SELECT question_id, selected_option
                FROM attempt_answers
                WHERE attempt_id = ?
                """,
                (attempt_id,),
            )
            answers = {row["question_id"]: row["selected_option"] for row in cur.fetchall()}
            
            # Calculate scores
            total_questions = len(questions)
            attempted = len(answers)
            correct = 0
            wrong = 0
            total_score = 0.0
            
            for q in questions:
                q_id = q["id"]
                correct_option = q["correct_option"]
                marks = q["marks"]
                negative_marks = q["negative_marks"]
                selected_option = answers.get(q_id)
                
                if selected_option is not None:
                    if selected_option == correct_option:
                        correct += 1
                        total_score += marks
                    else:
                        wrong += 1
                        total_score -= negative_marks
            
            attempts_with_results.append({
                "attempt_id": attempt_id,
                "student_name": attempt["student_name"],
                "roll_number": attempt["roll_number"],
                "class": attempt["class"],
                "section": attempt["section"],
                "started_at": attempt["started_at"],
                "finished_at": attempt["finished_at"],
                "total_questions": total_questions,
                "attempted": attempted,
                "correct": correct,
                "wrong": wrong,
                "not_attempted": total_questions - attempted,
                "total_score": round(total_score, 2),
                "fullscreen_exit_count": attempt["fullscreen_exit_count"],
                "submitted": True,
            })
        else:
            # Attempt not yet submitted
            attempts_with_results.append({
                "attempt_id": attempt_id,
                "student_name": attempt["student_name"],
                "roll_number": attempt["roll_number"],
                "class": attempt["class"],
                "section": attempt["section"],
                "started_at": attempt["started_at"],
                "finished_at": None,
                "fullscreen_exit_count": attempt["fullscreen_exit_count"],
                "submitted": False,
            })
    
    # Calculate statistics
    submitted_attempts = [a for a in attempts_with_results if a["submitted"]]
    total_attempts = len(attempts_with_results)
    submitted_count = len(submitted_attempts)
    
    if submitted_count > 0:
        avg_score = sum(a["total_score"] for a in submitted_attempts) / submitted_count
        max_score = max(a["total_score"] for a in submitted_attempts)
        min_score = min(a["total_score"] for a in submitted_attempts)
    else:
        avg_score = 0
        max_score = 0
        min_score = 0
    
    conn.close()
    
    return {
        "exam": {
            "id": exam_row["id"],
            "title": exam_row["title"],
            "subject": exam_row["subject"],
        },
        "attempts": attempts_with_results,
        "statistics": {
            "total_attempts": total_attempts,
            "submitted_count": submitted_count,
            "pending_count": total_attempts - submitted_count,
            "average_score": round(avg_score, 2),
            "max_score": round(max_score, 2),
            "min_score": round(min_score, 2),
        },
    }


@app.get("/attempts/{attempt_id}/results")
def get_attempt_results(attempt_id: int) -> dict:
    conn = get_db()
    cur = conn.cursor()
    
    # Get attempt info
    cur.execute(
        "SELECT id, exam_id, finished_at FROM attempts WHERE id = ?",
        (attempt_id,),
    )
    attempt_row = cur.fetchone()
    if attempt_row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if not attempt_row["finished_at"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Attempt not yet submitted")
    
    exam_id = attempt_row["exam_id"]
    
    # Get all questions for this exam with correct answers
    cur.execute(
        """
        SELECT id, correct_option, marks, negative_marks
        FROM questions
        WHERE exam_id = ?
        ORDER BY id ASC
        """,
        (exam_id,),
    )
    questions = cur.fetchall()
    
    # Get all submitted answers
    cur.execute(
        """
        SELECT question_id, selected_option
        FROM attempt_answers
        WHERE attempt_id = ?
        """,
        (attempt_id,),
    )
    answers = {row["question_id"]: row["selected_option"] for row in cur.fetchall()}
    
    # Calculate scores
    total_questions = len(questions)
    attempted = len(answers)
    correct = 0
    wrong = 0
    total_score = 0.0
    
    question_results = []
    for q in questions:
        q_id = q["id"]
        correct_option = q["correct_option"]
        marks = q["marks"]
        negative_marks = q["negative_marks"]
        selected_option = answers.get(q_id)
        
        is_answered = selected_option is not None
        is_correct = selected_option == correct_option
        
        if is_answered:
            if is_correct:
                correct += 1
                total_score += marks
            else:
                wrong += 1
                total_score -= negative_marks
        
        question_results.append({
            "question_id": q_id,
            "selected_option": selected_option,
            "correct_option": correct_option,
            "is_correct": is_correct if is_answered else None,
            "marks_awarded": marks if (is_answered and is_correct) else (-negative_marks if (is_answered and not is_correct) else 0),
        })
    
    conn.close()
    
    return {
        "attempt_id": attempt_id,
        "exam_id": exam_id,
        "total_questions": total_questions,
        "attempted": attempted,
        "correct": correct,
        "wrong": wrong,
        "not_attempted": total_questions - attempted,
        "total_score": round(total_score, 2),
        "question_results": question_results,
    }



