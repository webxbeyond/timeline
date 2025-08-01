"use client";
import { fetchAllCalendarEvents } from '@/src/lib/google';
import { useEffect, useState } from 'react';
import Timeline from '@/src/components/Timeline';
import dynamic from 'next/dynamic';
import CalendarSelector from '@/src/components/CalendarSelector';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
// const CalendarSelector = dynamic(() => import('@/src/components/CalendarSelector'), { ssr: false });


export default function ClientCalendarTimeline({ session }: { session: any }) {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (res.status === 401) {
          setError("Session expired. Please sign in again.");
          setCalendars([]);
          return;
        }
        const data = await res.json();
        setCalendars(data.items || []);
        // Load selected from localStorage or default to all
        const stored = window.localStorage.getItem("selectedCalendarIds");
        if (stored) {
          setSelectedIds(JSON.parse(stored));
        } else {
          setSelectedIds((data.items || []).map((c: any) => c.id));
        }
      } catch (e) {
        setCalendars([]);
        setError("Failed to load calendars.");
      }
    })();
  }, [session]);

  useEffect(() => {
    if (!session || selectedIds.length === 0) {
      setEvents([]);
      return;
    }
    let fakeProgress = 0;
    setLoading(true);
    setProgress(0);
    setError(null);
    const interval = setInterval(() => {
      fakeProgress += 10;
      setProgress(Math.min(fakeProgress, 90));
    }, 100);
    (async () => {
      try {
        const evs = await fetchAllCalendarEvents(session, selectedIds);
        // Check for 401 error in events response (if fetchAllCalendarEvents returns a special error object)
        if (Array.isArray(evs) && evs.some((e: any) => e.error === 401)) {
          setError("Session expired. Please sign in again.");
          setEvents([]);
        } else {
          setEvents(evs);
        }
      } catch (err: any) {
        if (err?.status === 401) {
          setError("Session expired. Please sign in again.");
          setEvents([]);
        } else {
          setError("Failed to load events.");
          setEvents([]);
        }
      } finally {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setLoading(false), 400);
      }
    })();
    return () => clearInterval(interval);
  }, [session, selectedIds]);

  // Settings menu state
  const [showSettings, setShowSettings] = useState(false);


  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Error message overlay */}
      {error && (
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(2px)' }}>
          <Paper elevation={6} sx={{ p: 3, borderRadius: 3, textAlign: 'center', background: 'var(--card-bg)', minWidth: 300 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'red', mb: 1 }}>{error}</Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, fontWeight: 'bold', borderRadius: 2, background: 'var(--accent)', '&:hover': { background: 'var(--accent-hover)' } }}
              onClick={() => window.location.href = "/api/auth/signin"}
            >Sign in again</Button>
          </Paper>
        </Box>
      )}

      {/* Settings button top right */}
      <Button
        sx={{ position: 'absolute', top: 0, right: 0, m: 2, p: 1, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.8)', boxShadow: 2, minWidth: 0, '&:hover': { backgroundColor: 'var(--accent-light)' } }}
        onClick={() => setShowSettings((v) => !v)}
        aria-label="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1c.13-.31.08-.67-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09c.31-.13.67-.08 1.82.33a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c.13.31.08.67-.33 1.82a1.65 1.65 0 0 0 1 1.51h.09c.31-.13.67-.08 1.82.33a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c.13.31.08.67-.33 1.82a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </Button>

      {/* Settings modal/dropdown */}
      {showSettings && (
        <Paper elevation={6} sx={{ position: 'absolute', top: 64, right: 16, zIndex: 50, width: 320, maxWidth: '100%', background: 'var(--card-bg)', borderRadius: 3, boxShadow: 4, p: 2, animation: 'fade-in 0.3s' }}>
          <CalendarSelector calendars={calendars} selectedIds={selectedIds} onChange={setSelectedIds} onClose={() => setShowSettings(false)} />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, width: '100%', fontWeight: 'bold', borderRadius: 2, background: 'var(--accent)', '&:hover': { background: 'var(--accent-hover)' } }}
            onClick={() => setShowSettings(false)}
          >Close</Button>
        </Paper>
      )}

      {/* Timeline always visible */}
      <Timeline events={events} loading={loading} progress={progress} />
    </Box>
  );
}
