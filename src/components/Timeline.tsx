"use client";

import { useEffect, useState, useRef } from 'react';
import { format, differenceInMinutes, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from './EventCard';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

function getNow() {
  return new Date();
}

function getDayStats(events: any[]) {
  const now = getNow();
  const wakeHour = 7;
  const sleepHour = 23;
  let startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), wakeHour, 0, 0);
  let endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sleepHour, 0, 0);
  if (sleepHour < wakeHour) {
    if (now.getHours() < wakeHour) {
      startOfDay.setDate(startOfDay.getDate() - 1);
    } else {
      endOfDay.setDate(endOfDay.getDate() + 1);
    }
  }
  const totalMsInDay = endOfDay.getTime() - startOfDay.getTime();
  const msPassed = now.getTime() - startOfDay.getTime();
  const percentOfDay = Math.min((msPassed / totalMsInDay) * 100, 100);
  const msLeft = endOfDay.getTime() - now.getTime();
  const hoursLeft = Math.floor(msLeft / 3600000);
  const minsLeft = Math.floor((msLeft % 3600000) / 60000);
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const isLeapYear = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
  const daysInYear = isLeapYear ? 366 : 365;
  const daysLeft = daysInYear - dayOfYear;
  return {
    percentOfDay,
    hoursLeft,
    minsLeft,
    dayOfYear,
    daysInYear,
    daysLeft,
    activeHours: (endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60),
    startStr: format(startOfDay, 'hh:mm a'),
    endStr: format(endOfDay, 'hh:mm a'),
  };
}

function formatTime(date: Date) {
  return format(date, 'HH:mm');
}

function formatDuration(start: Date, end: Date) {
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / 60000);
  return `${minutes} min`;
}

// Helper for elapsed time formatting
function formatElapsedTime(ms: number) {
  if (ms < 0) ms = 0;
  let totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function TimelineEvent({ event, isCurrent, isFuture, isOverlapped, now, onNotify }: any) {
  const start = new Date(event.json?.startTime || event.start?.dateTime || event.start?.date);
  const end = new Date(event.json?.endTime || event.end?.dateTime || event.end?.date);
  const duration = formatDuration(start, end);
  const timeText = `${formatTime(start)} - ${formatTime(end)} (${duration})`;
  const [percent, setPercent] = useState(0);
  const [remaining, setRemaining] = useState(end.getTime() - now.getTime());
  const [elapsed, setElapsed] = useState(now.getTime() - start.getTime());
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (isCurrent) {
      const total = end.getTime() - start.getTime();
      const elapsedVal = now.getTime() - start.getTime();
      setPercent(Math.min((elapsedVal / total) * 100, 100));
      setRemaining(end.getTime() - now.getTime());
      setElapsed(elapsedVal);
      if (remaining <= 5100 && remaining > 4900 && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
    if (isFuture && remaining <= 60000 && onNotify) {
      onNotify(event);
    }
  }, [now, isCurrent, isFuture, remaining, onNotify, event, start, end]);

  // Progress ring SVG
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  let countdownText = "Live";
  if (isCurrent) {
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    if (hours > 0) countdownText = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    else if (mins > 0) countdownText = `${mins}:${String(secs).padStart(2, '0')}`;
    else countdownText = `${secs}s`;
  }
  // Elapsed time for current event
  const elapsedFormatted = formatElapsedTime(elapsed);

  return (
    <div className={`event ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''} ${isOverlapped ? 'overlapped' : ''}`}
      style={{ animationDelay: `${event.index * 120}ms` }}>
      {isCurrent ? (
        <div className="progress-ring">
          <svg viewBox="0 0 36 36" width="56" height="56">
            <circle cx="18" cy="18" r="16" stroke="var(--card-border)" strokeWidth="3" fill="none" />
            <circle className="progress-circle" cx="18" cy="18" r="16" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" transform="rotate(-90 18 18)" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
          </svg>
          <div className="progress-percentage">{Math.floor(percent)}%</div>
        </div>
      ) : (
        <div className="event-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
      )}
      <div className="event-info">
        <div className={`title`}>{event.json?.title || event.summary}</div>
        <div className="time">
          {timeText}
          {isCurrent && <><br /><span style={{ fontWeight: 400, color: 'var(--accent)' }}>Elapsed: {elapsedFormatted}</span></>}
        </div>
        {event.json?.location && <div className="text-sm text-gray-400">{event.json.location}</div>}
        {isOverlapped && <div className="overlap-warning">⚠️ Overlaps next event</div>}
      </div>
      {isCurrent && <div className="countdown-badge">{countdownText}</div>}
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" preload="auto" />
    </div>
  );
}

function GapCard({ start, end, index }: any) {
  const durationMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(durationMs / 60000);
  return (
    <div className="event gap-card border-dashed border p-6 flex items-center gap-6 bg-transparent text-gray-400" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="event-icon text-green-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-coffee"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
      </div>
      <div className="event-info flex flex-col gap-1">
        <div className="title text-lg font-semibold">Free Time</div>
        <div className="time text-base">{totalMinutes} minutes available</div>
      </div>
    </div>
  );
}

export default function Timeline({ events, loading = false, progress = 0 }: { events: any[]; loading?: boolean; progress?: number }) {
  const [now, setNow] = useState(getNow());
  const notifiedEvents = useRef<Set<string>>(new Set());
  useEffect(() => {
    const interval = setInterval(() => setNow(getNow()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Browser notification logic
  function sendNotification(event: any) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
      return;
    }
    if (!notifiedEvents.current.has(event.json?.title)) {
      new Notification('Upcoming Event', {
        body: `${event.json?.title} starts at ${formatTime(new Date(event.json?.startTime))}`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828817.png',
      });
      notifiedEvents.current.add(event.json?.title);
    }
  }

  // Loader overlay with percentage
  if (loading) {
    return (
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(20,20,20,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Box sx={{ mb: 2 }}>
          <span style={{
            fontSize: '2.8rem',
            color: '#39FF14',
            fontWeight: 900,
            textShadow: '0 0 16px #39FF14, 0 0 32px #39FF14',
            letterSpacing: 2,
            fontFamily: 'Barlow Semi Condensed, sans-serif',
          }}>Timeline</span>
        </Box>
        <Box sx={{ position: 'relative', width: 110, height: 110, mb: 2 }}>
          <CircularProgress variant="determinate" value={progress} size={110} thickness={1} sx={{ color: '#FFD600', filter: 'drop-shadow(0 0 16px #FFD600)' }} />
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '2.2rem', fontWeight: 600, color: '#FFD600', textShadow: '0 0 12px #FFD600' }}>{Math.round(progress)}%</Typography>
          </Box>
        </Box>
        <Typography variant="h6" sx={{ mt: 1, color: '#FFD600', fontWeight: 700, letterSpacing: 2, textShadow: '0 0 8px #FFD600' }}>
          Loading events...
        </Typography>
      </Box>
    );
  }
  if (!events) return (
    <Box sx={{ textAlign: 'center', color: '#39FF14', py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'radial-gradient(circle at 50% 0%, #222 60%, #111 100%)' }}>
      <Box sx={{ mb: 2, animation: 'fadeIn 0.7s ease-in' }}>
        <span style={{
          fontSize: '2.8rem',
          color: '#39FF14',
          fontWeight: 900,
          textShadow: '0 0 16px #39FF14, 0 0 32px #39FF14',
          letterSpacing: 2,
          fontFamily: 'Barlow Semi Condensed, sans-serif',
        }}>Timeline</span>
      </Box>
      <Box sx={{ animation: 'fadeIn 1.2s ease-in' }}>
        <CircularProgress size={70} thickness={6} sx={{ color: '#FFD600', filter: 'drop-shadow(0 0 12px #FFD600)' }} />
      </Box>
      <Typography variant="h6" sx={{ mt: 3, color: '#FFD600', fontWeight: 700, letterSpacing: 2, animation: 'fadeIn 1.5s ease-in', textShadow: '0 0 8px #FFD600' }}>
        Fetching calendar events...
      </Typography>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </Box>
  );
  if (events.length === 0) return <Box sx={{ textAlign: 'center', color: 'var(--text-muted)', py: 4 }}>No events found.</Box>;

  // Prepare and sort events, only show today's upcoming/current events (skip past)
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const scheduledEvents = events
    .map((event, idx) => ({ ...event, index: idx, start: new Date(event.json?.startTime || event.start?.dateTime || event.start?.date), end: new Date(event.json?.endTime || event.end?.dateTime || event.end?.date) }))
    .filter(event => {
      // Only show events that are today and not ended yet
      return (
        event.start >= nowDate && event.start < tomorrowDate && event.end > now
      );
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Overlap detection
  for (let i = 0; i < scheduledEvents.length - 1; i++) {
    const currentEvent = scheduledEvents[i];
    const nextEvent = scheduledEvents[i + 1];
    if (nextEvent.start < currentEvent.end) {
      currentEvent.isOverlapped = true;
      nextEvent.isOverlapped = true;
    }
  }

  // Build timeline with gaps and animation
  let lastItemEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0); // Start at wake hour
  const timelineItems: any[] = [];
  scheduledEvents.forEach((event, idx) => {
    // Only show Free Time card before the first event if the current time is before that event
    if (idx === 0 && event.start > lastItemEndTime && event.start.getTime() - lastItemEndTime.getTime() > 60000 && now < event.start) {
      timelineItems.push(
        <AnimatePresence key={`gap-${idx}`}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            style={{ width: '100%' }}
          >
            <Card variant="outlined" className="gap-card" sx={{
              mb: 2,
              bgcolor: 'rgba(28,28,28,0.45)',
              borderStyle: 'dashed',
              borderColor: '#FFD600',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 4,
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
              maxWidth: 650,
              width: '100%',
              mx: 'auto',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 4,
            }}>
              <Box sx={{ color: '#39FF14', display: 'grid', placeItems: 'center', width: 56, height: 56 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ color: '#FFD600', fontWeight: 700, textShadow: '0 0 8px #FFD600' }}>Free Time</Typography>
                <Typography variant="body2" sx={{ color: '#39FF14', fontWeight: 900, fontSize: '1.1rem', textShadow: '0 0 8px #39FF14' }}>{Math.floor((event.start.getTime() - lastItemEndTime.getTime()) / 60000)} minutes available</Typography>
              </Box>
            </Card>
          </motion.div>
        </AnimatePresence>
      );
    }
    const isCurrent = now >= event.start && now < event.end;
    const isFuture = now < event.start;
    const isEndingSoon = isCurrent && (event.end.getTime() - now.getTime() <= 5000);
    timelineItems.push(
      <EventCard key={event.id || idx} event={event} />
    );
    lastItemEndTime = new Date(Math.max(lastItemEndTime.getTime(), event.end.getTime()));
  });

  // Header, time, progress, timeline, goals
  const stats = getDayStats(events);
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' }, mb: 1, color: 'var(--text)', textAlign: 'center', letterSpacing: 1, fontFamily: 'Barlow Semi Condensed, sans-serif' }}>
        Today's <span style={{ color: 'var(--accent)', textShadow: '0 0 10px var(--shadow)' }}>Schedule</span>
      </Typography>
      <Box sx={{ mb: 4, textAlign: 'center', width: '100%' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'var(--text)', letterSpacing: 1 }}>{format(now, 'hh:mm a')}</Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>{format(now, 'EEEE, MMMM d, yyyy')}</Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-muted)', mt: 2, fontStyle: 'italic' }}>
          Although a full day is 24 hours, your actual active day time is {stats.activeHours} hours ({stats.startStr} – {stats.endStr}).
        </Typography>
        <Box sx={{ mt: 2, width: '100%', maxWidth: 750, mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, mb: 1 }}>
            <span>{stats.percentOfDay.toFixed(2)}% Complete</span>
            <span>{stats.hoursLeft}h {stats.minsLeft}m Left</span>
          </Box>
          <Box sx={{ width: '100%', height: 8, bgcolor: 'var(--card-border)', borderRadius: 1, overflow: 'hidden', mb: 1 }}>
            <Box sx={{ height: 8, borderRadius: 1, bgcolor: 'var(--accent)', transition: 'width 1s linear', width: `${stats.percentOfDay}%` }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Day: <strong>{stats.dayOfYear}</strong> / {stats.daysInYear}</span>
            <span><strong>{stats.daysLeft}</strong> Days Remaining</span>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 750, width: '100%', mt: 2 }}>
        {timelineItems.length > 0 ? timelineItems : (
          <Box sx={{ width: '100%' }}>
            <Card variant="outlined" sx={{
              bgcolor: 'rgba(28,28,28,0.45)',
              borderColor: 'var(--card-border)',
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 4,
            }}>
              <Typography variant="h6" sx={{ color: 'var(--text)' }}>No more events for today.</Typography>
            </Card>
          </Box>
        )}
      </Box>
      <Card variant="outlined" sx={{
        maxWidth: 750,
        width: '100%',
        mt: 6,
        p: 3,
        borderRadius: 4,
        bgcolor: 'rgba(28,28,28,0.45)',
        borderColor: 'var(--card-border)',
        textAlign: 'center',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <Typography variant="h5" sx={{ color: 'var(--accent)', fontWeight: 700, mb: 1 }}>Achieve Your Goals 🎯</Typography>
        <Typography variant="body1" sx={{ color: 'var(--text)', lineHeight: 1.6, fontSize: '1rem' }}>
          Your schedule is your roadmap to success. Stay focused on one task at a time, take short 5-minute breaks between events, and celebrate your progress. Consistency is the key to achieving your long-term ambitions!
        </Typography>
      </Card>
    </Box>
  );
}
