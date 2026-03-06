"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  durationMinutes: number;
  status: string;
  studentName: string;
  tutorName: string;
  subject: string | null;
  tutorColor?: string;
}

interface BookableStudent {
  id: string;
  name: string;
  jobId: string | null;
  tutorId: string | null;
}

interface CalendarWidgetProps {
  lessons: Lesson[];
  canBook?: boolean;
  role: string;
  bookableStudents?: BookableStudent[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TUTOR_COLORS = [
  "#06A5FF",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#ef4444",
  "#6366f1",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Time slots 8 AM to 8 PM
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtHour(h: number): string {
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display} ${suffix}`;
}

function fmtTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// ─── Booking Form (inline) ──────────────────────────────────────────────────────

interface BookingFormProps {
  defaultDate: string;
  bookableStudents: BookableStudent[];
  onClose: () => void;
  onBooked: () => void;
}

function BookingForm({ defaultDate, bookableStudents, onClose, onBooked }: BookingFormProps) {
  const [studentId, setStudentId] = useState(bookableStudents[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("16:00");
  const [duration, setDuration] = useState("60");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedStudent = bookableStudents.find((s) => s.id === studentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) {
      setError("Please select a student.");
      return;
    }
    if (!selectedStudent?.jobId) {
      setError("This student has no active job. Ask an admin to create one first.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          jobId: selectedStudent.jobId,
          tutorId: selectedStudent.tutorId ?? undefined,
          date,
          startTime,
          durationMinutes: Number(duration),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Failed to book session.");
        return;
      }
      onBooked();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-800">Book Session</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Student</label>
            {bookableStudents.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No students available to book.</p>
            ) : (
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal bg-white"
              >
                {bookableStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-btn text-sm outline-none focus:border-teal bg-white"
            >
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-[6px]">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || bookableStudents.length === 0}
              className="px-5 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-btn transition-colors disabled:opacity-60"
            >
              {submitting ? "Booking…" : "Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function CalendarWidget({ lessons, canBook = false, role: _role, bookableStudents = [] }: CalendarWidgetProps) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [view, setView] = useState<"month" | "week">("month");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingRefreshKey, setBookingRefreshKey] = useState(0);

  // Build tutor color map (sequential assignment)
  const tutorColorMap = useMemo(() => {
    const tutors = Array.from(new Set(lessons.map((l) => l.tutorName))).sort();
    const map = new Map<string, string>();
    tutors.forEach((tutor, i) => {
      map.set(tutor, TUTOR_COLORS[i % TUTOR_COLORS.length]);
    });
    return map;
  }, [lessons]);

  function getLessonColor(lesson: Lesson): string {
    if (lesson.tutorColor) return lesson.tutorColor;
    return tutorColorMap.get(lesson.tutorName) ?? TUTOR_COLORS[0];
  }

  // Group lessons by date for fast lookups
  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    }
    return map;
  }, [lessons]);

  const selectedLessons = lessonsByDate.get(selectedDate) ?? [];

  // ── Navigation ────────────────────────────────────────────────────────────────

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  }

  function prevPeriod() {
    if (view === "month") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else {
      // Week: go back 7 days from selectedDate
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() - 7);
      setSelectedDate(toDateStr(d));
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  }

  function nextPeriod() {
    if (view === "month") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else {
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() + 7);
      setSelectedDate(toDateStr(d));
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  }

  // ── Month View Cells ──────────────────────────────────────────────────────────

  const monthCells = useMemo(() => {
    // First day of month
    const first = new Date(currentYear, currentMonth, 1);
    const startOffset = first.getDay(); // 0=Sun
    const cells: Array<{ dateStr: string; inMonth: boolean }> = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(currentYear, currentMonth, 1 - startOffset + i);
      cells.push({
        dateStr: toDateStr(d),
        inMonth: d.getMonth() === currentMonth,
      });
    }
    return cells;
  }, [currentYear, currentMonth]);

  // ── Week View ─────────────────────────────────────────────────────────────────

  const weekDates = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return getWeekDates(d);
  }, [selectedDate]);

  // Parse "HH:MM" to fractional hour offset from 8
  function timeToRow(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return (h - 8) + m / 60;
  }

  function durationToRows(minutes: number): number {
    return minutes / 60;
  }

  // ── Day Panel ─────────────────────────────────────────────────────────────────

  const ROW_HEIGHT = 56; // px per hour row in week view

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-gray-100 text-gray-600 text-sm"
            aria-label="Previous"
          >
            ‹
          </button>
          <h3 className="text-sm font-bold text-gray-800 min-w-[140px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
          <button
            type="button"
            onClick={nextPeriod}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-gray-100 text-gray-600 text-sm"
            aria-label="Next"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-[6px] hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex border border-gray-200 rounded-[6px] overflow-hidden">
            <button
              type="button"
              onClick={() => setView("month")}
              className={[
                "px-3 py-1.5 text-xs font-semibold transition-colors",
                view === "month"
                  ? "bg-teal text-white"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={[
                "px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200",
                view === "week"
                  ? "bg-teal text-white"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* ── Month View ── */}
      {view === "month" && (
        <div className="p-4">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-btn overflow-hidden">
            {monthCells.map(({ dateStr, inMonth }) => {
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayLessons = lessonsByDate.get(dateStr) ?? [];
              const dayNum = parseInt(dateStr.split("-")[2], 10);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={[
                    "bg-white min-h-[52px] p-1 text-left flex flex-col items-center hover:bg-gray-50 transition-colors",
                    !inMonth && "opacity-30",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-0.5",
                      isToday
                        ? "bg-teal text-white"
                        : isSelected
                        ? "ring-2 ring-teal text-teal"
                        : "text-gray-700",
                    ].join(" ")}
                  >
                    {dayNum}
                  </span>
                  {/* Lesson dots */}
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayLessons.slice(0, 3).map((l, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getLessonColor(l) }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Week View ── */}
      {view === "week" && (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Week header: day names + dates */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200">
              <div /> {/* time gutter */}
              {weekDates.map((d) => {
                const ds = toDateStr(d);
                const isToday = ds === todayStr;
                return (
                  <button
                    key={ds}
                    type="button"
                    onClick={() => setSelectedDate(ds)}
                    className="py-2 text-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      {DAY_LABELS[d.getDay()]}
                    </span>
                    <span
                      className={[
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5",
                        isToday
                          ? "bg-teal text-white"
                          : ds === selectedDate
                          ? "ring-2 ring-teal text-teal"
                          : "text-gray-700",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}>
              {/* Hour rows */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-gray-100 flex"
                  style={{ top: `${(h - 8) * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                >
                  <div className="w-[56px] shrink-0 pr-2 text-right text-[10px] text-gray-400 -mt-2">
                    {fmtHour(h)}
                  </div>
                  {/* Clickable day columns */}
                  {weekDates.map((d) => {
                    const ds = toDateStr(d);
                    return (
                      <div
                        key={ds}
                        className="flex-1 border-l border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedDate(ds);
                          if (canBook) setShowBooking(true);
                        }}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Lesson blocks */}
              {lessons
                .filter((l) => {
                  const weekDateStrs = weekDates.map(toDateStr);
                  return weekDateStrs.includes(l.date);
                })
                .map((l) => {
                  const colIndex = weekDates.findIndex((d) => toDateStr(d) === l.date);
                  if (colIndex === -1) return null;

                  const topOffset = timeToRow(l.startTime) * ROW_HEIGHT;
                  const heightPx = durationToRows(l.durationMinutes) * ROW_HEIGHT;
                  const color = getLessonColor(l);

                  // Column position: gutter=56px, each col is 1/7 of remaining
                  const colWidthPct = (1 / 7) * 100;
                  const leftPct = (colIndex / 7) * 100;

                  return (
                    <div
                      key={l.id}
                      className="absolute rounded-[4px] px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        top: `${topOffset}px`,
                        height: `${Math.max(heightPx, 20)}px`,
                        left: `calc(56px + ${leftPct}%)`,
                        width: `calc(${colWidthPct}% - 4px)`,
                        backgroundColor: color + "33",
                        borderLeft: `3px solid ${color}`,
                      }}
                      title={`${l.studentName} · ${fmtTime12(l.startTime)} · ${l.durationMinutes}min`}
                      onClick={() => setSelectedDate(l.date)}
                    >
                      <p className="text-[10px] font-semibold truncate" style={{ color }}>
                        {l.studentName}
                      </p>
                      {heightPx > 30 && (
                        <p className="text-[9px] text-gray-500 truncate">
                          {fmtTime12(l.startTime)}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── Day Panel ── */}
      <div className="border-t border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-800">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-CA", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h4>
          {canBook && (
            <button
              type="button"
              onClick={() => setShowBooking(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded-[6px] transition-colors"
            >
              <span>＋</span> Book Session
            </button>
          )}
        </div>

        {selectedLessons.length === 0 ? (
          <p className="text-sm text-gray-400 py-3 text-center">
            No sessions scheduled for this day.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedLessons.map((l) => {
              const color = getLessonColor(l);
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-3 p-3 rounded-btn border border-gray-100 hover:border-gray-200 transition-colors"
                  style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                >
                  {/* Time */}
                  <div className="shrink-0 text-center">
                    <p className="text-xs font-bold text-gray-700">
                      {fmtTime12(l.startTime)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {l.durationMinutes}min
                    </p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {l.studentName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[l.subject, l.tutorName].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {/* Status + Join */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge status={l.status} />
                    {l.status === "scheduled" && (
                      <button
                        type="button"
                        className="px-2.5 py-1 text-[11px] font-semibold bg-teal hover:bg-teal-dark text-white rounded-[5px] transition-colors"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking form modal */}
      {showBooking && (
        <BookingForm
          defaultDate={selectedDate}
          bookableStudents={bookableStudents}
          onClose={() => setShowBooking(false)}
          onBooked={() => {
            setShowBooking(false);
            setBookingRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Hidden element to silence unused variable warning */}
      <span className="hidden" data-refresh={bookingRefreshKey} />
    </div>
  );
}

export default CalendarWidget;
