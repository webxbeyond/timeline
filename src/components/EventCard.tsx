'use client';

import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function formatElapsed(ms: number) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function EventCard({ event, now }: { event: any, now?: Date }) {
  const start = event.start?.dateTime || event.start?.date || event.json?.startTime;
  const end = event.end?.dateTime || event.end?.date || event.json?.endTime;
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  const validStart = startDate && !isNaN(startDate.getTime());
  const validEnd = endDate && !isNaN(endDate.getTime());

  const currentTime = now || new Date();
  let isCurrent = false;
  let percent = 0;
  let elapsedMs = 0;
  let remainingMs = 0;
  let remainingText = '';
  let durationMin = 0;

  if (validStart && validEnd) {
    const total = endDate!.getTime() - startDate!.getTime();
    durationMin = Math.round(total / 60000);
    isCurrent = currentTime >= startDate! && currentTime < endDate!;

    if (isCurrent) {
      elapsedMs = currentTime.getTime() - startDate!.getTime();
      percent = Math.min((elapsedMs / total) * 100, 100);
      remainingMs = endDate!.getTime() - currentTime.getTime();
      const h = Math.floor(remainingMs / 3600000);
      const m = Math.floor((remainingMs % 3600000) / 60000);
      const s = Math.floor((remainingMs % 60000) / 1000);
      remainingText = `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  const title = event.summary || event.json?.title || 'Untitled Event';
  const location = event.location || event.json?.location;
  const borderColor = isCurrent ? 'var(--accent)' : 'var(--card-border)';
  const textColor = isCurrent ? 'var(--accent)' : 'var(--text)';
  const progressCircumference = 2 * Math.PI * 16;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      whileHover={{
        scale: 1.03,
        boxShadow: isCurrent ? `0 0 24px var(--accent)` : `0 8px 32px var(--shadow)`,
        borderColor,
      }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
      style={{ cursor: 'pointer' }}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          background: 'var(--card-bg)',
          borderColor,
          p: 3,
          mb: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          boxShadow: isCurrent ? '0 0 24px var(--accent)' : undefined,
        }}
      >
        {isCurrent && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              borderRadius: '16px',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}
          />
        )}

        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Time */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Icon icon="solar:calendar-line-duotone" width={20} height={20} />
              <Typography variant="body2">
                {validStart && validEnd
                  ? `${format(startDate!, 'HH:mm')} → ${format(endDate!, 'HH:mm')} (${durationMin} min)`
                  : 'All day'}
              </Typography>
            </Stack>
          </Stack>

          {/* Title, Elapsed, Countdown */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mt={1}>
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: textColor, display: 'flex', alignItems: 'center', gap: 1 }}
                title={title}
              >
                <Icon icon="solar:pin-line-duotone" width={20} height={20} style={{ color: 'var(--text-muted)' }} />
                {title}
              </Typography>

              {isCurrent && (
                <Typography
                  variant="body2"
                  fontWeight={600}
                  mt={0.5}
                  sx={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Icon icon="solar:clock-circle-line-duotone" width={16} height={16} />
                  Elapsed: {formatElapsed(elapsedMs)}
                </Typography>
              )}
            </Box>

            {isCurrent && (
              <Stack direction="row" alignItems="center" spacing={2}>
                {/* Progress Circle */}
                <Box sx={{ position: 'relative', width: 56, height: 56 }}>
                  <svg viewBox="0 0 36 36" width="56" height="56">
                    <circle cx="18" cy="18" r="16" stroke="var(--bg)" strokeWidth="4" fill="none" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      stroke="var(--accent)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      transform="rotate(-90 18 18)"
                      strokeDasharray={progressCircumference}
                      strokeDashoffset={progressCircumference - (percent / 100) * progressCircumference}
                    />
                  </svg>
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                      color: 'var(--accent)',
                    }}
                    aria-label={`${Math.round(percent)}% completed`}
                  >
                    {Math.round(percent)}%
                  </Box>
                </Box>

                {/* Countdown */}
                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 800,
                    fontSize: '2rem',
                    letterSpacing: 1,
                    color: 'var(--accent)',
                  }}
                >
                  <Icon icon="solar:hourglass-line-duotone" width={20} height={20} />
                  {remainingText}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Location */}
          {location && (
            <Stack direction="row" alignItems="center" spacing={1} mt={1} sx={{ color: 'var(--text-muted)' }}>
              <Icon icon="solar:map-point-line-duotone" width={20} height={20} />
              <Typography
                variant="body2"
                noWrap
                title={location}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {location}
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
