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

  // refs for scrolling to idea cards
  const ideaRefs = useRef({});

  // track which idea ids the current user has voted for (client-side set)
  const [votedIds, setVotedIds] = useState(new Set());

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

  // ✅ determine future state BEFORE async
  const alreadyVoted = votedIds.has(id);

  // ✅ immediately update UI — no flicker
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

    // 🔄 Update score locally without full list refetch
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
    // ❗ rollback optimistic update on failure
    setVotedIds((prev) => {
      const next = new Set(prev);
      alreadyVoted ? next.add(id) : next.delete(id);
      return next;
    });
  } finally {
    setAnimating((s) => ({ ...s, [id]: false }));
  }
}



  // initialize votedIds if server provides user-vote flags on ideas
  useEffect(() => {
    if (!ideasData?.data) return;
    const s = new Set();
    ideasData.data.forEach((it) => {
      // Support multiple possible API flags; primary is voted_by_you (0/1)
      if (it.voted_by_you || it.userVoted || it.voted_by_user || it.myVote || it.voted) {
        s.add(it.id);
      }
    });
    setVotedIds(s);
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
      if (focusParam && /^\d+$/.test(focusParam)) {
        const num = Number(focusParam);
        if (!isNaN(num)) {
          // @ts-ignore - targetId can be number or null
          targetId = num;
        }
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
        const t = setTimeout(() => scrollToIdea(numId), 60);
        return () => clearTimeout(t);
      }
    }
  }, [ideasData]);

  return (
    <div className="min-h-screen relative">
      {/* 🌈 Fixed Prismatic Burst Background */}
      <div
        className="fixed inset-0 pointer-events-none mix-blend-screen opacity-70 z-0"
        style={{ overflow: "hidden" }}
      >
        <PrismaticBurst
          intensity={0.6}
          speed={0.6}
          animationType="rotate3d"
          colors={["#ff5ec8", "#8f5bff", "#00f6ff"]}
        />
      </div>

      {/* Main Layout Container */}
      <div className="absolute z-10 mt-12 flex min-h-[calc(100vh-80px)] w-full">
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

                            <div className="space-y-3">
                              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <motion.button
                                  onClick={() => toggleVote(idea.id)}
                                  disabled={animating[idea.id] || votedIds.has(idea.id)}
                                  className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-all
                                    ${votedIds.has(idea.id)
                                      ? "bg-green-500 cursor-not-allowed"
                                      : "bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105"
                                    }`}
                                >
                                  {votedIds.has(idea.id) ? "Voted" : "Upvote"}
                                </motion.button>

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