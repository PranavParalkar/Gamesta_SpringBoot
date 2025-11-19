
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";

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

export default function ProfileList() {
  const [ideas, setIdeas] = useState<IdeaItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("gamesta_token")
            : null;

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
        setError(e?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-12 text-center text-white/70 animate-pulse"
      >
        Loading your ideas…
      </motion.div>
    );

  if (error)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-12 text-center text-red-400 font-semibold"
      >
        Error: {error}
      </motion.div>
    );

  if (!ideas || ideas.length === 0)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-12 text-center text-white/70"
      >
        You haven't submitted any ideas yet.
      </motion.div>
    );

  return (
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
        {ideas.map((idea, idx) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.01 }}
          >
            <Card className=" bg-gradient-to-br from-[#0b0a0d]/70 to-[#0f0c13]/60 border border-white/8 rounded-xl backdrop-blur-sm hover:border-pink-500/40 transition-all shadow-lg overflow-hidden relative group">
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500/0 via-pink-500/40 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3">
                  {/* Left: Title & Description */}
                  <div className="flex-1 min-w-0">
                    {editingId === idea.id ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                      >
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
                        <CardTitle className="text-lg font-semibold text-white truncate">
                          {idea.title}
                        </CardTitle>
                       <CardDescription
  className="text-white/60 text-sm mt-1 line-clamp-2 w-64 whitespace-normal overflow-hidden"
>
  {idea.description}
</CardDescription>

                      </>
                    )}
                  </div>

                  {/* Right: Score Badge */}
                  <motion.div
                   
                    className="text-right bg-gradient-to-br from-pink-600/10 to-purple-600/10 px-3 py-2 rounded-lg border border-pink-500/20 flex-shrink-0"
                  >
                    <div className="text-xs text-gray-300">Upvotes</div>
                    <div className="text-2xl font-extrabold text-pink-400">
                      {idea.upvote_count}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Rank #{idea.rank ?? "-"}
                    </div>
                  </motion.div>
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="flex gap-2 flex-wrap">
                  {editingId === idea.id ? (
                    <>
                      <motion.button
                       
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          if (saving) return;

                          const title = editTitle.trim();
                          const description = editDescription.trim();

                          if (title.length < 5) return alert("Title too short");
                          if (description.length < 10)
                            return alert("Description too short");
                          if (description.length > 500)
                            return alert("Description too long");

                          try {
                            setSaving(true);

                            const token =
                              typeof window !== "undefined"
                                ? sessionStorage.getItem("gamesta_token")
                                : null;

                            const res = await fetch(`/api/ideas/${idea.id}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                ...(token
                                  ? { Authorization: `Bearer ${token}` }
                                  : {}),
                              },
                              body: JSON.stringify({ title, description }),
                            });

                            const json = await res.json().catch(() => ({}));
                            if (!res.ok)
                              throw new Error(json.error || "Failed to update");

                            setIdeas((prev) =>
                              prev
                                ? prev.map((i) =>
                                    i.id === idea.id
                                      ? { ...i, title, description }
                                      : i
                                  )
                                : prev
                            );

                            setEditingId(null);
                          } catch (e: any) {
                            alert(e?.message || "Update failed");
                          } finally {
                            setSaving(false);
                          }
                        }}
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
                        onClick={async () => {
                          if (revokingId) return;

                          const ok = confirm(
                            "Revoke this idea? This action cannot be undone."
                          );
                          if (!ok) return;

                          try {
                            setRevokingId(idea.id);

                            const token =
                              typeof window !== "undefined"
                                ? sessionStorage.getItem("gamesta_token")
                                : null;

                            const res = await fetch(`/api/ideas/${idea.id}`, {
                              method: "DELETE",
                              headers: token
                                ? { Authorization: `Bearer ${token}` }
                                : {},
                            });

                            const json = await res.json().catch(() => ({}));
                            if (!res.ok)
                              throw new Error(json.error || "Failed to revoke");

                            setIdeas((prev) =>
                              prev ? prev.filter((i) => i.id !== idea.id) : prev
                            );
                          } catch (e: any) {
                            alert(e?.message || "Failed to revoke");
                          } finally {
                            setRevokingId(null);
                          }
                        }}
                        className="px-3 py-1 rounded-md text-sm border border-red-600/30 text-red-300 hover:bg-red-600/10 transition-all"
                      >
                        {revokingId === idea.id ? "Revoking…" : "Revoke"}
                      </motion.button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
