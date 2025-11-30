import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import toast from "react-hot-toast";
import { Socket } from "socket.io-client";
import { FaComment, FaUser } from "react-icons/fa";

interface Comment {
  id: number;
  content: string;
  author_name: string;
  idea_id: number;
  created_at: string;
}

interface CommentSectionProps {
  ideaId: number;
  socket: Socket | null;
  token: string | null;
}

export default function CommentSection({ ideaId, socket, token }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [ideaId]);

  // Join idea room when socket is ready
  useEffect(() => {
    if (socket && ideaId) {
      socket.emit("join_idea", ideaId);

      // Listen for new comments
      socket.on("new_comment", (data: Comment) => {
        if (data.idea_id === ideaId) {
          setComments((prev) => [...prev, data]);
          scrollToBottom();
        }
      });

      return () => {
        socket.emit("leave_idea", ideaId);
        socket.off("new_comment");
      };
    }
  }, [socket, ideaId]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      // Use full URL in development if proxy isn't working, or relative path if proxy works
      const apiUrl = `/api/ideas/${ideaId}/comments`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Idea ${ideaId} not found or comments endpoint not available`);
          // Set empty comments instead of error
          setComments([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      setComments(json.data || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      // Don't show error toast for fetch failures, just log it
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
    if (!newComment.trim() || !token) {
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
      toast.success("Comment posted!");
      // Comment will be added via Socket.io event
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Please check if the backend is running.");
    } finally {
      setSubmitting(false);
    }
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
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-2 text-purple-300 font-semibold">
        <FaComment className="text-sm" />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Comments List */}
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2 no-scrollbar">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 border border-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-white text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {comment.author_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 break-words">{comment.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Input */}
      {token ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full min-h-[80px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
            maxLength={2000}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {newComment.length}/2000
            </span>
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-gray-400 text-sm">
          <p>Please sign in to comment</p>
        </div>
      )}
    </div>
  );
}

