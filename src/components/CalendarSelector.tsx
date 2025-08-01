"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from 'framer-motion';

export type Calendar = {
  id: string;
  summary: string;
  accessRole: string;
  selected: boolean;
};

interface Props {
  calendars: Calendar[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

export default function CalendarSelector({ calendars, selectedIds, onChange, onClose }: Props) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSelected(selectedIds);
  }, [selectedIds]);

  // Click-away and Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onChange(localSelected);
        localStorage.setItem("selectedCalendarIds", JSON.stringify(localSelected));
        if (typeof onClose === 'function') onClose();
      }
    }
    function handleClickAway(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onChange(localSelected);
        localStorage.setItem("selectedCalendarIds", JSON.stringify(localSelected));
        if (typeof onClose === 'function') onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickAway);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickAway);
    };
  }, [localSelected, onChange, onClose]);


  const handleToggle = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
      className="mb-6 p-4 rounded-xl border shadow-lg"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--accent)' }}>Select Calendars</h2>
      <div className="flex flex-col gap-3">
        {calendars.map((cal, idx) => (
          <motion.label
            key={cal.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
              scale: 1.04,
              boxShadow: localSelected.includes(cal.id)
                ? '0 4px 16px var(--accent-glow)'
                : '0 2px 8px var(--shadow)',
              borderColor: localSelected.includes(cal.id)
                ? 'var(--accent)'
                : 'var(--card-border)'
            }}
            transition={{ duration: 0.3, delay: idx * 0.05, type: 'spring', stiffness: 120 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition border`}
            style={{
              background: localSelected.includes(cal.id) ? 'var(--card-bg)' : 'var(--bg)',
              borderColor: localSelected.includes(cal.id) ? 'var(--accent)' : 'var(--card-border)'
            }}
          >
            <input
              type="checkbox"
              checked={localSelected.includes(cal.id)}
              onChange={() => handleToggle(cal.id)}
              disabled={cal.accessRole === "none"}
            />
            <span className={`font-medium ${
              localSelected.includes(cal.id)
                ? 'font-medium'
                : 'font-medium'
            }`} style={{ color: localSelected.includes(cal.id) ? 'var(--accent)' : 'var(--text)' }}>
              {cal.summary}
            </span>
          </motion.label>
        ))}
      </div>
    </motion.div>
  );
}
