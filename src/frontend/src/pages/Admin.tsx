import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";

type Idea = { id: number; title: string; description?: string; score?: number };
type EventItem = { id: number; name: string; price: number };
type Registration = { id: number; eventName: string; createdAt?: string; user?: { email?: string; name?: string } };
import Sparkline from "../components/ui/Sparkline";
import MiniBar from "../components/ui/MiniBar";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string>("USER");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState<string>("");
  const [tab, setTab] = useState<"overview" | "ideas" | "events" | "registrations">("overview");
  const [ideasQuery, setIdeasQuery] = useState("");
  const [eventsQuery, setEventsQuery] = useState("");
  const [regsQuery, setRegsQuery] = useState("");

  const token = typeof window !== "undefined" ? sessionStorage.getItem("gamesta_token") : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Check role
        if (!token) throw new Error("Sign in required");
        const prof = await fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } });
        const pj = await prof.json().catch(() => ({}));
        if (!prof.ok || !pj?.user?.isAdmin) {
          // not admin: bounce home
          window.location.href = "/";
          return;
        }
        setIsAdmin(true);
        setRole(pj?.user?.role || "USER");

        // 2) Load data in parallel
        const [ideasRes, eventsRes, regsRes] = await Promise.all([
          fetch("/api/ideas"),
          fetch("/api/events"),
          fetch("/api/registrations", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [ideasJ, eventsJ, regsJ] = await Promise.all([
          ideasRes.json().catch(() => ({})),
          eventsRes.json().catch(() => ({})),
          regsRes.json().catch(() => ({})),
        ]);
        if (ideasRes.ok) setIdeas(ideasJ?.data || []);
        if (eventsRes.ok) setEvents(eventsJ?.data || []);
        if (regsRes.ok) setRegistrations(regsJ?.data || []);
      } catch (e: any) {
        setError(e.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const stats = useMemo(() => ({
    ideas: ideas.length,
    events: events.length,
    registrations: registrations.length,
  }), [ideas, events, registrations]);

  const regSeries = useMemo(() => {
    const days = 14;
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0,10);
    const labels: string[] = [];
    const counts: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = fmt(d);
      labels.push(key);
      counts[key] = 0;
    }
    for (const r of registrations) {
      if (!r.createdAt) continue;
      const key = fmt(new Date(r.createdAt));
      if (key in counts) counts[key]++;
    }
    const values = labels.map(l => counts[l] || 0);
    const total7 = values.slice(-7).reduce((a,b)=>a+b,0);
    const todayCnt = values[values.length-1] || 0;
    return { labels, values, total7, todayCnt };
  }, [registrations]);

  const topEventDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrations) {
      map.set(r.eventName, (map.get(r.eventName) || 0) + 1);
    }
    const sorted = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6);
    return { labels: sorted.map(([k])=>k), values: sorted.map(([,v])=>v) };
  }, [registrations]);

  function refreshAll() {
    // trigger useEffect reload by toggling loading state and refetching
    setLoading(true);
    (async () => {
      try {
        const [iR, eR, rR] = await Promise.all([
          fetch("/api/ideas"),
          fetch("/api/events"),
          fetch("/api/registrations", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [iJ, eJ, rJ] = await Promise.all([iR.json().catch(()=>({})), eR.json().catch(()=>({})), rR.json().catch(()=>({}))]);
        if (iR.ok) setIdeas(iJ?.data || []);
        if (eR.ok) setEvents(eJ?.data || []);
        if (rR.ok) setRegistrations(rJ?.data || []);
        toast.success("Data refreshed");
      } catch (e:any) {
        setError(e.message || "Refresh failed");
      } finally { setLoading(false); }
    })();
  }

  async function deleteIdea(id: number) {
    if (!token) return;
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      setIdeas(prev => prev.filter(i => i.id !== id));
      toast.success("Idea deleted");
    } catch (e: any) { setError(e.message || "Delete failed"); }
  }

  async function deleteEvent(id: number) {
    if (!token) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      setEvents(prev => prev.filter(i => i.id !== id));
      toast.success("Event deleted");
    } catch (e: any) { setError(e.message || "Delete failed"); }
  }

  async function deleteRegistration(id: number) {
    if (!token) return;
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      setRegistrations(prev => prev.filter(r => r.id !== id));
      toast.success("Registration deleted");
    } catch (e: any) { setError(e.message || "Delete failed"); }
  }

  function confirmDelete(kind: "idea"|"event"|"registration", id: number) {
    const name = kind.charAt(0).toUpperCase() + kind.slice(1);
    if (window.confirm(`Delete this ${name}? This cannot be undone.`)) {
      if (kind === "idea") deleteIdea(id);
      else if (kind === "event") deleteEvent(id);
      else deleteRegistration(id);
    }
  }

  function downloadCSV(filename: string, rows: any[]) {
    if (!rows || rows.length === 0) { toast("No data to export"); return; }
    const headers = Object.keys(rows[0]);
    const escape = (v:any) => typeof v === 'string' ? '"' + v.replace(/"/g,'""') + '"' : (v ?? '');
    const csv = [headers.join(",")].concat(rows.map(r => headers.map(h => escape((r as any)[h])).join(","))).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  const filteredIdeas = useMemo(() => {
    const q = ideasQuery.trim().toLowerCase();
    if (!q) return ideas;
    return ideas.filter(i => (i.title || '').toLowerCase().includes(q) || String(i.id).includes(q));
  }, [ideas, ideasQuery]);

  const filteredEvents = useMemo(() => {
    const q = eventsQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(e => (e.name || '').toLowerCase().includes(q) || String(e.id).includes(q));
  }, [events, eventsQuery]);

  const filteredRegs = useMemo(() => {
    const q = regsQuery.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter(r =>
      (r.eventName || '').toLowerCase().includes(q) ||
      String(r.id).includes(q) ||
      (r.user?.email || '').toLowerCase().includes(q) ||
      (r.user?.name || '').toLowerCase().includes(q)
    );
  }, [registrations, regsQuery]);

  async function clearDatabase() {
    if (!token) return;
    const ok1 = window.confirm("This will delete ALL data. Proceed?");
    if (!ok1) return;
    const ok2 = window.confirm("Are you absolutely sure? This cannot be undone.");
    if (!ok2) return;
    try {
      const res = await fetch("/api/admin/maintenance/clear-db", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Clear DB failed");
      toast.success("Database cleared. Reloading...");
      setTimeout(() => window.location.reload(), 800);
    } catch (e:any) {
      setError(e.message || "Clear DB failed");
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-8 text-white">Loading admin dashboard…</div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="px-6 py-8 text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={refreshAll} className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-sm">Refresh</button>
          <button onClick={() => downloadCSV('registrations.csv', registrations.map(r => ({ id: r.id, eventName: r.eventName, userEmail: r.user?.email || '', userName: r.user?.name || '', createdAt: (r as any).createdAt || '' })))} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-800 text-sm">Export Registrations</button>
          {role === 'SUPER_ADMIN' && (
            <button onClick={clearDatabase} className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-sm">Erase All Tables</button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 text-red-400">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]"><div className="text-sm opacity-70">Ideas</div><div className="text-3xl font-bold">{stats.ideas}</div></div>
        <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]"><div className="text-sm opacity-70">Events</div><div className="text-3xl font-bold">{stats.events}</div></div>
        <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]"><div className="text-sm opacity-70">Registrations</div><div className="text-3xl font-bold">{stats.registrations}</div></div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-[#2b2352]">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'ideas', label: 'Ideas' },
          { key: 'events', label: 'Events' },
          { key: 'registrations', label: 'Registrations' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-3 py-2 text-sm ${tab === t.key ? 'border-b-2 border-purple-500 text-white' : 'text-gray-300 hover:text-white'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Charts */}
          <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm opacity-70">Registrations (last 14 days)</div>
              <div className="text-xs opacity-80">Today: {regSeries.todayCnt} · 7d: {regSeries.total7}</div>
            </div>
            <Sparkline data={regSeries.values} width={360} height={96} />
          </div>

          <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]">
            <div className="text-sm opacity-70 mb-2">Top Events by Registrations</div>
            {topEventDist.values.length > 0 ? (
              <MiniBar values={topEventDist.values} labels={topEventDist.labels} width={360} height={120} />
            ) : (
              <div className="text-sm opacity-70 py-8">No registration data yet.</div>
            )}
          </div>

          <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]">
            <div className="text-sm opacity-70 mb-2">Recent Registrations</div>
            <div className="max-h-96 overflow-auto divide-y divide-[#2b2352]">
              {registrations.slice(0, 12).map(r => (
                <div key={r.id} className="py-2 flex justify-between items-center">
                  <div>
                    <div className="text-sm">{r.eventName}</div>
                    <div className="text-xs opacity-70">{r.user?.email || ''}</div>
                  </div>
                  <button onClick={() => confirmDelete('registration', r.id)} className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700">Delete</button>
                </div>
              ))}
              {registrations.length === 0 && <div className="text-sm opacity-70 py-8">No registrations yet.</div>}
            </div>
          </div>

          <div className="p-4 rounded bg-[#0b0620] border border-[#2b2352]">
            <div className="text-sm opacity-70 mb-2">Top Ideas</div>
            <div className="max-h-96 overflow-auto divide-y divide-[#2b2352]">
              {ideas
                .slice()
                .sort((a,b) => (b.score || 0) - (a.score || 0))
                .slice(0, 12)
                .map(i => (
                <div key={i.id} className="py-2 flex justify-between items-center">
                  <div>
                    <div className="text-sm">{i.title}</div>
                    <div className="text-xs opacity-70">Score: {i.score ?? 0}</div>
                  </div>
                  <button onClick={() => confirmDelete('idea', i.id)} className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700">Delete</button>
                </div>
              ))}
              {ideas.length === 0 && <div className="text-sm opacity-70 py-8">No ideas yet.</div>}
            </div>
          </div>

          {role === 'SUPER_ADMIN' && (
            <div className="p-4 rounded bg-[#1a0f2e] border border-red-800">
              <div className="text-sm text-red-300 font-semibold mb-2">Danger Zone</div>
              <p className="text-sm text-red-200 mb-3">Clear the entire database (all tables). This action cannot be undone and will sign everyone out.</p>
              <button onClick={clearDatabase} className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-sm">Wipe Database</button>
            </div>
          )}
        </div>
      )}

      {tab === 'ideas' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <input value={ideasQuery} onChange={e=>setIdeasQuery(e.target.value)} placeholder="Search ideas..." className="px-3 py-2 rounded bg-[#0b0620] border border-[#2b2352] w-64" />
            <button onClick={() => downloadCSV('ideas.csv', ideas.map(i => ({ id: i.id, title: i.title, score: i.score ?? 0 })))} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-800 text-sm">Export CSV</button>
          </div>
          <div className="overflow-auto rounded border border-[#2b2352]">
            <table className="w-full text-sm">
              <thead className="bg-[#0b0620]">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIdeas.map(i => (
                  <tr key={i.id} className="border-t border-[#2b2352]">
                    <td className="p-3">{i.id}</td>
                    <td className="p-3">{i.title}</td>
                    <td className="p-3">{i.score ?? 0}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => confirmDelete('idea', i.id)} className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredIdeas.length === 0 && (
                  <tr><td className="p-3 text-sm opacity-70" colSpan={4}>No results.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'events' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <input value={eventsQuery} onChange={e=>setEventsQuery(e.target.value)} placeholder="Search events..." className="px-3 py-2 rounded bg-[#0b0620] border border-[#2b2352] w-64" />
            <button onClick={() => downloadCSV('events.csv', events.map(e => ({ id: e.id, name: e.name, price: e.price })))} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-800 text-sm">Export CSV</button>
          </div>
          <div className="overflow-auto rounded border border-[#2b2352]">
            <table className="w-full text-sm">
              <thead className="bg-[#0b0620]">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(e => (
                  <tr key={e.id} className="border-t border-[#2b2352]">
                    <td className="p-3">{e.id}</td>
                    <td className="p-3">{e.name}</td>
                    <td className="p-3">₹{e.price}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => confirmDelete('event', e.id)} className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr><td className="p-3 text-sm opacity-70" colSpan={4}>No results.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'registrations' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <input value={regsQuery} onChange={e=>setRegsQuery(e.target.value)} placeholder="Search registrations..." className="px-3 py-2 rounded bg-[#0b0620] border border-[#2b2352] w-72" />
            <button onClick={() => downloadCSV('registrations.csv', registrations.map(r => ({ id: r.id, eventName: r.eventName, userEmail: r.user?.email || '', userName: r.user?.name || '', createdAt: (r as any).createdAt || '' })))} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-800 text-sm">Export CSV</button>
          </div>
          <div className="overflow-auto rounded border border-[#2b2352] max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-[#0b0620] sticky top-0">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Event</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Created</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map(r => (
                  <tr key={r.id} className="border-t border-[#2b2352]">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3">{r.eventName}</td>
                    <td className="p-3">{r.user?.name || ''}</td>
                    <td className="p-3">{r.user?.email || ''}</td>
                    <td className="p-3">{(r as any).createdAt || ''}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => confirmDelete('registration', r.id)} className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredRegs.length === 0 && (
                  <tr><td className="p-3 text-sm opacity-70" colSpan={6}>No results.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
 
