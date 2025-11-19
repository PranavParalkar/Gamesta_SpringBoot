import React, { useEffect, useState } from "react";
import PrismaticBurst from "../components/ui/PrismaticBurst";
import ProfileList from "../components/ProfileList";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("profile fetch failed");
        const json = await res.json();
        setUserName(json?.user?.name || null);
      } catch {
        setUserName(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return (
    <div className="min-h-screen bg-[#05010F] relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <PrismaticBurst
          intensity={0.5}
          speed={0.8}
          animationType="rotate3d"
          colors={["#ff5ec8", "#7a5cff", "#00f6ff", "#00ffaa"]}
          mixBlendMode="screen"
        />
      </div>


      <main className="container mx-auto px-4 py-32 relative z-10">
        {/* Animated Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            {loading ? "Hello 👋" : userName ? `Hello ${userName} 👋` : "Hello 👋"}
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Welcome to your creative universe — here are your ideas, glowing with innovation and ambition.
          </p>

          {/* Glowing Divider */}
          <div className="mt-8 w-40 mx-auto h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_20px_#7a5cff]" />
        </motion.div>

        {/* Floating Card Wrapper */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="relative">
            {/* Floating glow aura */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-500/20 blur-3xl rounded-3xl animate-pulse" />
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_25px_rgba(255,255,255,0.1)] p-8 transition-all duration-500 hover:shadow-[0_0_45px_rgba(123,58,255,0.6)]">
              <ProfileList />
            </div>
          </div>
        </motion.div>
      </main>

      {/* Floating Orbs for ambient motion */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" style={{ animation: 'pulse-slow 6s ease-in-out infinite' }}></div>

      <style>{`
        @keyframes pulse-slow {
          0% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
