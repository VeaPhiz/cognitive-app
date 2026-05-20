import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReactionTime  from "./pages/ReactionTime";
import MemoryMatrix from "./pages/MemoryMatrix";

import NotFound from "./pages/NotFound";


export default function App() {
  return (
     <ThemeProvider> 
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/game/reaction-time" element={<ReactionTime />} />
            <Route path="/game/memory-matrix" element={<MemoryMatrix />} />
            <Route path="*"         element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}