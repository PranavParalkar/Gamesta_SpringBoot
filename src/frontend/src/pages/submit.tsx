import { useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PrismaticBurst from "../components/ui/PrismaticBurst";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Input";
import toast from "react-hot-toast";
import CountUp from "./CountUp";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [followedInstagram, setFollowedInstagram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { data: statsData } = useSWR("/api/stats", fetcher);
  const { mutate: globalMutate } = useSWRConfig();

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Title is required");
    if (!description.trim()) return setError("Description is required");
    if (title.length < 5)
      return setError("Title must be at least 5 characters");
    if (description.length < 20)
      return setError("Description must be at least 20 characters");
    if (!followedInstagram)
      return setError(
        "Please follow our Instagram account before submitting your idea"
      );

    const token =
      typeof window !== "undefined"
        ? sessionStorage.getItem("gamesta_token")
        : null;
    if (!token) {
      setError("Please sign in first");
      toast.error("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        body: JSON.stringify({ title, description, followedInstagram }),
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Idea submitted 🎉");
        const newIdea = body?.data || null;
        // Optimistically prepend new idea to ideas list
        if (newIdea) {
          globalMutate("/api/ideas", (current: any) => {
            if (!current?.data) return current;
            if (current.data.some((i: any) => i.id === newIdea.id)) return current;
            return { ...current, data: [newIdea, ...current.data] };
          }, { revalidate: false });
          // Optionally revalidate in background to confirm server state
          globalMutate("/api/ideas");
        } else {
          // Fallback: trigger revalidation
          globalMutate("/api/ideas");
        }
        navigate("/ideas");
      } else {
        setError(body.error || "Failed to submit");
        toast.error(body.error || "Failed to submit");
      }
    } catch (e) {
      setError(e?.message || "Failed to submit");
      toast.error(e?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-auto bg-[#050015] text-white">
      {/* 🌌 Background Layers */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
     

        {/* Prismatic Burst Animation */}
        <div
          className="relative w-full h-full"
          style={{ mixBlendMode: "screen", opacity: 0.9 }}
        >
          <PrismaticBurst
            className="w-full h-full"
            intensity={0.5}
            speed={0.8}
            animationType="rotate3d"
            colors={["#ff5ec8", "#7a5cff", "#00f6ff"]}
          />
        </div>
      </div>


      <motion.main
        className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 z-10 pt-20 pb-16"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* ===== MAIN CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl transition-transform duration-300 hover:scale-[1.01] hover:shadow-fuchsia-500/20">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl text-white flex items-center space-x-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span>Idea Details</span>
              </CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Be creative and specific — your idea could shape the next big
                event!
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                {/* Title */}
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Input
                    label="Idea Title"
                    placeholder="Enter a catchy title for your idea"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm sm:text-base"
                  />
                </motion.div>

                {/* Description */}
                <motion.div whileHover={{ scale: 1.02 }}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe your idea in detail. What makes it unique? How would it work?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      className="resize-none bg-black/20 text-white text-sm sm:text-base"
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-400">
                      {description.length}/500 characters
                    </div>
                  </div>
                </motion.div>

                {/* Instagram Checkbox */}
                <div className="flex items-start space-x-3 pt-4">
                  <input
                    id="follow_instagram"
                    type="checkbox"
                    checked={followedInstagram}
                    onChange={(e) => setFollowedInstagram(e.target.checked)}
                    className="accent-fuchsia-500 w-4 h-4 mt-1"
                  />
                  <label
                    htmlFor="follow_instagram"
                    className="text-xs sm:text-sm text-gray-200"
                  >
                    I confirm I follow{" "}
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://www.instagram.com/gamesta_mitaoe"
                      className="text-fuchsia-400 hover:underline"
                    >
                      gamesta_mitaoe
                    </a>{" "}
                    on Instagram
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ⚠️ {error}
                  </motion.div>
                )}

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 space-y-4 sm:space-y-0 sm:space-x-4">
                  <motion.div
                    className="text-xs sm:text-sm text-gray-400 flex items-center space-x-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <svg
                      className="w-4 h-4 text-fuchsia-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                    <span>Your idea will be reviewed by the community</span>
                  </motion.div>

                  <div className="flex space-x-3">
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="text-xs sm:text-sm px-3 sm:px-5"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Button
                        type="submit"
                        loading={loading}
                        className="text-xs sm:text-sm min-w-[120px] sm:min-w-[140px] bg-gradient-to-r from-fuchsia-700 via-purple-500 to-fuchsia-700 text-white font-semibold hover:opacity-90 transition-all"
                      >
                        {loading ? "Submitting..." : "Submit Idea 🚀"}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== Tips Card ===== */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Stats strip with CountUp effects */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wide text-white/60">Users</div>
              <div className="mt-2 text-3xl font-extrabold text-white">
                <CountUp to={Number(statsData?.data?.users || 0)} duration={1.2} separator="," className="count-up-text" />
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wide text-white/60">Ideas</div>
              <div className="mt-2 text-3xl font-extrabold text-white">
                <CountUp to={Number(statsData?.data?.ideas || 0)} duration={1.2} separator="," className="count-up-text" />
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wide text-white/60">Votes</div>
              <div className="mt-2 text-3xl font-extrabold text-white">
                <CountUp to={Number(statsData?.data?.upvotes ?? statsData?.data?.votes ?? 0)} duration={1.2} separator="," className="count-up-text" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
