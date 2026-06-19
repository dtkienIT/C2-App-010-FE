import { CalendarClock, Check, ChevronDown, Clock3, Power, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getNotificationErrorMessage } from "./notificationApi";
import { buildFocusModeUrl } from "./webPushService";
import { useStudyReminders, weekDays } from "./useStudyReminders";

const defaultDays = [1, 3, 5];
const STUDY_REMINDER_COLLAPSED_KEY = "study-buddy:study-reminder-collapsed";
const dayOptions = [
  { id: 1, label: "T2" },
  { id: 2, label: "T3" },
  { id: 3, label: "T4" },
  { id: 4, label: "T5" },
  { id: 5, label: "T6" },
  { id: 6, label: "T7" },
  { id: 7, label: "CN" },
];
const pickerHours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const pickerMinutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function parseTime(value: string) {
  const [rawHour = "20", rawMinute = "00"] = value.split(":");
  const hour24 = Math.min(23, Math.max(0, Number(rawHour) || 20));
  const minute = Math.min(59, Math.max(0, Number(rawMinute) || 0));
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12Number = hour24 % 12 || 12;

  return {
    hour12: String(hour12Number).padStart(2, "0"),
    hour24: String(hour24).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    period,
  };
}

function to24HourTime(hour12: string, minute: string, period: "AM" | "PM") {
  let hour = Number(hour12);
  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function dispatchInAppReminder(reminderId: string) {
  const targetUrl = buildFocusModeUrl(reminderId);
  window.dispatchEvent(
    new CustomEvent("study-buddy:in-app-notification", {
      detail: {
        body: "Buddy đang chờ bạn. Bắt đầu một phiên tập trung ngắn nhé!",
        reminderId,
        targetUrl,
        title: "Đến giờ học rồi!",
      },
    }),
  );
}

function TimeWheel({
  onChange,
  options,
  value,
  widthClassName = "w-[54px]",
}: {
  onChange: (value: string) => void;
  options: string[];
  value: string;
  widthClassName?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);
  const itemHeight = 32;
  const selectedIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: selectedIndex * itemHeight, behavior: "smooth" });
  }, [selectedIndex]);

  function handleScroll() {
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = window.setTimeout(() => {
      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      const nextIndex = Math.min(options.length - 1, Math.max(0, Math.round(scrollTop / itemHeight)));
      const nextValue = options[nextIndex];
      if (nextValue && nextValue !== value) {
        onChange(nextValue);
      }
    }, 80);
  }

  return (
    <div className={`relative h-40 shrink-0 overflow-hidden ${widthClassName}`}>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-8 -translate-y-1/2 rounded-xl bg-primary/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-9 bg-gradient-to-b from-card via-card/95 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-9 bg-gradient-to-t from-card via-card/95 to-transparent" />
      <div
        className="relative z-20 h-full snap-y snap-mandatory overflow-y-auto overscroll-contain py-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={handleScroll}
        ref={scrollRef}
      >
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              aria-pressed={active}
              className={`grid h-8 w-full snap-center place-items-center rounded-xl text-[14px] font-black transition ${
                active ? "text-primary" : "text-muted-foreground/80 hover:text-foreground"
              }`}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimePickerDialog({
  onClose,
  onConfirm,
  value,
}: {
  onClose: () => void;
  onConfirm: (value: string) => void;
  value: string;
}) {
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  return (
    <div className="fixed inset-0 z-[100000] grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-[318px] overflow-hidden rounded-[18px] border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="w-10" />
          <h3 className="py-4 text-[13px] font-black text-foreground">Chọn giờ nhắc</h3>
          <button
            aria-label="Đóng"
            className="mr-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative mx-auto grid w-[232px] grid-cols-[54px_18px_54px_64px] items-center gap-2 pb-4">
          <TimeWheel onChange={setHour} options={pickerHours} value={hour} />
          <div className="relative z-30 grid h-40 place-items-center text-lg font-black text-muted-foreground">:</div>
          <TimeWheel onChange={setMinute} options={pickerMinutes} value={minute} />
          <TimeWheel
            onChange={(nextPeriod) => setPeriod(nextPeriod as "AM" | "PM")}
            options={["AM", "PM"]}
            value={period}
            widthClassName="w-16"
          />
        </div>

        <div className="grid grid-cols-[1fr_1.45fr] gap-3 border-t border-border bg-card px-3 py-3">
          <button className="h-11 rounded-xl text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground" onClick={onClose} type="button">
            Hủy
          </button>
          <button
            className="h-11 rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_24px_rgba(124,58,237,0.25)] transition hover:brightness-110"
            onClick={() => onConfirm(to24HourTime(hour, minute, period))}
            type="button"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudyReminderSettings() {
  const { isLoading, message, reminders, removeReminder, saveReminder, setReminderEnabled, timezone } = useStudyReminders();
  const [reminderTime, setReminderTime] = useState("20:00");
  const [selectedDays, setSelectedDays] = useState<number[]>(defaultDays);
  const [isEnabled, setIsEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STUDY_REMINDER_COLLAPSED_KEY) === "true";
  });

  useEffect(() => {
    const timers = reminders
      .filter((reminder) => reminder.isEnabled && reminder.nextRunAt)
      .map((reminder) => {
        const delay = new Date(reminder.nextRunAt).getTime() - Date.now();
        if (delay < 0 || delay > 60 * 60 * 1000) return null;
        return window.setTimeout(() => dispatchInAppReminder(reminder.id), delay);
      })
      .filter((timer): timer is number => timer !== null);
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reminders]);

  const dayLabel = useMemo(() => new Map(weekDays.map((day) => [day.id, day.label])), []);
  const selectedDayText = selectedDays.map((day) => dayLabel.get(day)).filter(Boolean).join(", ");
  const enabledReminders = reminders.filter((reminder) => reminder.isEnabled);
  const statusLabel = isLoading
    ? "Đang tải lịch học"
    : enabledReminders.length
      ? `${enabledReminders.length} lịch đang bật`
      : reminders.length
        ? "Tất cả lịch đang tắt"
        : "Chưa có lịch học";
  const parsedTime = parseTime(reminderTime);

  useEffect(() => {
    window.localStorage.setItem(STUDY_REMINDER_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  function resetForm() {
    setEditingId(undefined);
    setReminderTime("20:00");
    setSelectedDays(defaultDays);
    setIsEnabled(true);
    setFormError("");
  }

  function previewReminder() {
    const previewReminderId = editingId || reminders.find((reminder) => reminder.isEnabled)?.id || reminders[0]?.id;
    if (previewReminderId) {
      dispatchInAppReminder(previewReminderId);
      return;
    }

    const targetUrl = buildFocusModeUrl(`preview-${Date.now()}`);
    window.dispatchEvent(
      new CustomEvent("study-buddy:in-app-notification", {
        detail: {
          body: "Buddy đang chờ bạn. Bắt đầu một phiên tập trung ngắn nhé!",
          targetUrl,
          title: "Đến giờ học rồi!",
        },
      }),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      await saveReminder({
        daysOfWeek: selectedDays,
        isEnabled,
        reminderId: editingId,
        reminderTime,
        timezone,
      });
      resetForm();
    } catch (error) {
      setFormError(getNotificationErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function toggleDay(day: number) {
    setSelectedDays((current) => {
      if (current.includes(day)) return current.filter((item) => item !== day);
      return [...current, day].sort((a, b) => a - b);
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-4 shadow-soft backdrop-blur" data-onboarding="reminders-settings">
      {isTimePickerOpen ? (
        <TimePickerDialog
          onClose={() => setIsTimePickerOpen(false)}
          onConfirm={(nextTime) => {
            setReminderTime(nextTime);
            setIsTimePickerOpen(false);
          }}
          value={reminderTime}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarClock size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Lịch học</p>
            <h2 className="text-lg font-black text-foreground">Nhắc vào giờ học</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{statusLabel}</p>
          </div>
        </div>
        <button
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? "Mở rộng lịch học" : "Thu gọn lịch học"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={() => setIsCollapsed((current) => !current)}
          type="button"
        >
          <ChevronDown className={`transition duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`} size={18} />
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isCollapsed ? "mt-0 max-h-0 opacity-0 pointer-events-none" : "mt-5 max-h-[2000px] opacity-100"
        }`}
      >
        {!isCollapsed ? (
          <>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <p className="text-base font-black text-foreground">Ngày học</p>
                <div className="mt-3 grid grid-cols-4 gap-4">
                  {dayOptions.map((day) => {
                    const active = selectedDays.includes(day.id);
                    return (
                      <button
                        aria-pressed={active}
                        className={`relative grid aspect-square min-h-14 place-items-center rounded-xl border text-sm font-black transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_26px_rgba(124,58,237,0.24)]"
                            : "border-border bg-card text-foreground shadow-sm hover:border-primary/40"
                        }`}
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        type="button"
                      >
                        {active ? (
                          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        ) : null}
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm font-black text-primary">Đã chọn: {selectedDayText || "Chưa chọn ngày"}</p>
              </div>

              <div>
                <p className="text-base font-black text-foreground">Giờ nhắc</p>
                <button
                  aria-label="Chọn giờ nhắc"
                  className="mt-3 flex h-[78px] w-full items-center gap-4 rounded-2xl border border-border bg-card px-5 text-left shadow-sm transition hover:border-primary/45 focus-visible:ring-4 focus-visible:ring-primary/15"
                  onClick={() => setIsTimePickerOpen(true)}
                  type="button"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary">
                    <Clock3 size={32} />
                  </span>
                  <span className="min-w-0 flex-1 text-3xl font-black tracking-normal text-foreground">
                    {parsedTime.hour12} : {parsedTime.minute}
                  </span>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-2 text-sm font-black text-primary">{parsedTime.period}</span>
                  <ChevronDown className="text-muted-foreground" size={20} />
                </button>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/70 px-4 py-3 text-sm font-bold text-foreground">
                <span>Bật lịch nhắc này</span>
                <input checked={isEnabled} className="h-5 w-5 accent-violet-600" onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
              </label>

              {message ? <p className="rounded-lg bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">{message}</p> : null}

              <button className="primary-button h-14 w-full rounded-xl text-base disabled:cursor-not-allowed disabled:opacity-55" disabled={isSaving || !selectedDays.length} type="submit">
                <CalendarClock size={22} />
                {isSaving ? "Đang lưu..." : editingId ? "Cập nhật lịch" : "Lưu lịch nhắc"}
              </button>

              {editingId ? (
                <button
                  className="secondary-button w-full rounded-xl py-3 text-sm"
                  onClick={resetForm}
                  type="button"
                >
                  <X size={16} />
                  Đóng
                </button>
              ) : null}
              {formError ? <p className="text-xs font-bold text-muted-foreground">{formError}</p> : null}
            </form>

            <div className="mt-5 space-y-2">
              {isLoading ? <p className="text-sm font-semibold text-muted-foreground">Đang tải lịch...</p> : null}
              {reminders.map((reminder) => (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/75 bg-background/75 px-3 py-3 transition hover:border-primary/30" key={reminder.id}>
                  <button
                    className="min-w-0 flex-1 rounded-xl px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    onClick={() => {
                      setEditingId(reminder.id);
                      setReminderTime(reminder.reminderTime);
                      setSelectedDays(reminder.daysOfWeek);
                      setIsEnabled(reminder.isEnabled);
                      setFormError("");
                    }}
                    type="button"
                  >
                    <p className="text-lg font-black leading-none text-foreground">{reminder.reminderTime}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                      {reminder.daysOfWeek.map((day) => dayLabel.get(day)).join(", ")} · {reminder.isEnabled ? "Đang bật" : "Đã tắt"}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={pendingToggleId === reminder.id}
                      onClick={async () => {
                        try {
                          setPendingToggleId(reminder.id);
                          await setReminderEnabled(reminder.id, !reminder.isEnabled);
                          if (editingId === reminder.id) {
                            setIsEnabled(!reminder.isEnabled);
                          }
                        } finally {
                          setPendingToggleId((current) => (current === reminder.id ? null : current));
                        }
                      }}
                      type="button"
                    >
                      <Power size={14} />
                      {pendingToggleId === reminder.id ? "Đang lưu..." : reminder.isEnabled ? "Tắt" : "Bật"}
                    </button>
                    <button className="grid h-9 w-9 place-items-center rounded-xl bg-card text-rose-600 transition hover:bg-rose-50" onClick={() => removeReminder(reminder.id)} type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-4 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-black text-foreground transition hover:bg-background" onClick={previewReminder} type="button">
              Xem thử nhắc học
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
