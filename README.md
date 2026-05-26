# MindLab 🧠

**MindLab** is a web platform designed to provide an interactive and educational experience for users through a variety of cognitive and motor games. The project helps develop memory, attention, logical thinking, and typing/reaction speed.

---

## 📌 Table of Contents
* [Purpose and Objectives](#-purpose-and-objectives)
* [Included Games & Tests](#-included-games--tests)
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
*   **Modern UX/UI:** Delivering an attractive, clean, and intuitive graphical user interface.
*   **Future Plans:** Implementing a competitive real-time environment for users to challenge each other.

---

## 🎮 Included Games & Tests

*   ✅ **3x3 Simon Game** – A concentration and memory test requiring users to repeat an increasing sequence of lit squares.
*   ✅ **Number Memory** – A visual memory challenge where users memorize and reproduce increasingly long sequences of numbers.
*   ✅ **Visual Memory** – Developed to improve pattern recognition by remembering the exact placement of objects.
*   ✅ **Reaction Time** – Measures reflex speed and cognitive processing time upon a visual trigger.
*   ✅ **Typing Test** – Focuses on developing touch-typing skills, training users to type quickly and accurately without looking at the keyboard.
*   ⏳ **Precision / Accuracy** *(In Development)* – A motor skills test measuring hand-eye coordination by clicking fast-moving targets.

---

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), JavaScript (JSX), Tailwind CSS, CSS3, HTML5
*   **Backend:** Node.js, Express.js
*   **Tooling & Config:** ESLint, PostCSS

---

## 💻 Installing

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
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   # or 'node server.js' depending on your package.json setup
   ```

### 3. Setup and Run the Frontend (Client)
1. Open a new terminal window in the root directory (`cognitive-app`).
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React application via Vite:
   ```bash
   npm run dev
   ```
