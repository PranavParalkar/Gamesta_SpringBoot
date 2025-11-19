"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface IdeaItem {
  id: number;
  title: string;
  description: string;
  created_at: string;
  score: number;
  upvote_count: number;
  vote_count: number;
  rank?: number;
}

export default function ProfileList() {
  const [ideas, setIdeas] = useState<IdeaItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? sessionStorage.getItem('gamesta_token') : null;
        const res = await fetch('/api/profile/ideas', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Failed to load ideas');
        }
        const json = await res.json();
        setIdeas(json.data || []);
      } catch (e: any) {
        setError(e && e.message ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="py-12 text-center">Loading your ideas…</div>;
  if (error) return <div className="py-12 text-center text-destructive">Error: {error}</div>;
  if (!ideas || ideas.length === 0) return <div className="py-12 text-center">You haven't submitted any ideas yet.</div>;

  return (
    <div className="grid gap-4">
      {ideas.map((idea) => (
        <Card key={idea.id} className="p-4">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editingId === idea.id ? (
                  <div className="space-y-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                      placeholder="Title"
                      maxLength={120}
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
                      placeholder="Description"
                      rows={4}
                      maxLength={500}
                    />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{idea.description}</CardDescription>
                  </>
                )}
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm text-muted-foreground">Upvotes</div>
                <div className="text-xl font-semibold">{idea.upvote_count}</div>
                <div className="text-sm text-muted-foreground mt-2">Rank #{idea.rank ?? '-'}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap items-center">
              {editingId === idea.id ? (
                <>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (saving) return;
                      const title = editTitle.trim();
                      const description = editDescription.trim();
                      if (title.length < 5) { alert('Title too short'); return; }
                      if (description.length < 10) { alert('Description too short'); return; }
                      if (description.length > 500) { alert('Description too long (max 500)'); return; }
                      try {
                        setSaving(true);
                        const token = typeof window !== 'undefined' ? sessionStorage.getItem('gamesta_token') : null;
                        const res = await fetch(`/api/ideas/${idea.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({ title, description }),
                        });
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(json.error || 'Failed to update idea');
                        // Update local state
                        setIdeas((prev) => prev ? prev.map(i => i.id === idea.id ? { ...i, title, description } : i) : prev);
                        setEditingId(null);
                      } catch (e: any) {
                        alert(e?.message || 'Failed to update idea');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(idea.id);
                      setEditTitle(idea.title);
                      setEditDescription(idea.description);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (revokingId) return;
                      const ok = confirm('Revoke this idea? This action cannot be undone.');
                      if (!ok) return;
                      try {
                        setRevokingId(idea.id);
                        const token = typeof window !== 'undefined' ? sessionStorage.getItem('gamesta_token') : null;
                        const res = await fetch(`/api/ideas/${idea.id}`, {
                          method: 'DELETE',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) throw new Error(json.error || 'Failed to revoke idea');
                        setIdeas((prev) => prev ? prev.filter(i => i.id !== idea.id) : prev);
                      } catch (e: any) {
                        alert(e?.message || 'Failed to revoke idea');
                      } finally {
                        setRevokingId(null);
                      }
                    }}
                  >
                    {revokingId === idea.id ? 'Revoking…' : 'Revoke'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
