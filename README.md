# MindLab 🧠

**MindLab** is a modern Full-Stack JavaScript web platform designed to provide an interactive and educational experience through a variety of cognitive and motor games. The project helps develop memory, attention, logical thinking, and typing/reaction speed.

Technically, this is a PERN-like stack application, replacing PostgreSQL with MySQL (Node.js + Express + React + MySQL), offering a robust relational database approach.

---

## 📌 Table of Contents
* [Purpose and Objectives](#-purpose-and-objectives)
* [Included Games & Tests](#-included-games--tests)
* [Key Architecture Features](#-key-architecture-features)
* [Tech Stack](#%EF%B8%8F-tech-stack)
* [Getting Started](#-getting-started)

---

## 🎯 Purpose and Objectives

### Main Goal
To create a web platform for cognitive development, combining educational elements with gamification and personal progress tracking.

### Key Features & Objectives
*   **Game Development:** Creating specialized modules to train memory, attention, typing speed, and reflexes.
*   **Educational Element:** Providing insights within each module about the specific cognitive skills being developed during gameplay.
*   **User Profiles:** Tracking, saving, and displaying user scores and overall progress over time.
*   **Modern UX/UI:** Delivering an attractive, clean, and intuitive graphical user interface with multiple themes.
*   **Future Plans:** Implementing a competitive real-time environment for users to challenge each other.

---

## 🎮 Included Games & Tests

*   ⚡ **Reaction Time** – React as quickly as possible when the screen changes. This sharpens your response speed, alertness, and ability to act under uncertainty. *(Metric: ms)*
*   🧩 **Memory Matrix** – Memorize a sequence of highlighted cells and reproduce it from memory. This trains short-term memory, spatial recall, and focused attention. *(Metric: score)*
*   ✨ **Tile Flash** – Memorize the flashing tiles and select them before the timer runs out. This improves visual attention, pattern recognition, and selection accuracy. *(Metric: lvl)*
*   🔢 **Number Memory** – Remember the longest number sequence you can before your recall breaks down. This strengthens short-term memory and concentration. *(Metric: digits)*
*   ⌨️ **Typing Speed** – Type as fast and accurately as possible to train rhythm, motor automation, and focus under pressure. *(Metric: wpm)*
*   ⏳ 🎯 **Aim Trainer** *(Soon)* – Hit the appearing targets as quickly and precisely as you can to train visual-motor coordination and movement control. *(Metric: ms)*

---

## ⚡ Key Architecture Features

*   **REST API:** Clean separation and communication between the frontend and backend.
*   **Dynamic Theme System:** Powered by CSS Variables, supporting **4 distinct themes**.
*   **Authentication & Security:** Secure sessions using **JWT (JSON Web Tokens)** stored in `localStorage` with password hashing via **bcrypt**.
*   **Global State Management:** Managed efficiently using the native **React Context API** for Authentication and Theme states.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** [React](https://react.dev) (built with [Vite](https://vitejs.dev))
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com) & CSS3 Variables
*   **Routing:** [React Router DOM](https://reactrouter.com)
*   **HTTP Client:** [Axios](https://axios-http.com)

### Backend
*   **Environment & Framework:** [Node.js](https://nodejs.org) & [Express.js](https://expressjs.com)
*   **Database:** [MySQL](https://mysql.com) (using [mysql2](https://github.com))
*   **Security:** [bcrypt](https://github.com) & [jsonwebtoken](https://github.com)
*   **Development Tools:** [Nodemon](https://nodemon.io), [ESLint](https://eslint.org), [PostCSS](https://postcss.org)

---

## 💻 Getting Started

The project is split into a client-side (frontend) and a server-side (backend) application.

### 1. Clone the Repository
```bash
git clone https://github.com/VeaPhiz/cognitive-app
cd cognitive-app
```

### 2. Setup and Run the Backend (Server)
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables by creating a `.env` file inside the `server/` folder (define `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `JWT_SECRET`).
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Setup and Run the Frontend (Client)
1. Open a new terminal window in the root directory (`cognitive-app`).
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React application via Vite:
   ```bash
   npm run dev
   ```
