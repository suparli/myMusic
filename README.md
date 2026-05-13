# Antigravity Music Player 🎵

Antigravity is a minimalist, local-first web music player designed for users who want to stream their own music collection from a local server. It features a clean, stable UI and persistent playback state.

## ✨ Features

- **Local Library Sync:** Automatically scans and organizes your local audio files.
- **Persistent Playback:** Remembers your last played track and position even after refreshing or logging back in.
- **User Profiles:** Secure login system with the ability to update your credentials.
- **Playlist Management:** Organize your tracks into folders that act as playlists.
- **Modern UI:** Minimalist design with Dark/Light mode support.
- **No Forced Layouts:** Clean, stable, and responsive interface.

## 🚀 Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS, Lucide React, Zustand (State Management), TanStack Query.
- **Backend:** NestJS (TypeScript), TypeORM, SQLite (better-sqlite3), fs-extra.
- **Audio:** Howler.js for robust audio playback and streaming.

---

## 🛠️ Setup Instructions

Follow these steps to get the application running on your local machine.

### 1. Prerequisites
- Node.js (v18 or later recommended)
- npm or yarn

### 2. Clone the Repository
```bash
git clone https://github.com/suparli/myMusic.git
cd myMusic
```

### 3. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Prepare your music library:
   - Create a folder named `library` in the project root (the same level as `backend` and `frontend`).
   - Add your music files (.mp3, .flac, .wav, .m4a) into this folder. You can organize them into subfolders (e.g., `library/Rock`, `library/Jazz`) which will be detected as playlists.
4. Build and Start the backend:
   ```bash
   npm run build
   npm run start:dev
   ```
   *The backend will run on `http://localhost:3000`.*
   *Note: On first run, a default user `admin` with password `admin` will be created automatically.*

### 4. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically run on `http://localhost:5173`.*

---

## 🔑 Default Credentials

When you first open the application, you can use the following credentials:
- **Username:** `admin`
- **Password:** `admin`

*You can change these later via the **User Profile** button in the sidebar.*

## 📂 Project Structure

- `backend/`: NestJS server handling file scanning, audio streaming, and user data.
- `frontend/`: React application with the music player UI.
- `library/`: (User Created) The source folder for all audio tracks.
- `DEVELOPMENT_LOG.md`: Detailed history of changes made during development.

---

## 📝 License
This project is for personal use. Feel free to modify it to suit your needs.
