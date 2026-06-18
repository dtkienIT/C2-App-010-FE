import { Coins, Gift, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UnlockCelebrationModalProps = {
  cost: number;
  itemKind: "background" | "buddy" | "model";
  itemName: string;
  onClose: () => void;
  open: boolean;
  targetUrl: string;
};

const itemKindLabel = {
  background: "Background",
  buddy: "Buddy",
  model: "Model",
} as const;

export function UnlockCelebrationModal({
  cost,
  itemKind,
  itemName,
  onClose,
  open,
  targetUrl,
}: UnlockCelebrationModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100001] grid place-items-center bg-overlay/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="relative w-full max-w-[30rem] overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/95 p-5 text-card-foreground shadow-[0_26px_80px_rgba(15,23,42,0.22)] backdrop-blur-2xl transition-colors sm:p-6 dark:shadow-[0_28px_80px_rgba(2,6,23,0.4)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%)]" />

        <button
          aria-label="Đóng chúc mừng"
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-card/88 text-muted-foreground shadow-sm transition hover:border-primary/20 hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          <X size={16} />
        </button>

        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.35rem] bg-gradient-to-br from-amber-400 via-orange-400 to-rose-500 text-white shadow-[0_14px_32px_rgba(249,115,22,0.24)]">
              <Gift size={24} />
            </div>

            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                Mở khóa thành công
              </p>
              <h2 className="mt-2 text-[1.55rem] font-black leading-[1.15] text-foreground sm:text-[1.8rem]">
                Chúc mừng! Bạn đã sở hữu {itemName}
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-[38ch] text-[0.95rem] font-semibold leading-6 text-muted-foreground">
            {itemKindLabel[itemKind]} mới đã được thêm vào tài khoản của bạn. Thông báo này cũng đã được lưu trên header để bạn có thể xem lại bất cứ lúc nào.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-border/75 bg-muted/55 px-4 py-3.5 shadow-sm backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Vật phẩm
              </p>
              <div className="mt-2 flex items-center gap-2.5 text-foreground">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/12 text-amber-500 dark:bg-amber-400/16 dark:text-amber-300">
                  <Sparkles size={16} />
                </div>
                <span className="text-[0.98rem] font-black leading-5">{itemName}</span>
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-border/75 bg-muted/55 px-4 py-3.5 shadow-sm backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                Chi phí
              </p>
              <div className="mt-2 flex items-center gap-2.5 text-foreground">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/12 text-sky-500 dark:bg-sky-400/16 dark:text-sky-300">
                  <Coins size={16} />
                </div>
                <span className="text-[0.98rem] font-black leading-5">{cost} xu</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              className="primary-button h-12 rounded-2xl px-5 text-sm font-black"
              onClick={() => {
                onClose();
                navigate(targetUrl);
              }}
              type="button"
            >
              Dùng ngay
            </button>
            <button
              className="secondary-button h-12 rounded-2xl px-5 text-sm font-black"
              onClick={onClose}
              type="button"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
