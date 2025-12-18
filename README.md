# Exam Platform - Online Proctored Exam System

A full-stack online exam platform with teacher interface for exam creation and student interface for taking exams with fullscreen enforcement and proctoring features.

## Features

### Teacher Features
- ✅ Create and manage exams
- ✅ Add/edit/delete questions with images
- ✅ View student results and analytics
- ✅ Track fullscreen exit attempts
- ✅ See detailed student performance metrics

### Student Features
- ✅ Select and take exams
- ✅ Fullscreen enforcement (cannot exit during exam)
- ✅ Timer with auto-submit
- ✅ Question navigation and review
- ✅ Instant results after submission

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Authentication**: JWT

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd exam_final_boss
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 4000
   ```

3. **Setup Frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Docs: http://localhost:4000/docs

### First Time Setup

1. **Register a teacher account**
   - Go to http://localhost:4000/docs
   - Use POST `/auth/register` endpoint
   - Body:
     ```json
     {
       "name": "Your Name",
       "email": "teacher@example.com",
       "password": "yourpassword",
       "role": "TEACHER"
     }
     ```

2. **Login as teacher**
   - Go to http://localhost:5173/#/teacher/login
   - Use your registered credentials

3. **Create an exam**
   - Click "Create New Exam"
   - Fill in exam details
   - Add questions
   - Students can now take the exam!

## Project Structure

```
exam_final_boss/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── data.sqlite         # SQLite database
│   └── uploads/            # Question images
├── frontend/
│   ├── src/
│   │   ├── screens/        # React components
│   │   └── main-entry.tsx  # App entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment options:
- **Railway** (Backend) + **Vercel** (Frontend) - Recommended
- **Render** - Full stack hosting
- **Self-hosted VPS** - Full control

## Environment Variables

### Backend
Create `backend/.env`:
```
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
PORT=4000
```

### Frontend
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:4000
```

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /exams` - List exams
- `POST /exams` - Create exam (teacher)
- `GET /exams/{id}` - Get exam details
- `POST /exams/{id}/questions` - Add question (teacher)
- `POST /attempts` - Start exam attempt
- `POST /attempts/{id}/submit` - Submit exam
- `GET /attempts/{id}/results` - Get results
- `GET /exams/{id}/attempts` - Get all attempts (teacher)

See http://localhost:4000/docs for full API documentation.

## Security Features

- ✅ Fullscreen enforcement during exams
- ✅ Fullscreen exit tracking
- ✅ JWT authentication
- ✅ Password hashing (pbkdf2_sha256)
- ✅ CORS protection
- ✅ Input validation

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

