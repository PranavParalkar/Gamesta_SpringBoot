import React, { useEffect, useState } from "react";
import PrismaticBurst from "../components/ui/PrismaticBurst";
import EventsList from "../components/EventsList";
import { motion, AnimatePresence } from "framer-motion";

interface IdeaItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
  score: number;
  upvote_count: number;
  vote_count: number;
  rank?: number;
}

export default function ProfilePage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<IdeaItem[] | null>(null);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

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

  // Load user's ideas
  useEffect(() => {
    async function loadIdeas() {
      setIdeasLoading(true);
      setIdeasError(null);
      try {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;
        const res = await fetch("/api/profile/ideas", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to load ideas");
        }

        const json = await res.json();
        setIdeas(json.data || []);
      } catch (e: any) {
        setIdeasError(e?.message || "Unknown error");
      } finally {
        setIdeasLoading(false);
      }
    }
    loadIdeas();
  }, []);

  const handleSaveIdea = async (idea: IdeaItem) => {
    if (saving) return;

    const title = editTitle.trim();
    const description = editDescription.trim();

    if (title.length < 5) return alert("Title too short");
    if (description.length < 10) return alert("Description too short");
    if (description.length > 500) return alert("Description too long");

    try {
      setSaving(true);

      const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;

      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update");

      setIdeas((prev) =>
        prev ? prev.map((i) => (i.id === idea.id ? { ...i, title, description } : i)) : prev
      );

      setEditingId(null);
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeIdea = async (idea: IdeaItem) => {
    if (revokingId) return;

    const ok = confirm("Revoke this idea? This action cannot be undone.");
    if (!ok) return;

    try {
      setRevokingId(idea.id);

      const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;

      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to revoke");

      setIdeas((prev) => (prev ? prev.filter((i) => i.id !== idea.id) : prev));
    } catch (e: any) {
      alert(e?.message || "Failed to revoke");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05010F] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <PrismaticBurst
          intensity={0.5}
          speed={0.8}
          animationType="rotate3d"
          colors={["#ff5ec8", "#7a5cff", "#00f6ff", "#00ffaa"]}
          mixBlendMode="screen"
        />
      </div>

      <main className="container mx-auto px-4 py-10 relative z-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            {loading ? "Hello 👋" : userName ? `Hello ${userName} 👋` : "Hello 👋"}
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Welcome to your creative universe — where your ideas glow with innovation.
          </p>

          <div className="mt-4 w-40 mx-auto h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_20px_#7a5cff]" />
        </motion.div>

        {/* Improved Sections */}
        <motion.div
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* My Ideas Section */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-purple-400/40 transition-all shadow-[0_0_20px_#7a5cff33]">
              <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_10px_#ff5ec8]"></span>
                My Ideas
              </h2>

              <div className="">
                {ideasLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-white/70 animate-pulse">
                    Loading your ideas…
                  </motion.div>
                ) : ideasError ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-red-400 font-semibold">
                    Error: {ideasError}
                  </motion.div>
                ) : !ideas || ideas.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-white/70">
                    You haven't submitted any ideas yet.
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.08 },
                      },
                    }}
                  >
                    <AnimatePresence>
                      {ideas.map((idea) => (
                        <motion.div
                          key={idea.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="bg-gradient-to-br from-[#0b0a0d]/70 to-[#0f0c13]/60 border border-white/8 rounded-xl backdrop-blur-sm hover:border-pink-500/40 transition-all shadow-lg overflow-hidden relative group p-4">
                            {/* Decorative top accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500/0 via-pink-500/40 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start gap-3">
                              {/* Left: Title & Description */}
                              <div className="flex-1 min-w-0">
                                {editingId === idea.id ? (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                                    <input
                                      value={editTitle}
                                      onChange={(e) => setEditTitle(e.target.value)}
                                      className="w-full px-3 py-2 rounded-md bg-[#07060a]/60 border border-purple-600/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-500/60"
                                      placeholder="Title"
                                      maxLength={120}
                                    />
                                    <textarea
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      className="w-full px-3 py-2 rounded-md bg-[#07060a]/60 border border-purple-600/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-500/60 text-sm resize-none"
                                      placeholder="Description"
                                      rows={3}
                                      maxLength={500}
                                    />
                                  </motion.div>
                                ) : (
                                  <>
                                    <div className="text-lg font-semibold text-white truncate">{idea.title}</div>
                                    <div
                                      className="text-white/60 text-sm mt-1 line-clamp-2 w-64 whitespace-normal overflow-hidden"
                                    >
                                      {idea.description}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Right: Score Badge */}
                              <motion.div className="text-right bg-gradient-to-br from-pink-600/10 to-purple-600/10 px-3 py-2 rounded-lg border border-pink-500/20 flex-shrink-0">
                                <div className="text-xs text-gray-300">Upvotes</div>
                                <div className="text-2xl font-extrabold text-pink-400">{idea.upvote_count}</div>
                                <div className="text-xs text-gray-400 mt-1">Rank #{idea.rank ?? "-"}</div>
                              </motion.div>
                            </div>

                            <div className="pt-3 flex gap-2 flex-wrap">
                              {editingId === idea.id ? (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSaveIdea(idea)}
                                    className="px-3 py-1 rounded-md text-sm bg-pink-500/90 text-black font-semibold hover:bg-pink-600"
                                  >
                                    {saving ? "Saving…" : "Save"}
                                  </motion.button>

                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1 rounded-md text-sm border border-purple-600/30 text-gray-200 hover:bg-purple-600/10"
                                  >
                                    Cancel
                                  </motion.button>
                                </>
                              ) : (
                                <>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setEditingId(idea.id);
                                      setEditTitle(idea.title);
                                      setEditDescription(idea.description);
                                    }}
                                    className="px-3 py-1 rounded-md text-sm border border-purple-600/30 text-gray-200 hover:bg-purple-600/10 transition-all"
                                  >
                                    Edit
                                  </motion.button>

                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRevokeIdea(idea)}
                                    className="px-3 py-1 rounded-md text-sm border border-red-600/30 text-red-300 hover:bg-red-600/10 transition-all"
                                  >
                                    {revokingId === idea.id ? "Revoking…" : "Revoke"}
                                  </motion.button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Events Registered Section */}
            <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-6 border border-white/10 hover:border-cyan-400/40 transition-all shadow-[0_0_20px_#00f6ff33]">
              <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f6ff]"></span>
                My Registered Events
              </h2>

              <React.Suspense fallback={<div className="text-center py-8 text-white/70">Loading events…</div>}>
                <div className="max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-400 scrollbar-track-transparent">
                  {/* @ts-ignore */}
                  <EventsList />
                </div>
              </React.Suspense>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Ambient Orbs */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" style={{ animation: 'pulse-slow 6s ease-in-out infinite' }}></div>

      <style>{`
        @keyframes pulse-slow {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thumb-purple-500::-webkit-scrollbar-thumb { background-color: #a855f7; border-radius: 3px; }
        .scrollbar-thumb-cyan-400::-webkit-scrollbar-thumb { background-color: #22d3ee; border-radius: 3px; }
      `}</style>
    </div>
  );
}
