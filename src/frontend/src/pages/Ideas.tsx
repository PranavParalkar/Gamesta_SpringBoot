import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import PrismaticBurst from "../components/ui/PrismaticBurst";
import toast from "react-hot-toast";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "../components/ui/Card";
import { FaFire } from "react-icons/fa";
import { BiUpArrowAlt } from "react-icons/bi";
import { useSocket } from "../hooks/useSocket";
import CommentsSidebar from "../components/CommentsSidebar";
import { Socket } from "socket.io-client";
import { FaComment } from "react-icons/fa";
import ReactionDock from "../components/ReactionDock";

// -----------------------------
// Fetcher (same as original)
// -----------------------------
const fetcher = (url) => {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("gamesta_token")
      : null;
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).then((r) => r.json());
};

// Timeline removed from ideas page — moved to /events page.

// -----------------------------
// Main page (original content + timeline)
// -----------------------------
export default function IdeasPageWithTimeline() {
  const { data: ideasData, mutate } = useSWR("/api/ideas", fetcher);
  const [animating, setAnimating] = useState({});
  const [sort, setSort] = useState("popular");
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [commentsSidebarOpen, setCommentsSidebarOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState<string | null>(null);
  const [hoveredIdeaId, setHoveredIdeaId] = useState<number | null>(null);
  
  // Separate states for votes and reactions
  const [userReactions, setUserReactions] = useState<Record<number, string>>({});
  const [votedIds, setVotedIds] = useState(new Set());
  
  // Reaction counts cache
  const [reactionCounts, setReactionCounts] = useState<Record<number, Record<string, number>>>({});

  // refs for scrolling to idea cards
  const ideaRefs = useRef({});

  // Socket.io connection
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("gamesta_token")
      : null;
  const socket = useSocket(token);

  async function toggleVote(id) {
    const token = typeof window !== "undefined"
      ? sessionStorage.getItem("gamesta_token")
      : null;

    if (!token) {
      toast.error("Please sign in to vote");
      return;
    }

    const alreadyVoted = votedIds.has(id);

    setVotedIds((prev) => {
      const next = new Set(prev);
      alreadyVoted ? next.delete(id) : next.add(id);
      return next;
    });

    setAnimating((s) => ({ ...s, [id]: true }));

    try {
      const res = await fetch(`/api/ideas/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ ideaId: id, vote: 1 }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Vote failed");
      toast.success(alreadyVoted ? "Vote removed ❌" : "Voted ✅");

      if (json?.stats) {
        mutate(
          (current) => {
            if (!current?.data) return current;
            return {
              ...current,
              data: current.data.map((idea) =>
                idea.id === id
                  ? { ...idea, score: json.stats.score }
                  : idea
              ),
            };
          },
          { revalidate: false }
        );
      }
    } catch (e) {
      toast.error("Could not update vote.");
      setVotedIds((prev) => {
        const next = new Set(prev);
        alreadyVoted ? next.add(id) : next.delete(id);
        return next;
      });
    } finally {
      setAnimating((s) => ({ ...s, [id]: false }));
    }
  }

  async function handleReaction(id: number, type: string) {
    const token = typeof window !== "undefined"
      ? sessionStorage.getItem("gamesta_token")
      : null;

    if (!token) {
      toast.error("Please sign in to react");
      return;
    }

    const currentReaction = userReactions[id];
    const isRemoving = currentReaction === type;

    // Optimistic update
    setUserReactions((prev) => {
      const next = { ...prev };
      if (isRemoving) delete next[id];
      else next[id] = type;
      return next;
    });
    
    // Optimistic count update
    setReactionCounts((prev) => {
        const ideaCounts = { ...(prev[id] || {}) };
        if (isRemoving) {
            ideaCounts[type] = Math.max(0, (ideaCounts[type] || 1) - 1);
        } else {
            if (currentReaction) {
                ideaCounts[currentReaction] = Math.max(0, (ideaCounts[currentReaction] || 1) - 1);
            }
            ideaCounts[type] = (ideaCounts[type] || 0) + 1;
        }
        return { ...prev, [id]: ideaCounts };
    });

    setAnimating((s) => ({ ...s, [id]: true }));

    try {
      const res = await fetch(`/api/ideas/${id}/react`, {
        method: "POST",
        body: JSON.stringify({ reaction: type }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Reaction failed");
      
      if (json.removed) {
          toast.success("Reaction removed");
      } else {
          toast.success(`Reacted with ${type} `);
      }
      
      // Update counts from server
      if (json.reaction_counts) {
          setReactionCounts(prev => ({ ...prev, [id]: json.reaction_counts }));
      }

    } catch (e) {
      toast.error("Could not update reaction");
      // Rollback
      setUserReactions((prev) => {
        const next = { ...prev };
        if (currentReaction) next[id] = currentReaction;
        else delete next[id];
        return next;
      });
      // Rollback counts (simplified, just refetch or ignore for now)
    } finally {
      setAnimating((s) => ({ ...s, [id]: false }));
      setHoveredIdeaId(null);
    }
  }

  // initialize votedIds and reactions from server data
  useEffect(() => {
    if (!ideasData?.data) return;
    const s = new Set();
    const reactions: Record<number, string> = {};
    const counts: Record<number, Record<string, number>> = {};
    
    ideasData.data.forEach((it: any) => {
      if (it.voted_by_you || it.userVoted || it.voted) {
        s.add(it.id);
      }
      if (it.user_reaction) {
          reactions[it.id] = it.user_reaction;
      }
      if (it.reaction_counts) {
          counts[it.id] = it.reaction_counts;
      }
    });
    setVotedIds(s);
    setUserReactions(reactions);
    setReactionCounts(counts);
  }, [ideasData]);

  // Listen for real-time vote updates via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = (data: { idea_id: number; score: number; upvote_count: number }) => {
      mutate(
        (current) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((idea) =>
              idea.id === data.idea_id
                ? { ...idea, score: data.score, upvoteCount: data.upvote_count }
                : idea
            ),
          };
        },
        { revalidate: false }
      );
    };

    socket.on("vote_update", handleVoteUpdate);

    const handleIdeaCreated = (idea: any) => {
      mutate(
        (current) => {
          if (!current?.data) return current;
          // avoid duplicate
          if (current.data.some((i) => i.id === idea.id)) return current;
          return { ...current, data: [idea, ...current.data] };
        },
        { revalidate: false }
      );
    };
    socket.on("idea_created", handleIdeaCreated);

    return () => {
      socket.off("vote_update", handleVoteUpdate);
      socket.off("idea_created", handleIdeaCreated);
    };
  }, [socket, mutate]);

  const openCommentsSidebar = (ideaId: number, ideaTitle: string) => {
    setSelectedIdeaId(ideaId);
    setSelectedIdeaTitle(ideaTitle);
    setCommentsSidebarOpen(true);
  };

  

  const closeCommentsSidebar = () => {
    setCommentsSidebarOpen(false);
    // Small delay before clearing to allow exit animation
    setTimeout(() => {
      setSelectedIdeaId(null);
      setSelectedIdeaTitle(null);
    }, 300);
  };

  const sortedIdeas =
    ideasData?.data?.slice().sort((a, b) =>
      sort === "popular" ? b.score - a.score : b.id - a.id
    ) || [];

  // Smooth scroll to idea
  const scrollToIdea = (id) => {
    const element = ideaRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // tiny pulse animation
      try {
        element.animate(
          [
            { boxShadow: "0 0 0px rgba(124,58,237,0)" },
            { boxShadow: "0 8px 30px rgba(124,58,237,0.18)" },
            { boxShadow: "0 0 0px rgba(124,58,237,0)" },
          ],
          { duration: 700 }
        );
      } catch {
        /* ignore if animate not supported */
      }
    }
  };

  // When navigated from leaderboard with ?focus=<id> or #idea-<id>, scroll to that idea once data is loaded
  useEffect(() => {
    /** @type {number | null} */
    let targetId = null;
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const focusParam = sp.get("focus");
      const openCommentsParam = sp.get("openComments"); // Check this too
      
      if (focusParam && /^\d+$/.test(focusParam)) {
         targetId = Number(focusParam);
      } else if (openCommentsParam && /^\d+$/.test(openCommentsParam)) {
         targetId = Number(openCommentsParam);
      }
      if (!targetId) {
        const hash = window.location.hash || "";
        const m = hash.match(/#idea-(\d+)/);
        if (m) {
          const num = Number(m[1]);
          if (!isNaN(num)) {
            // @ts-ignore - targetId can be number or null
            targetId = num;
          }
        }
      }
    }
      if (targetId && ideasData?.data?.length) {
      // delay slightly to ensure refs are set after render
      const numId = Number(targetId);
      if (!isNaN(numId)) {
        const t = setTimeout(() => {
             scrollToIdea(numId);
             
             // Check if we should also open comments
             const sp = new URLSearchParams(window.location.search);
             const openCommentsId = sp.get("openComments");
             if (openCommentsId && Number(openCommentsId) === numId) {
                 const idea = ideasData.data.find(i => i.id === numId);
                 if (idea) {
                     openCommentsSidebar(numId, idea.title);
                 }
             }
        }, 60);
        return () => clearTimeout(t);
      }
    }
  }, [ideasData]);

  return (
    <div className="min-h-screen relative">
      {/* 🌈 Fixed Prismatic Burst Background */}
   <div className="absolute inset-0 mix-blend-screen opacity-70 z-0">
        <PrismaticBurst
          intensity={0.6}
          speed={0.6}
          animationType="rotate3d"
          colors={["#ff5ec8", "#8f5bff", "#00f6ff"]}
        />
      </div>

      {/* Main Layout Container */}
      <div className="relative z-10  flex min-h-[calc(100vh-80px)] w-full">
          {/* 🧭 Left Ranking Sidebar */}
        {sortedIdeas.length > 0 && (
          <aside
            role="navigation"
            aria-label="Idea rankings"
            className="hidden fixed md:flex flex-col items-center pt-5  h-[calc(120vh-6rem)]  pl-4 w-24"
          >
            {/* vertical accent line */}
            <div className="absolute top-0 left-12 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-transparent h-full rounded-full" />

            {/* scrollable list */}
            <div
              className="relative z-10 w-full max-h-[calc(120vh-12rem)] overflow-y-auto py-4 pr-2 flex flex-col items-center gap-4 no-scrollbar"
              // optional nice scrollbar if Tailwind scrollbar plugin is available
            >
              {sortedIdeas.map((idea, index) => (
                <motion.button
                  key={idea.id}
                  whileHover={{ scale: 1.12 }}
                  onClick={() => scrollToIdea(idea.id)}
                  className="relative flex-none w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-full flex items-center justify-center shadow-lg hover:shadow-pink-400/30 transition focus:outline-none focus:ring-4 focus:ring-pink-300/30"
                  aria-label={`Scroll to idea ${index + 1}`}
                >
                  #{index + 1}
                </motion.button>
              ))}
            </div>
          </aside>
        )}


        {/* 🌟 Main Content */}
        <main className={`flex-1 px-2 md:px-6 md:pl-28 py-12 ${showTimeline ? "lg:ml-[20rem]" : ""}`}>
          <div className="max-w-8xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                  Community Ideas
                </h1>
              </div>

              <div />
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Ideas Grid - Spans all columns when timeline is hidden */}
              <div className="md:col-span-2 lg:col-span-3">
                {!ideasData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-60 bg-white/10 rounded-2xl border border-white/10"
                      />
                    ))}
                  </div>
                ) : sortedIdeas.length === 0 ? (
                  <div className="text-center py-16 text-gray-300">
                    <h3 className="text-2xl font-semibold mb-2">No ideas yet 😕</h3>
                    <p>Be the first to share something amazing!</p>
                    <Button className="mt-4">Submit Idea</Button>
                  </div>
                ) : (
                  <div className="columns-1 sm:columns-2 lg:columns-3 [column-gap:1.5rem]">
                    {sortedIdeas.map((idea, index) => (
                      <motion.div
                        key={idea.id}
                        ref={(el) => { ideaRefs.current[idea.id] = el; }}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.02 }}
                        className="break-inside-avoid-column inline-block w-full mb-6"
                      >
                        <Card id={`idea-${idea.id}`} className="relative bg-white/10 border border-white/10 rounded-2xl backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-transform hover:scale-[1.02]">
                          <CardHeader>
                            <CardTitle className="text-xl text-white mb-2">
                              {idea.title}
                            </CardTitle>
                            <p className="text-sm text-purple-300 font-medium">
                              Score: {idea.score}
                            </p>
                          </CardHeader>

                          <CardContent>
                            <div
                              className="text-base text-gray-300 mb-4 break-words overflow-hidden"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {idea.description}
                            </div>

                            {/* Reaction Counts */}
                            {reactionCounts[idea.id] && Object.keys(reactionCounts[idea.id]).length > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    {Object.entries(reactionCounts[idea.id]).map(([type, count]) => (
                                        <div key={type} className="flex items-center bg-white/5 rounded-full px-2 py-1 text-xs text-gray-300 border border-white/5">
                                            <span className="mr-1">{
                                                {
                                                    "LIKE": "👍", "LOVE": "❤️", "HAHA": "😂", 
                                                    "WOW": "😮", "SAD": "😢", "ANGRY": "😡"
                                                }[type]
                                            }</span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-3">
                              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                    {/* Upvote Button */}
                                    <motion.button
                                      onClick={() => toggleVote(idea.id)}
                                      disabled={animating[idea.id]}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all
                                        ${votedIds.has(idea.id)
                                          ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                          : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                                        }`}
                                    >
                                      <BiUpArrowAlt className="text-lg" />
                                      <span>{votedIds.has(idea.id) ? "Upvoted" : "Upvote"}</span>
                                    </motion.button>

                                  {/* Reaction Button (Click to Open Menu) */}
<div className="relative select-none">
  
  {/* CLICK opens/closes menu */}
  <div onClick={() => 
      setHoveredIdeaId(prev => prev === idea.id ? null : idea.id)
  }>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all relative
        ${
          userReactions[idea.id]
            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
            : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
        }`}
    >
      {/* Fire pulse only when no reaction */}
      {!userReactions[idea.id] ? (
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 1.7 }}
        >
          <FaFire className="text-orange-400 text-lg" />
        </motion.div>
      ) : (
        <span className="text-xl">
          {{
            LIKE: "👍",
            LOVE: "❤️",
            HAHA: "😂",
            WOW: "😮",
            SAD: "😢",
            ANGRY: "😡",
          }[userReactions[idea.id]]}
        </span>
      )}
    </motion.button>
  </div>

  {/* Reaction Menu */}
  {hoveredIdeaId === idea.id && (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="absolute -top-20 left-1/2 -translate-x-1/2 
                 bg-white/10 backdrop-blur-xl border border-white/20
                 rounded-full px-4 py-3 flex items-center gap-4 
                 shadow-xl shadow-purple-500/20 z-20"
    >
      {[
        { t: "LIKE", e: "👍" },
        { t: "LOVE", e: "❤️" },
        { t: "HAHA", e: "😂" },
        { t: "WOW", e: "😮" },
        { t: "SAD", e: "😢" },
        { t: "ANGRY", e: "😡" },
      ].map((r) => (
        <motion.button
          key={r.t}
          whileHover={{ scale: 1.35 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            handleReaction(idea.id, r.t);
            setHoveredIdeaId(null); // close menu after selecting
          }}
          className={`text-2xl transition-all ${
            userReactions[idea.id] === r.t
              ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              : ""
          }`}
        >
          {r.e}
        </motion.button>
      ))}
    </motion.div>
  )}
</div>

                                </div>

                                <div className="flex items-center gap-3">
                                  <motion.button
                                    onClick={() => openCommentsSidebar(idea.id, idea.title)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-400/50 transition-all"
                                  >
                                    <FaComment className="text-xs" />
                                    <span>Comments</span>
                                  </motion.button>
                                  <span className="text-xs text-gray-400">#{index + 1}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline moved to /events page */}
            </div>
          </div>
        </main>
      </div>

      {/* Comments Sidebar */}
      <CommentsSidebar
        isOpen={commentsSidebarOpen}
        onClose={closeCommentsSidebar}
        ideaId={selectedIdeaId}
        ideaTitle={selectedIdeaTitle}
        socket={socket}
        token={token}
      />
    </div>
  );
}