import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { motion } from "framer-motion";
import { TrendingUp, MessageCircle, Instagram, ExternalLink, ThumbsUp, Users } from "lucide-react";
import ChatBot from "../components/ChatBot";
import Sparkline from "../components/ui/Sparkline";
import PrismaticBurst from "../components/ui/PrismaticBurst";
import { Card, CardContent } from "../components/ui/Card";
import toast from "react-hot-toast";

type Idea = {
    id: number;
    title: string;
    description: string;
    score: number;
    author_name: string;
};

type TrendingData = {
    discussed: Idea[];
    popular: Idea[];
    stats: {
        registrations: number;
        topEventName: string;
        topEventCount: number;
    };
};

export default function Trending() {
    const navigate = useNavigate();
    const [data, setData] = useState<TrendingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
               const token = sessionStorage.getItem("gamesta_token");
               const res = await fetch("/api/stats/trending", {
                   headers: token ? { Authorization: `Bearer ${token}` } : {}
               });
               if (!res.ok) throw new Error("Failed to load");
               const json = await res.json();
               setData(json);
            } catch(e) {
                console.error(e);
                // Fallback mock data if backend not ready or public access issue
                 /* 
                setData({
                    discussed: [],
                    popular: [],
                    stats: { registrations: 0 }
                }); 
                */
            } finally {
                setLoading(false);
            }
        };
        fetchTrending();
    }, []);

    // Mock trend for sparkline until we get real historical data
    const mockTrend = [12, 18, 15, 25, 30, 45, 40, 55, 60, 50, 65, 80, 75, 90]; 

    return (
        <div className="min-h-screen bg-[#050015] text-white pt-10 pb-12 relative overflow-hidden">
             
             {/* Background */}
             <div className="fixed inset-0 pointer-events-none z-0">
                <PrismaticBurst intensity={0.3} colors={['#7e22ce', '#db2777', '#3b82f6']} />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
             </div>

             <div className="max-w-7xl mx-auto px-6 relative z-10">
                
       
                {/* Grid Layout */}
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Left Col: Analytics & Socials */}
                    <div className="space-y-8">
                        

                        {/* Top Event Card */}
                         <Card className="bg-gradient-to-br mt-10 from-indigo-900/40 to-black border-white/10 backdrop-blur-xl group p-3">
                           <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-white/50 mb-1">Most Popular Event</div>
                                        <div className="text-2xl font-bold text-indigo-300 leading-tight">
                                            {loading ? "..." : data?.stats.topEventName || "No hits yet"}
                                        </div>
                                    </div>
                                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                                
                             
                                <div className="w-full bg-white/5 h-1.5 mt-4 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 w-[70%] animate-pulse" /> 
                                </div>
                           </CardContent>
                        </Card>

                        {/* Social Media Links */}
                        <Card className="bg-gradient-to-br from-purple-900/40 to-black border-white/10 backdrop-blur-xl group p-3">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Instagram size={20} className="text-pink-400" /> Connect with us
                                </h3>
                                <div className="space-y-3">
                                    <a href="https://instagram.com/gamesta_mitaoe" target="_blank" rel="noreferrer" 
                                       className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                                        <span className="font-medium text-sm">@gamesta_mitaoe</span>
                                        <ExternalLink size={14} className="text-white/30 group-hover:text-white transition-colors" />
                                    </a>
                                    <a href="https://instagram.com/gamesta.confession" target="_blank" rel="noreferrer" 
                                       className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                                        <span className="font-medium text-sm">@gamesta.confession</span>
                                        <ExternalLink size={14} className="text-white/30 group-hover:text-white transition-colors" />
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col: Trending Content */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Most Discussed Section */}
                        <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MessageCircle className="text-blue-400" size={20} /> Most Discussed Ideas
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {loading ? (
                                    [1,2].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)
                                ) : (
                                    data?.discussed.slice(0, 4).map((idea, idx) => (
                                        <motion.div 
                                            key={idea.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <Card 
                                                onClick={() => navigate(`/ideas?openComments=${idea.id}`)}
                                                className="h-full p-3 bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all cursor-pointer group"
                                            >
                                                <CardContent className="p-5 flex flex-col h-full">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="p-1.5 px-2 bg-blue-500/10 rounded text-[10px] font-bold text-blue-300 uppercase tracking-wide">
                                                            Hot Topic
                                                        </div>
                                                        <div className="text-xs text-white/40 font-mono">#{idea.id}</div>
                                                    </div>
                                                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">{idea.title}</h3>
                                                    <p className="text-white/50 text-sm line-clamp-2 mb-4 flex-1">{idea.description}</p>
                                                    
                                                    <div className="flex items-center justify-between text-xs text-white/40 pt-4 border-t border-white/5">
                                                        <span>by {idea.author_name || "Anonymous"}</span>
                                                        <div className="flex items-center gap-1 text-white/60">
                                                            <MessageCircle size={12} /> Discussed
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </section>

                         {/* Most Poplar Section */}
                         <section>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <ThumbsUp className="text-yellow-400" size={20} /> Fan Favorites
                            </h2>
                            <div className="space-y-3">
                                {loading ? (
                                     <div className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                                ) : (
                                    data?.popular.slice(0, 3).map((idea, idx) => (
                                        <div key={idea.id} className="group relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-yellow-500/30 transition-all flex items-center justify-between">
                                            <div className="flex items-center gap-4 z-10 relative">
                                                <div className="text-3xl font-bold text-white/10 group-hover:text-yellow-500/50 transition-colors">0{idx+1}</div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-yellow-200 transition-colors">{idea.title}</div>
                                                    <div className="text-xs text-white/40">by {idea.author_name}</div>
                                                </div>
                                            </div>
                                            <div className="z-10 relative text-right">
                                                <div className="text-xl font-bold text-yellow-400">{idea.score}</div>
                                                <div className="text-[10px] uppercase text-white/30">Points</div>
                                            </div>
                                            {/* Bar BG */}
                                            <div className="absolute inset-y-0 left-0 bg-yellow-500/5 w-0 group-hover:w-full transition-all duration-500 ease-out z-0" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>
                </div>
             </div>

             <ChatBot />
        </div>
    );
}
