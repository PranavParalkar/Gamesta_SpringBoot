import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Bot, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  text: string;
  sender: "bot" | "user";
};

type QuestionOption = {
  id: string;
  label: string;
  answer: string;
};

const OPTIONS: QuestionOption[] = [
  { id: "reg", label: "How do I register?", answer: "To register: Go to the 'Events' tab, click on an event card, and hit the 'Register' button. You'll get an email confirmation!" },
  { id: "idea", label: "How to submit an idea?", answer: "Navigate to the 'Ideas' page and click 'Submit Idea'. You can also vote on others' ideas there." },
  { id: "evt", label: "What is the most popular event?", answer: "Check the 'Trending' page! The most registered event is displayed in the analytics section." },
  { id: "contact", label: "Contact Support", answer: "You can email us at admin@gamesta.com or DM us on Instagram @gamesta_mitaoe." },
  { id: "leader", label: "How does the Leaderboard work?", answer: "Points are awarded for votes received on your ideas and event participation. The top 10 users are shown on the Leaderboard." },
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", text: "Hi! I'm Gamesta Bot. Tap a topic below to get started.", sender: "bot" }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleOptionClick = (option: QuestionOption) => {
    // Add user selection
    const userMsg: Message = { id: Date.now().toString(), text: option.label, sender: "user" };
    setMessages(p => [...p, userMsg]);

    // Add bot response
    setTimeout(() => {
        setMessages(p => [...p, { id: (Date.now() + 1).toString(), text: option.answer, sender: "bot" }]);
    }, 400);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)] bg-gradient-to-r from-violet-600 to-fuchsia-600 z-50 group hover:scale-110 transition-all border border-white/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="text-white group-hover:hidden transition-all" size={24} />
        <Sparkles className="text-white hidden group-hover:block transition-all" size={24} />
        
        {/* Pulse Ring */}
        <span className="absolute -inset-1 rounded-full border border-violet-500/50 animate-ping opacity-75" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[340px] md:w-[380px] h-[500px] bg-[#0c0a1f]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden ring-1 ring-white/5"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 border-b border-white/10 flex justify-between items-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-white/5 pattern-dots mask-gradient" /> {/* subtle bg pattern */}
                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-inner">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white text-base tracking-tight">Gamesta Assistant</div>
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse relative">
                                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                            </span> 
                            Always Online
                        </div>
                    </div>
                </div>
                {/* Fixed: Added relative z-10 to ensure button is clickable */}
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors relative z-10"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area - Fixed: Hidden Scrollbar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" ref={scrollRef}>
                {messages.map(m => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.id} 
                        className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {m.sender === 'bot' && (
                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] text-white font-bold mr-2 mt-1 shrink-0">
                                AI
                             </div>
                        )}
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            m.sender === 'user' 
                                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-none shadow-[0_4px_15px_-3px_rgba(124,58,237,0.3)]' 
                                : 'bg-white/10 text-white/90 rounded-bl-none border border-white/5'
                        }`}>
                            {m.text}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions (Options) - Fixed: Horizontal Scroll Chips */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm shrink-0">
                <div className="text-xs font-medium text-white/40 mb-3 uppercase tracking-wider pl-1">Suggested Questions</div>
                <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {OPTIONS.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleOptionClick(opt)}
                            className="group flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:border-violet-500/30 border border-white/5 transition-all"
                        >
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">{opt.label}</span>
                            <ChevronRight size={14} className="text-white/20 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
