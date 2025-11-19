import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PrismaticBurst from "../components/ui/PrismaticBurst";

const eventsWithPrice = [
  { name: "BGMI Tournament", price: 200 },
  { name: "Chess Tournament", price: 150 },
  { name: "Debate Contest", price: 100 },
  { name: "Drone Race Competition", price: 300 },
  { name: "VR Experience", price: 250 },
  { name: "Photography Scavenger Hunt", price: 120 },
  { name: "Dance Face-off", price: 180 },
  { name: "Flying Simulator", price: 350 },
  { name: "Ramp Walk", price: 100 },
  { name: "GSQ (Google Squid Games)", price: 280 },
  { name: "Drone Simulator Competition", price: 320 },
  { name: "AeroCAD Face-Off", price: 200 },
  { name: "Poster Design Competition", price: 80 },
  { name: "Mobile Robocar Racing", price: 400 },
  { name: "Strongest on Campus", price: 150 },
  { name: "Valorant Tournament", price: 220 },
];

export default function RegistrationPage() {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prn, setPrn] = useState("");
  const [success, setSuccess] = useState<null | { id: number; msg: string }>(
    null
  );

  const toggleEvent = (name: string) =>
    setSelectedEvents((prev) => (prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]));

  const totalPrice = eventsWithPrice
    .filter((e) => selectedEvents.includes(e.name))
    .reduce((s, e) => s + e.price, 0);

  // Auto-lookup name/email from backend when PRN is provided
  React.useEffect(() => {
    const prnRegex = /^\d{12}$/;
    (async () => {
      try {
        if (!prnRegex.test(prn)) return;
        const res = await fetch(`/api/auth/lookup?prn=${encodeURIComponent(prn)}`);
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const data = json.data || {};
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
      } catch (e) {
        // ignore
      }
    })();
  }, [prn]);

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
        headers: { "Content-Type": "application/json" },
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
        handler: async function (response: RazorpayResponse) {
          // verify on server
          try {
            const v = await fetch(`/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verified = await v.json().catch(() => ({}));
            if (!v.ok) {
              setSuccess({ id: Date.now(), msg: `Payment verification failed: ${verified?.error || v.statusText}` });
            } else {
              // Persist event registrations
              try {
                const token = typeof window !== 'undefined' ? sessionStorage.getItem('gamesta_token') : null;
                const regRes = await fetch('/api/profile/events/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({
                    events: selectedEvents,
                    paymentId: verified.paymentId || response.razorpay_payment_id,
                    orderId: verified.orderId || response.razorpay_order_id
                  })
                });
                const regJson = await regRes.json().catch(() => ({}));
                if (regRes.ok) {
                  setSuccess({ id: Date.now(), msg: `Payment + ${regJson.count || selectedEvents.length} event(s) saved!` });
                } else {
                  setSuccess({ id: Date.now(), msg: `Payment ok but events save failed` });
                }
              } catch (e) {
                setSuccess({ id: Date.now(), msg: 'Payment ok but registration error' });
              }
              // clear form
              setSelectedEvents([]);
              setName('');
              setEmail('');
              setPrn('');
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
              {eventsWithPrice.map((ev, i) => {
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
                        <p className="text-xs text-gray-300">Slots: <span className="font-medium text-gray-100">Limited</span></p>
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
                  <label className="text-xs text-gray-300">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-lg bg-[#07060a]/60 border border-[#241f28] focus:outline-none text-gray-200" placeholder="Enter Name" />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-300">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-lg bg-[#07060a]/60 border border-[#241f28] focus:outline-none text-gray-200" placeholder="Enter Email" />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-gray-300">PRN</label>
                  <input value={prn} onChange={(e) => setPrn(e.target.value)} className="w-full mt-2 px-3 py-2 rounded-lg bg-[#07060a]/60 border border-[#241f28] focus:outline-none" placeholder="Enter your 12-digit PRN" />
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
                        const ev = eventsWithPrice.find((e) => e.name === s);
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
                <div>Note: Prices are hard-coded demo values. This page collects basic details for demo registration only.</div>
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
