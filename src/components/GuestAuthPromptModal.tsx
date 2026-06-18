import { LogIn, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type GuestAuthPromptModalProps = {
  description?: string;
  feature?: string;
  onClose: () => void;
};

export function GuestAuthPromptModal({ description, feature, onClose }: GuestAuthPromptModalProps) {
  const navigate = useNavigate();
  const bodyText =
    description ??
    `Bạn cần đăng nhập hoặc nâng cấp Guest Pass để sử dụng tính năng ${feature ?? "này"}. Guest Pass hiện chỉ dùng để xem danh sách Buddy.`;

  function goToProfile() {
    onClose();
    navigate("/profile");
  }

  function goToAuth() {
    onClose();
    navigate("/auth");
  }

  return (
    <div aria-modal="true" className="fixed inset-0 z-[100000] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm" role="dialog">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card p-5 text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Cần đăng nhập</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Tính năng dành cho tài khoản</h2>
          </div>
          <button
            aria-label="Đóng thông báo"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">{bodyText}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button className="primary-button justify-center" onClick={goToProfile} type="button">
            <LogIn size={18} />
            Nâng cấp Guest Pass
          </button>
          <button className="secondary-button justify-center" onClick={goToAuth} type="button">
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
