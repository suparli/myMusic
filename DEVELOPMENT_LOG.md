# Development Log - MyMusic Player

## 📅 Session Date: May 13, 2026

### 1. Last Played Track Persistence (Bug Fix)
*   **Issue:** The music player would not load if the last saved position was `0`. Additionally, the playback state was not being saved to the database due to a debounce logic conflict with the 1-second progress updates.
*   **Fixes:**
    *   **Frontend (`App.tsx`):** Relaxed the condition for initial state loading to include position `0`.
    *   **Frontend (`PlayerBar.tsx`):** Refactored state saving to use a 10-second interval while playing and an immediate save on pause.
    *   **Frontend (`useAudioStore.ts`):** Fixed a reference bug in the `onplayerror` handler.

### 2. UI Layout & Obstruction Fixes
*   **Issue:** The `PlayerBar` was positioned absolutely, obstructing the bottom of the `Sidebar` (Sync and Logout buttons) and requiring excessive padding in `MainContent`.
*   **Fixes:**
    *   **Frontend (`App.tsx`):** Refactored the main layout from absolute positioning to a robust **Flexbox** structure.
    *   **Frontend (`PlayerBar.tsx`):** Removed `absolute` positioning to allow natural document flow.
    *   **Frontend (`MainContent`):** Reduced `pb-32` to `pb-8` for better spacing.

### 3. Authentication Page Overhaul & Stabilization
*   **Issue:** The initial login layout was too complex, and subsequent simplified versions suffered from "layout jumping" when switching tabs or showing errors.
*   **Fixes:**
    *   **Frontend (`AuthPage.tsx`):** 
        *   Simplified to a clean, centered vertical stack.
        *   Applied a strictly fixed width (`320px`) and explicit heights to all elements.
        *   Reserved a fixed space for error messages to prevent vertical shifting.
        *   Removed default `admin/admin` auto-fill from the form fields.

### 4. User Profile Management
*   **Feature:** Added ability for users to manage their credentials after logging in.
*   **Backend Changes:**
    *   Added `UpdateUserDto` for profile updates.
    *   Implemented `onModuleInit` in `UserService` to seed a default `admin/admin` account if the database is empty.
    *   Added `PUT /users/:id/profile` endpoint to update username and password.
*   **Frontend Changes:**
    *   **Sidebar:** Added "User Profile" button.
    *   **Dialog:** Created a Profile Editing dialog where users can update their username and password.

### 5. Technical Notes
*   **Database:** SQLite is used. The `admin` user is created automatically on backend startup if the `user` table is empty.
*   **Backend Build:** If new endpoints are added, remember to run `npm run build` in the `backend` folder before restarting the server to ensure `dist` files are updated.

---
*Note: This log was generated to help continue future development features.*
