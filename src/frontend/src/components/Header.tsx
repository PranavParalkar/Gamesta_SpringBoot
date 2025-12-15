import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import logo from "../assets/logo.png";

const ADMIN_EMAILS = new Set([
  "202301100025@mitaoe.ac.in",
  "202301040202@mitaoe.ac.in",
]);

function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("gamesta_token");
}

function signOut() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("gamesta_token");
    window.location.href = "/";
  }
}

const navItems = [
  { name: "Voting", href: "/ideas" },
  { name: "Ideas", href: "/submit" },
  { name: "Events", href: "/events" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Registration", href: "/registration" },
  { name: "Trending", href: "/trending" },
];

export default function Header() {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdminVisible, setIsAdminVisible] = useState(false);

  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    // update token if it changes in another tab
    const onStorage = () => setToken(getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // show admin only for specific emails or server roles
    const tok = getToken();
    if (!tok) return;
    (async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const email = (json?.user?.email || "").toLowerCase();
        const roles = Array.isArray(json?.user?.roles) ? json.user.roles : [];
        if (ADMIN_EMAILS.has(email) || roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")) {
          setIsAdminVisible(true);
        }
      } catch {
        // silent
      }
    })();
  }, [token]);

  return (
    <header className="sticky top-3 z-50 w-full backdrop-blur-lg rounded-2xl shadow-md mx-auto">
      <div className="flex justify-between items-center px-4 py-2 sm:px-6 md:px-10 relative">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-90 transition">
            <div className="relative">
            <img src={logo} alt="Gamesta" className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg" />
          </div>
          <span className="hidden sm:block text-xl font-semibold text-white">Gamesta</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-4 bg-gradient-to-l from-pink-400 to-purple-700 px-4 py-2 rounded-full font-medium text-sm text-gray-200 md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:z-10">
          {navItems.map(({ name, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`relative px-4 py-2 rounded-full transition-all ${
                  isActive ? "bg-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "hover:bg-white/10 hover:text-white"
                }`}
              >
                {name}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {isAdminVisible && (
            <Link to="/admin" className="relative px-4 py-2 rounded-full text-sm text-white/90 hover:bg-white/10">
              Admin
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {token ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"
                aria-label="User menu"
              >
                <User size={18} className="text-white" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-44 bg-black/80 text-white border border-white/10 rounded-lg p-2 shadow-lg"
                  >
                    <Link to="/profile" className="block px-3 py-2 text-sm hover:bg-white/10 rounded" onClick={() => setUserMenuOpen(false)}>
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login">
              <button className="text-sm font-medium text-black bg-gradient-to-r from-pink-400 to-purple-400 px-4 py-2 rounded-full hover:opacity-90 transition">
                Sign In
              </button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-black/70 border-t border-white/10 rounded-b-2xl px-6 py-4 space-y-3 text-gray-200"
          >
            {navItems.map(({ name, href }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg transition ${pathname === href ? "bg-white/10 text-pink-400" : "hover:bg-white/10 hover:text-pink-400"}`}
              >
                {name}
              </Link>
            ))}

            {isAdminVisible && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-pink-400 font-medium transition hover:bg-white/10"
              >
                Admin
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}