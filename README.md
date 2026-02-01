# Python & React Full Stack Application

A complete full-stack web application with a Python Flask backend and React frontend.

## Project Structure

```
.
├── backend/          # Python Flask API
│   ├── app.py        # Main application
│   ├── requirements.txt
│   └── README.md
├── frontend/         # React application
│   ├── public/       # Static files
│   ├── src/          # React components
│   ├── package.json
│   └── README.md
└── README.md         # This file
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **macOS/Linux**: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Features

- ✅ Flask REST API with CORS support
- ✅ React UI with Axios for API calls
- ✅ Communication between frontend and backend
- ✅ Hot reload for both backend and frontend

## API Endpoints

- `GET /api/hello` - Returns a greeting message
- `POST /api/data` - Accepts JSON data and returns the received data

## Development

Both the frontend and backend support hot reload during development:
- Backend: Flask debug mode enabled
- Frontend: React development server with fast refresh

## Project Notes

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`
- CORS is enabled on the backend for frontend communication
