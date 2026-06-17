import { ChevronDown, Clock3, Power, Trash2, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { getNotificationErrorMessage } from "./notificationApi";
import { buildFocusModeUrl } from "./webPushService";
import { useStudyReminders, weekDays } from "./useStudyReminders";

const defaultDays = [1, 2, 3, 4, 5];
const timeHours = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, "0"));
const timeMinutes = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, "0"));
const STUDY_REMINDER_COLLAPSED_KEY = "study-buddy:study-reminder-collapsed";

function parseTime(value: string) {
  const [rawHour = "20", rawMinute = "00"] = value.split(":");
  const hour = Number.isInteger(Number(rawHour)) ? rawHour.padStart(2, "0").slice(-2) : "20";
  const minute = Number.isInteger(Number(rawMinute)) ? rawMinute.padStart(2, "0").slice(-2) : "00";
  return {
    hour: timeHours.includes(hour) ? hour : "20",
    minute: timeMinutes.includes(minute) ? minute : "00",
  };
}

function clampIndex(index: number, length: number) {
  return (index + length) % length;
}

function WheelColumn({
  ariaLabel,
  label,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    const selectedNode = listRef.current?.querySelector<HTMLElement>(`[data-time-value="${value}"]`);
    selectedNode?.scrollIntoView({ block: "center" });
  }, [value]);

  function moveBy(offset: number) {
    onChange(options[clampIndex(selectedIndex + offset, options.length)]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveBy(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveBy(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      onChange(options[0]);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(options[options.length - 1]);
    }
  }

  return (
    <div className="min-w-0">
      <p className="text-center text-[11px] font-black uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <div className="relative mt-2 overflow-hidden rounded-xl bg-muted/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-9 bg-gradient-to-b from-card to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-9 bg-gradient-to-t from-card to-transparent" />
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-11 -translate-y-1/2 rounded-xl border border-primary/20 bg-primary/10" />
        <div
          aria-label={ariaLabel}
          className="relative z-20 h-[180px] snap-y snap-mandatory overflow-y-auto overscroll-contain px-2 py-[68px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onKeyDown={handleKeyDown}
          ref={listRef}
          role="listbox"
          tabIndex={0}
        >
          {options.map((option, index) => {
            const active = option === value;
            const distance = Math.abs(index - selectedIndex);
            return (
              <button
                aria-label={`${label} ${option}`}
                aria-selected={active}
                className={`mb-1 flex h-11 w-full snap-center items-center justify-center rounded-xl text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : distance === 1
                      ? "text-foreground/80 hover:bg-card"
                      : "text-muted-foreground/70 hover:bg-card hover:text-foreground"
                }`}
                data-time-value={option}
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
    </div>
  );
}

function TimePicker({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [draftTime, setDraftTime] = useState(value);
  const { hour, minute } = parseTime(value);
  const { hour: draftHour, minute: draftMinute } = parseTime(draftTime);

  function openPicker() {
    const rect = rootRef.current?.getBoundingClientRect();
    const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
    const spaceAbove = rect ? rect.top : 0;
    setOpenAbove(spaceBelow < 360 && spaceAbove > spaceBelow);
    setDraftTime(value);
    setIsOpen(true);
  }

  function cancelPicker() {
    setDraftTime(value);
    setIsOpen(false);
  }

  function confirmPicker() {
    const { hour: nextHour, minute: nextMinute } = parseTime(draftTime);
    onChange(`${nextHour}:${nextMinute}`);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        cancelPicker();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, value]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      cancelPicker();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      confirmPicker();
    }
  }

  return (
    <div className="relative mt-2" onKeyDown={handleKeyDown} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-label={`Chọn giờ nhắc học, hiện tại ${hour}:${minute}`}
        className="group flex h-14 w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-left shadow-sm outline-none transition hover:border-primary/60 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
        onClick={() => (isOpen ? cancelPicker() : openPicker())}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-primary transition group-hover:bg-primary/10">
            <Clock3 size={18} />
          </span>
          <span className="min-w-0 text-lg font-black tracking-normal text-foreground">
            {hour}:{minute}
          </span>
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition group-hover:bg-muted group-hover:text-foreground">
          <ChevronDown className={`transition duration-200 ${isOpen ? "rotate-180" : ""}`} size={18} />
        </span>
      </button>

      {isOpen ? (
        <div
          className={`fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200 sm:absolute sm:inset-x-auto sm:bottom-auto sm:w-[320px] sm:min-w-[280px] ${
            openAbove ? "sm:bottom-[calc(100%+0.5rem)] sm:top-auto" : "sm:top-[calc(100%+0.5rem)]"
          }`}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <WheelColumn
              ariaLabel="Danh sách giờ"
              label="Giờ"
              onChange={(nextHour) => setDraftTime(`${nextHour}:${draftMinute}`)}
              options={timeHours}
              value={draftHour}
            />
            <div className="pt-[104px] text-2xl font-black text-muted-foreground">:</div>
            <WheelColumn
              ariaLabel="Danh sách phút"
              label="Phút"
              onChange={(nextMinute) => setDraftTime(`${draftHour}:${nextMinute}`)}
              options={timeMinutes}
              value={draftMinute}
            />
          </div>

          <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-center text-sm font-bold text-muted-foreground">
            Thời gian đã chọn: <span className="text-foreground">{draftHour}:{draftMinute}</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              aria-label="Hủy chọn giờ"
              className="h-11 rounded-xl border border-border bg-card text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={cancelPicker}
              type="button"
            >
              Hủy
            </button>
            <button
              aria-label="Xác nhận giờ đã chọn"
              className="h-11 rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={confirmPicker}
              type="button"
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
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

export function StudyReminderSettings() {
  const { isLoading, message, reminders, removeReminder, saveReminder, setReminderEnabled, timezone } = useStudyReminders();
  const [reminderTime, setReminderTime] = useState("20:00");
  const [selectedDays, setSelectedDays] = useState<number[]>(defaultDays);
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const [isEnabled, setIsEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
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
  const enabledReminders = reminders.filter((reminder) => reminder.isEnabled);
  const statusLabel = isLoading
    ? "Đang tải lịch học"
    : enabledReminders.length
      ? `${enabledReminders.length} lịch đang bật`
      : reminders.length
        ? "Tất cả lịch đang tắt"
        : "Chưa có lịch học";

  useEffect(() => {
    window.localStorage.setItem(STUDY_REMINDER_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  function resetForm() {
    setEditingId(undefined);
    setReminderTime("20:00");
    setSelectedDays(defaultDays);
    setSelectedTimezone(timezone);
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
        timezone: selectedTimezone,
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
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
            <Clock3 size={19} />
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
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={() => setIsCollapsed((current) => !current)}
          type="button"
        >
          <ChevronDown className={`transition duration-200 ${isCollapsed ? "-rotate-90" : "rotate-0"}`} size={18} />
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isCollapsed ? "mt-0 max-h-0 opacity-0 pointer-events-none" : "mt-4 max-h-[2000px] opacity-100"
        }`}
      >
        {!isCollapsed ? (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-black text-foreground transition hover:bg-muted"
                onClick={previewReminder}
                type="button"
              >
                Xem thử nhắc học
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <label className="text-sm font-black text-foreground">
                  Giờ
                  <TimePicker onChange={setReminderTime} value={reminderTime} />
                </label>
                <label className="text-sm font-black text-foreground">
                  Timezone
                  <input className="auth-input mt-2 rounded-xl py-2.5" onChange={(event) => setSelectedTimezone(event.target.value)} value={selectedTimezone} />
                </label>
              </div>

              <div>
                <p className="text-sm font-black text-foreground">Ngày trong tuần</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const active = selectedDays.includes(day.id);
                    return (
                      <button
                        className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        type="button"
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-bold text-foreground">
                <input checked={isEnabled} className="h-4 w-4 accent-violet-600" onChange={(event) => setIsEnabled(event.target.checked)} type="checkbox" />
                Bật lịch nhắc này
              </label>

              {message ? <p className="rounded-lg bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">{message}</p> : null}

              <div className="flex flex-wrap gap-2">
                <button className="primary-button rounded-xl px-4 py-2 text-sm" disabled={isSaving || !selectedDays.length} type="submit">
                  {isSaving ? "Đang lưu..." : editingId ? "Cập nhật lịch" : "Lưu lịch nhắc"}
                </button>
                {editingId ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={resetForm}
                    type="button"
                  >
                    <X size={16} />
                    Đóng
                  </button>
                ) : null}
              </div>
              {formError ? <p className="text-xs font-bold text-muted-foreground">{formError}</p> : null}
            </form>

            <div className="mt-5 space-y-2">
              {isLoading ? <p className="text-sm font-semibold text-muted-foreground">Đang tải lịch...</p> : null}
              {reminders.map((reminder) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-3" key={reminder.id}>
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setEditingId(reminder.id);
                      setReminderTime(reminder.reminderTime);
                      setSelectedDays(reminder.daysOfWeek);
                      setSelectedTimezone(reminder.timezone);
                      setIsEnabled(reminder.isEnabled);
                      setFormError("");
                    }}
                    type="button"
                  >
                    <p className="font-black text-foreground">{reminder.reminderTime}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                      {reminder.daysOfWeek.map((day) => dayLabel.get(day)).join(", ")} · {reminder.isEnabled ? "Đang bật" : "Đã tắt"}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-black text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
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
                    <button className="grid h-9 w-9 place-items-center rounded-lg bg-card text-rose-600" onClick={() => removeReminder(reminder.id)} type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
