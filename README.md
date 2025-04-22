# Voice Clone AI

A web application that allows users to clone their voice and generate speech in their own voice. Built with Next.js for the frontend and FastAPI for the backend.

## Live Demo

Visit the live application at: [https://fires-e3b6a.web.app](https://fires-e3b6a.web.app)

## Features

- **Voice Recording**: Record your voice directly in the browser
- **Voice Upload**: Upload existing voice samples
- **Voice Cloning**: Create a unique voice model based on your samples
- **Text-to-Speech**: Generate speech in your cloned voice from any text

## Tech Stack

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- React Dropzone for file uploads
- Headless UI for accessible components
- React Hot Toast for notifications
- Axios for API calls

### Backend
- FastAPI (Python)
- TTS library for voice cloning
- Uvicorn as ASGI server

## Project Structure

```
/
├── src/                # Frontend code
│   ├── app/            # Next.js app directory
│   │   ├── components/ # React components
│   │   ├── lib/        # Utility functions and API clients
│   │   ├── styles/     # Global styles
│   │   └── types/      # TypeScript type definitions
├── backend/            # Backend code
│   ├── main.py         # FastAPI application
│   ├── uploads/        # Directory for uploaded voice samples
│   ├── outputs/        # Directory for generated audio files
│   └── models/         # Directory for trained voice models
```

## Getting Started

### Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/voice-clone-ai.git
   cd voice-clone-ai
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Start the backend server**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

5. **Start the frontend development server**
   ```bash
   # In a new terminal
   npm run dev
   ```

6. **Open the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The application is deployed with:
- Frontend: Firebase Hosting
- Backend: Render.com (free tier)

## License

MIT
