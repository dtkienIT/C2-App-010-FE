import { Bell, BellOff, CheckCircle2, RefreshCw } from "lucide-react";
import { usePushSubscription } from "./usePushSubscription";

export function NotificationPermissionCard() {
  const { isLoading, message, refresh, requestAndRegister, state } = usePushSubscription();

  if (state === "disabled_by_config") {
    return null;
  }

  const statusCopy = {
    default: "Bật nhắc lịch học để Buddy gọi bạn vào đúng giờ.",
    denied: "Trình duyệt đang chặn thông báo. Hãy bật lại trong phần cài đặt site.",
    granted: "Quyền thông báo đã được cấp. Hoàn tất đăng ký để nhận nhắc lịch học.",
    registered: "Đã bật nhắc lịch học trên trình duyệt này.",
    registration_error: "Chưa đăng ký được thông báo. Bạn có thể thử lại.",
    unsupported: "Trình duyệt này chưa hỗ trợ Web Push. App vẫn dùng được bình thường.",
  }[state];

  const canRequest = state === "default" || state === "registration_error" || state === "granted";

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
          {state === "denied" || state === "unsupported" ? <BellOff size={19} /> : state === "registered" ? <CheckCircle2 size={19} /> : <Bell size={19} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Nhắc lịch học</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-foreground">{statusCopy}</p>
          {message ? <p className="mt-2 text-xs font-bold text-rose-600">{message}</p> : null}
          {canRequest ? (
            <button className="primary-button mt-3 rounded-xl px-4 py-2 text-sm" disabled={isLoading} onClick={requestAndRegister} type="button">
              {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Bell size={16} />}
              Bật nhắc lịch học
            </button>
          ) : state === "registered" ? (
            <button className="secondary-button mt-3 rounded-xl px-4 py-2 text-sm" disabled={isLoading} onClick={refresh} type="button">
              <RefreshCw size={16} />
              Kiểm tra lại
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
