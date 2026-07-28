# AI Powered Customer Complaint Management System

This is the repository for the AI Powered Customer Complaint Management System, containing the frontend and backend components.

## Project Structure

```text
AI-Customer-Complaint-System/
├── frontend/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── redux/
│       ├── services/
│       └── styles/
├── backend/
│   ├── api/
│   ├── app/
│   ├── database/
│   ├── langgraph/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── uploads/
│   └── utils/
```

## Running the Frontend

To run the frontend:

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Running the Backend

To run the backend:

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **Windows**:
     ```powershell
     venv\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
