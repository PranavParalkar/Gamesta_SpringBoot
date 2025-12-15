import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Landing from "./pages/Landing";
import Ideas from "./pages/Ideas";
import Events from "./pages/Events";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Login from "./pages/login";
import Submit from "./pages/submit";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";
import Registration from "./pages/Registration";
import Admin from "./pages/Admin";
import Trending from "./pages/Trending";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#050015]">
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/events" element={<Events />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/trending" element={<Trending />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
