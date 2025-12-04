import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrismaticBurst from "../components/ui/PrismaticBurst";
import { FaCheckCircle, FaStar, FaTrophy, FaRocket } from "react-icons/fa";

type EventItem = { id: number; name: string; price: number; ticketLimit?: number | null; ticketsSold?: number; remaining?: number | null };

export default function RegistrationPage() {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [finalEventCount, setFinalEventCount] = useState<number>(0);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prn, setPrn] = useState("");
  const [success, setSuccess] = useState<null | { id: number; msg: string }>(
    null
  );
  const [showCelebration, setShowCelebration] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);
  // Admin dashboard is separate; keep user flow simple here

  const toggleEvent = (name: string) =>
    setSelectedEvents((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));

  const totalPrice = events
    .filter((e) => selectedEvents.includes(e.name))
    .reduce((s, e) => s + (e.price || 0), 0);

  // Load events from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/events');
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data) setEvents(json.data);
      } catch {}
    })();
  }, []);

  // Fetch user data from profile API on component mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;
    if (!token) return;

    setLoadingUserData(true);
    (async () => {
      try {
        const res = await fetch(`/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const userData = json?.user || {};
          // Only populate if fields are empty (allow user to edit)
          if (userData.name && !name) setName(userData.name);
          if (userData.email && !email) setEmail(userData.email);
          // role info not used on this page now
        }
      } catch (e) {
        // ignore errors
      } finally {
        setLoadingUserData(false);
      }
    })();
  }, []); // Only run once on mount

  // Admin lists/actions live in /admin

  // Auto-lookup name/email from backend when PRN is provided (fallback)
  useEffect(() => {
    const prnRegex = /^\d{12}$/;
    (async () => {
      try {
        if (!prnRegex.test(prn)) return;
        // Only lookup if name/email are still empty
        if (name && email) return;
        const res = await fetch(`/api/auth/lookup?prn=${encodeURIComponent(prn)}`);
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const data = json.data || {};
        if (data.name && !name) setName(data.name);
        if (data.email && !email) setEmail(data.email);
      } catch (e) {
        // ignore
      }
    })();
  }, [prn, name, email]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const submitRegistration = async () => {
    // Require sign-in before proceeding
    const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;
    if (!token) {
      setSuccess({ id: Date.now(), msg: "Please sign in before registering" });
      setTimeout(() => setSuccess(null), 3000);
      // Optionally navigate to login page if present
      try {
        if (typeof window !== "undefined") {
          const hasLogin = !!document.querySelector('a[href="/login"], a[href="/signin"], a[href*="login"], a[href*="signin"]');
          if (hasLogin) {
            window.location.href = "/login";
          }
        }
      } catch {}
      return;
    }
    if (!prn.trim() || selectedEvents.length === 0) {
      setSuccess({ id: Date.now(), msg: "Provide PRN and select ≥1 event" });
      setTimeout(() => setSuccess(null), 2500);
      return;
    }
    if (!name.trim() || !email.trim()) {
      setSuccess({ id: Date.now(), msg: "Unable to lookup name/email for PRN" });
      setTimeout(() => setSuccess(null), 2500);
      return;
    }

    try {
      // create order on server
      const createRes = await fetch(`/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ total: totalPrice }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        setSuccess({ id: Date.now(), msg: `Failed to create order: ${err?.error || createRes.statusText}` });
        setTimeout(() => setSuccess(null), 3500);
        return;
      }
      const payData = await createRes.json();

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setSuccess({ id: Date.now(), msg: "Failed to load payment library" });
        setTimeout(() => setSuccess(null), 3500);
        return;
      }

      const options: any = {
        key: payData.key,
        amount: payData.amount,
        currency: payData.currency || "INR",
        name: "Gamesta Events",
        description: `${selectedEvents.length} events registration`,
        order_id: payData.orderId,
        handler: async function (response: any) {
          // verify on server
          try {
            const v = await fetch(`/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            });
            const verified = await v.json().catch(() => ({}));
            if (!v.ok) {
              setSuccess({ id: Date.now(), msg: `Payment verification failed: ${verified?.error || v.statusText}` });
            } else {
              // Persist event registrations
              try {
                const regRes = await fetch('/api/profile/events/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    events: selectedEvents,
                    paymentId: verified.paymentId || response.razorpay_payment_id,
                    orderId: verified.orderId || response.razorpay_order_id
                  })
                });
                const regJson = await regRes.json().catch(() => ({}));
                if (regRes.ok) {
                  const countToShow = Number(regJson.count ?? selectedEvents.length) || 0;
                  setFinalEventCount(countToShow);
                  // Trigger celebration animation
                  setShowCelebration(true);
                  setTimeout(() => setShowCelebration(false), 3000);
                  
                  setSuccess({ id: Date.now(), msg: `Payment + ${countToShow} event(s) saved!` });
                  
                  // clear form after a delay
                  setTimeout(() => {
                    setSelectedEvents([]);
                    setName('');
                    setEmail('');
                    setPrn('');
                  }, 1000);
                } else {
                  setSuccess({ id: Date.now(), msg: `Payment ok but events save failed` });
                }
              } catch (e) {
                setSuccess({ id: Date.now(), msg: 'Payment ok but registration error' });
              }
            }
            setTimeout(() => setSuccess(null), 4500);
          } catch (err) {
            setSuccess({ id: Date.now(), msg: `Verification error` });
            setTimeout(() => setSuccess(null), 3500);
          }
        },
        prefill: { name, email },
        theme: { color: "#7c3aed" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setSuccess({ id: Date.now(), msg: "Unexpected error starting payment" });
      setTimeout(() => setSuccess(null), 3500);
    }
  };

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden bg-[#07060a]">
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
              animate={{ scale: 1, opacity: 0.95 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-pink-600/90 to-cyan-600/90 backdrop-blur-xl"
            />
            
            {/* Celebration content */}
            <div className="relative z-10 text-center px-4">
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180, y: -50 }}
                animate={{ scale: 1, rotate: 0, y: 0 }}
                exit={{ scale: 0, rotate: 180, y: 50 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 0.1,
                }}
                className="mb-6"
              >
                <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center shadow-2xl">
                  <FaTrophy className="text-white text-7xl" />
                </div>
              </motion.div>
              
              {/* Success Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{
                  type: "spring",
                  damping: 12,
                  stiffness: 200,
                  delay: 0.3,
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl">
                  <FaCheckCircle className="text-white text-6xl" />
                </div>
              </motion.div>
              
              {/* Main Title */}
              <motion.h2
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ delay: 0.4, type: "spring", damping: 20 }}
                className="text-6xl md:text-7xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300"
              >
                Registration Successful! 🎉
              </motion.h2>
              
              {/* Subtitle */}
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl md:text-3xl text-purple-100 mb-2"
              >
                You're all set for {finalEventCount} {finalEventCount === 1 ? 'event' : 'events'}!
              </motion.p>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-cyan-200"
              >
                Get ready for an amazing experience! 🚀
              </motion.p>
              
              {/* Floating stars and rockets */}
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 1,
                    rotate: 0,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: Math.cos((i * Math.PI * 2) / 16) * 300,
                    y: Math.sin((i * Math.PI * 2) / 16) * 300,
                    opacity: [1, 1, 0],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.7 + i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  {i % 3 === 0 ? (
                    <FaRocket className="text-cyan-300 text-2xl" />
                  ) : (
                    <FaStar className="text-yellow-300 text-2xl" />
                  )}
                </motion.div>
              ))}
              
              {/* Confetti effect */}
              {typeof window !== "undefined" && [...Array(20)].map((_, i) => {
                const randomX = Math.random() * (window.innerWidth || 1920);
                const randomY = (window.innerHeight || 1080) + 100;
                const colors = ['#ff5ec8', '#8f5bff', '#00f6ff', '#ffd700', '#ff6b6b'];
                return (
                  <motion.div
                    key={`confetti-${i}`}
                    initial={{ 
                      y: -100,
                      x: randomX,
                      opacity: 1,
                      rotate: 0,
                    }}
                    animate={{
                      y: randomY,
                      x: randomX + (Math.random() - 0.5) * 200,
                      opacity: [1, 1, 0],
                      rotate: 360,
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      delay: 0.8 + Math.random() * 0.5,
                      ease: "easeIn",
                    }}
                    className="absolute top-0"
                    style={{
                      width: 10 + Math.random() * 10,
                      height: 10 + Math.random() * 10,
                      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 mix-blend-screen opacity-70 z-0 pointer-events-none">
        <PrismaticBurst intensity={0.55} speed={0.6} animationType="rotate3d" colors={["#ff5ec8", "#8f5bff", "#00f6ff"]} />
      </div>

      <main className="max-w-8xl mx-auto px-6 py-16 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events & creative canvas */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}
                className="text-lg font-semibold">
                Available Events
              </motion.div>

              <motion.div initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}
                className="text-sm text-gray-300 flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#0f0c13]/40 border border-purple-600/30 text-xs">Click to select</span>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {events.map((ev, i) => {
                const active = selectedEvents.includes(ev.name);
                return (
                  <motion.div
                    key={i}
                    layout
                    whileHover={{ scale: 1.02, rotate: active ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 18 }}
                    onClick={() => toggleEvent(ev.name)}
                    className={`relative z-10 cursor-pointer rounded-2xl p-4 border-2 transition-all duration-300 overflow-visible
                      ${active ? "bg-gradient-to-br from-pink-600/10 via-purple-700/6 to-cyan-400/6 border-pink-500 shadow-lg" : "bg-[#0f0c13]/60 border-[#26242b]"}`}>
                    {/* neon ribbon positioned outside the card (top-left) */}
                    <div className={`absolute -top-3 -left-3 -rotate-12 px-2 py-1 text-[12px] font-bold ${active ? "bg-pink-500 text-black" : "bg-[#1d1b22]/60 text-gray-300"} rounded-md shadow-sm z-20 pointer-events-none`}>
                      {active ? "Selected" : "Event"}
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base md:text-lg font-semibold">{ev.name}</h3>
                        <p className="text-xs text-gray-300">Slots: <span className="font-medium text-gray-100">{ev.ticketLimit != null ? `${ev.ticketsSold ?? 0}/${ev.ticketLimit}` : 'Unlimited'}</span></p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-300">Price</div>
                        <div className="text-xl font-extrabold text-cyan-300">₹{ev.price}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-gray-400">Team / Solo: Flexible</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${active ? "bg-gradient-to-r from-pink-500 to-purple-500 text-black" : "bg-[#121016]/60 text-gray-300"} border border-[#2b2a31]`}>
                          {ev.price < 150 ? "S" : "P"}
                        </div>
                        <svg className={`w-5 h-5 ${active ? "text-pink-400" : "text-gray-500"}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01z" />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

           
          </section>

          {/* Sticky Summary + Form (all on same page) */}
          <aside className="lg:col-span-1">
            <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="sticky top-28">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-[#0d0710]/60 to-[#1b1520] border border-purple-600/20">
                <h2 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-cyan-400">Checkout</h2>

                <div className="mb-4">
                  <label className="text-xs text-gray-300">PRN</label>
                  <input value={prn} onChange={(e) => setPrn(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-lg bg-[#07060a]/60 border border-[#241f28] focus:outline-none" placeholder="Enter your 12-digit PRN" />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-300 flex items-center gap-2">
                    Email
                    {loadingUserData && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full"
                      />
                    )}
                  </label>
                  <motion.input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    whileFocus={{ scale: 1.02, borderColor: "#a855f7" }}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#07060a]/60 border border-[#241f28] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-200 transition-all"
                    placeholder="Enter Email"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-300 flex items-center gap-2">
                    Name
                    {loadingUserData && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full"
                      />
                    )}
                  </label>
                  <motion.input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    whileFocus={{ scale: 1.02, borderColor: "#a855f7" }}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-[#07060a]/60 border border-[#241f28] focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-200 transition-all"
                    placeholder="Enter Name"
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                    <span>Events</span>
                    <span className="font-semibold text-pink-400">{selectedEvents.length}</span>
                  </div>

                  <div className="max-h-36 overflow-auto space-y-2">
                    {selectedEvents.length === 0 ? (
                      <div className="text-xs text-gray-500">No events selected</div>
                    ) : (
                      selectedEvents.map((s, idx) => {
                        const ev = events.find((e) => e.name === s);
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm bg-[#0b0a0d]/40 px-3 py-2 rounded-md border border-purple-500/10">
                            <div className="truncate">{s}</div>
                            <div className="text-cyan-300 font-semibold">₹{ev?.price}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="border-t border-purple-600/10 pt-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-300">Total</div>
                    <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-cyan-400">₹{totalPrice}</div>
                  </div>
                </div>

                <button onClick={submitRegistration} disabled={selectedEvents.length === 0}
                  className={`w-full py-3 rounded-xl font-bold text-lg transition-all duration-200 ${selectedEvents.length === 0 ? "bg-gray-700 opacity-60 cursor-not-allowed" : "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 hover:shadow-lg"}`}>
                  Register Now
                </button>

                <button onClick={() => { setSelectedEvents([]); }} className="w-full mt-3 py-2 rounded-lg border border-purple-600/20 text-sm">Clear Selection</button>
              </div>

              {/* mini legal / note */}
              <div className="mt-4 text-xs text-gray-400">
                <div>Note: Event details are fetched live from the server.</div>
              </div>
            </motion.div>
          </aside>
          
        </div>
      </main>

      {/* success / error toast */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-50 pointer-events-none">
        <AnimatePresence>
          {success && (
            <motion.div key={success.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <div className="px-5 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 text-black font-semibold shadow-xl pointer-events-auto">
                {success.msg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
