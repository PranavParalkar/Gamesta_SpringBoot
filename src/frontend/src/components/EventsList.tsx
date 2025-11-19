"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface EventItem {
  name: string;
  price?: number; // per ticket
  count?: number;
  totalPrice?: number;
  status?: string;
}

export default function EventsList() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('gamesta_token') : null;
        const res = await fetch('/api/profile/events', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) {
          // If endpoint not implemented, fall back to empty list
          if (res.status === 404) {
            setEvents([]);
            return;
          }
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Failed to load events');
        }
        const json = await res.json();
        setEvents(json.data || []);
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="py-8 text-center">Loading events…</div>;
  if (error) return <div className="py-8 text-center text-destructive">Error: {error}</div>;
  if (!events || events.length === 0) return <div className="py-8 text-center text-white/70">You haven't registered for any events yet.</div>;

  return (
    <div className="space-y-4">
      {events.map((ev, idx) => (
        <Card key={idx} className="p-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  {ev.name}
                  {ev.count && ev.count > 1 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/30 border border-purple-500/40 text-purple-300">
                      {ev.count} tickets
                    </span>
                  )}
                </CardTitle>
              </div>
              <div className="text-right">
                {typeof ev.price === 'number' && <div className="text-sm text-white/70">Price / ticket</div>}
                {typeof ev.price === 'number' && <div className="text-lg font-semibold text-white">₹{ev.price}</div>}
                {ev.count && ev.count > 1 && typeof ev.totalPrice === 'number' && (
                  <div className="text-xs text-cyan-300 font-medium">Total: ₹{ev.totalPrice}</div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-white/70">Status: {ev.status || 'Registered'}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
