import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import toast from "react-hot-toast";
import { Socket } from "socket.io-client";
import { FaComment, FaUser, FaTimes, FaPaperPlane, FaCheckCircle, FaStar } from "react-icons/fa";

interface Comment {
  id: number;
  content: string;
  author_name: string;
  idea_id: number;
  created_at: string;
}

interface CommentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: number | null;
  ideaTitle: string | null;
  socket: Socket | null;
  token: string | null;
}

export default function CommentsSidebar({
  isOpen,
  onClose,
  ideaId,
  ideaTitle,
  socket,
  token,
}: CommentsSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fetch current user name
  useEffect(() => {
    if (token) {
      fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          setCurrentUserName(json?.user?.name || null);
        })
        .catch(() => setCurrentUserName(null));
    }
  }, [token]);

  // Fetch comments when sidebar opens and ideaId changes
  useEffect(() => {
    if (isOpen && ideaId) {
      fetchComments();
    } else {
      setComments([]);
      setNewComment("");
    }
  }, [isOpen, ideaId]);

  // Join idea room when socket is ready
  useEffect(() => {
    if (socket && ideaId && isOpen) {
      socket.emit("join_idea", ideaId);

      // Listen for new comments
      const handleNewComment = (data: Comment) => {
        if (data.idea_id === ideaId) {
          setComments((prev) => [...prev, data]);
          setTimeout(() => scrollToBottom(), 100);
        }
      };

      socket.on("new_comment", handleNewComment);

      return () => {
        socket.emit("leave_idea", ideaId);
        socket.off("new_comment", handleNewComment);
      };
    }
  }, [socket, ideaId, isOpen]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [comments, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const fetchComments = async () => {
    if (!ideaId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/ideas/${ideaId}/comments`);

      if (!response.ok) {
        if (response.status === 404) {
          setComments([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      setComments(json.data || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token || !ideaId) {
      toast.error("Please sign in to comment");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        toast.error(json.error || `Failed to post comment (${response.status})`);
        return;
      }

      const json = await response.json();
      setNewComment("");
      
      // Trigger celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Please check if the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if comment belongs to current user
  const isMyComment = (comment: Comment) => {
    return currentUserName && comment.author_name === currentUserName;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          >
            {/* Background overlay */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.9 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-black backdrop-blur-md"
            />
            
            {/* Celebration content */}
            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                }}
                className="mb-6"
              >
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <FaCheckCircle className="text-white text-6xl" />
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold text-white mb-4"
              >
                Comment Posted! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl text-purple-100"
              >
                Thanks for sharing your thoughts!
              </motion.p>
              
              {/* Floating sparkles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * Math.PI * 2) / 12) * 200,
                    y: Math.sin((i * Math.PI * 2) / 12) * 200,
                    opacity: [1, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.4 + i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <FaStar className="text-yellow-300 text-xl" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onClose}
            />
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            // place sidebar below top-20 (5rem) and limit its height so inner scrolling works
            className="fixed right-0 w-full sm:w-96 lg:w-[28rem] z-50 flex"
            style={{ top: "5rem", height: "calc(100vh - 5rem)" }}
          >
            {/* Sidebar Content: make header and input fixed (flex-none) and messages scroll (flex-1 overflow-auto) */}
            <div className="flex flex-col w-full h-full mb-20 rounded-l-2xl bg-black backdrop-blur-xl border border-white/20 shadow-2xl">
              {/* Header (non-scrolling) */}
              <div className="px-6 py-3 border-b border-white/10 flex-none">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <FaComment className="text-white text-sm" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white"> {ideaTitle}</h2>
                      <p className="text-xs text-purple-200">
                        {comments.length} {comments.length === 1 ? "comment" : "comments"}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <FaTimes className="text-white text-sm" />
                  </motion.button>
                </div>
              </div>

              {/* Messages list - ONLY this section scrolls */}
              <div className="px-4 py-4 space-y-3 no-scrollbar overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-gray-400">Loading comments...</p>
                    </div>
                  </div>
                ) : comments.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                      <FaComment className="text-purple-300 text-2xl" />
                    </div>
                    <p className="text-gray-300 text-lg font-medium mb-2">
                      No comments yet
                    </p>
                    <p className="text-gray-400 text-sm">
                      Be the first to share your thoughts!
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {comments.map((comment, index) => {
                      const isMine = isMyComment(comment);
                      return (
                        <motion.div
                          key={comment.id}
                          initial={{ 
                            opacity: 0, 
                            x: isMine ? -20 : 20, 
                            scale: 0.95 
                          }}
                          animate={{ 
                            opacity: 1, 
                            x: 0, 
                            scale: 1 
                          }}
                          exit={{ 
                            opacity: 0, 
                            x: isMine ? 20 : -20, 
                            scale: 0.95 
                          }}
                          transition={{
                            delay: index * 0.03,
                            type: "spring",
                            damping: 20,
                          }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[80%] ${isMine ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50" : "bg-white/5 border-white/10"} border rounded-2xl p-3 backdrop-blur-sm hover:shadow-lg transition-all group`}
                          >
                            <div className={`flex items-start gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
                              <motion.div
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isMine ? "bg-gradient-to-br from-purple-400 to-pink-400" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}
                              >
                                <FaUser className="text-white text-xs" />
                              </motion.div>
                              <div className={`flex-1 min-w-0 ${isMine ? "text-right" : "text-left"}`}>
                                <div className={`flex items-center gap-2 mb-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                  <span className={`text-xs font-semibold ${isMine ? "text-purple-200" : "text-white"}`}>
                                    {isMine ? "You" : (comment.author_name || "Anonymous")}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <p className={`text-sm break-words leading-relaxed ${isMine ? "text-purple-100" : "text-gray-200"}`}>
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment Input (non-scrolling) */}
              <div className="flex-none p-4 border-t border-white/10 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
                {token ? (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full h-16 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all backdrop-blur-sm"
                        maxLength={2000}
                        rows={4}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {newComment.length}/2000
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      whileHover={{ scale: submitting ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/30"
                    >
                      {submitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <FaPaperPlane />
                          <span>Post Comment</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3">
                      <FaUser className="text-purple-300 text-xl" />
                    </div>
                    <p className="text-gray-300 font-medium mb-1">Sign in to comment</p>
                    <p className="text-gray-400 text-sm">
                      Join the conversation!
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

