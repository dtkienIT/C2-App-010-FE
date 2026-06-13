import { MessageCircleHeart, Sparkles, Target, Trophy } from "lucide-react";
import type { BuddyRoomDialoguePayload } from "./useOwner2BuddyRoomExperience";

type BuddyDialogueCardProps = {
  dialogue: BuddyRoomDialoguePayload;
};

const toneTheme = {
  care: {
    chip: "Cham nhe",
    icon: MessageCircleHeart,
    iconSurface: "warning-soft text-orange-700 dark:text-orange-200",
  },
  celebrate: {
    chip: "Tien bo",
    icon: Trophy,
    iconSurface: "primary-soft text-brand-700 dark:text-violet-200",
  },
  focus: {
    chip: "Tap trung",
    icon: Target,
    iconSurface: "soft-tile text-sky-700 dark:text-sky-200",
  },
  gentle: {
    chip: "Dong hanh",
    icon: Sparkles,
    iconSurface: "soft-tile text-violet-700 dark:text-violet-200",
  },
} as const;

export function BuddyDialogueCard({ dialogue }: BuddyDialogueCardProps) {
  const theme = toneTheme[dialogue.tone];
  const Icon = theme.icon;

  return (
    <section className="app-card p-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${theme.iconSurface}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">AI buddy</span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-foreground">
              {theme.chip}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
              {dialogue.source}
            </span>
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-foreground">{dialogue.text}</p>
          {dialogue.ctaLabel ? (
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Goi y: {dialogue.ctaLabel}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
