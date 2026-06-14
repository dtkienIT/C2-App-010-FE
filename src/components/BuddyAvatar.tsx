type BuddyVariant = "miu" | "lumi" | "owly" | "nova" | "ivy" | "tree" | "chasam";

type BuddyAvatarProps = {
  emoji?: string;
  fallbackImage?: string;
  gradient?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: BuddyVariant;
  className?: string;
};

const sizeClass = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-28 w-28",
  xl: "h-52 w-52",
};

const tones: Record<BuddyVariant, { primary: string; secondary: string; accent: string; blush: string }> = {
  chasam: { primary: "#FFD1E6", secondary: "#FFF3F8", accent: "#EC4899", blush: "#FB7185" },
  miu: { primary: "#F8C7A7", secondary: "#FFF7ED", accent: "#14B8A6", blush: "#FB7185" },
  lumi: { primary: "#B9E6FF", secondary: "#EEF8FF", accent: "#2563EB", blush: "#67E8F9" },
  owly: { primary: "#F6C76D", secondary: "#FFF7DB", accent: "#92400E", blush: "#F97316" },
  nova: { primary: "#CBD5E1", secondary: "#F8FAFC", accent: "#0F172A", blush: "#38BDF8" },
  ivy: { primary: "#FBCFE8", secondary: "#FFF1F7", accent: "#BE185D", blush: "#FB7185" },
  tree: { primary: "#A7F3D0", secondary: "#ECFDF5", accent: "#047857", blush: "#34D399" },
};

function resolveVariant(emoji?: string, variant?: BuddyVariant): BuddyVariant {
  if (variant) return variant;
  if (emoji?.includes("🤖")) return "lumi";
  if (emoji?.includes("🦉")) return "owly";
  if (emoji?.includes("🌳")) return "tree";
  return "miu";
}

export function BuddyAvatar({ emoji, fallbackImage, size = "md", variant, className = "" }: BuddyAvatarProps) {
  const resolvedVariant = resolveVariant(emoji, variant);
  const tone = tones[resolvedVariant];
  const isRobot = resolvedVariant === "lumi";
  const isTree = resolvedVariant === "tree";
  const isOwl = resolvedVariant === "owly";

  if (fallbackImage) {
    return (
      <div className={`overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-sm ${sizeClass[size]} ${className}`}>
        <img alt={`${resolvedVariant} buddy`} className="h-full w-full object-cover object-top" src={fallbackImage} />
      </div>
    );
  }

  return (
    <div className={`pet-avatar ${sizeClass[size]} ${className}`}>
      <svg aria-label="Buddy Study companion" className="h-full w-full" role="img" viewBox="0 0 220 220">
        <defs>
          <linearGradient id={`pet-bg-${resolvedVariant}`} x1="30" x2="190" y1="20" y2="210">
            <stop stopColor={tone.secondary} />
            <stop offset="1" stopColor="#E0F2FE" />
          </linearGradient>
          <filter id={`pet-shadow-${resolvedVariant}`} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="13" floodColor="#0F172A" floodOpacity="0.18" stdDeviation="10" />
          </filter>
        </defs>

        <rect height="220" rx="36" width="220" fill={`url(#pet-bg-${resolvedVariant})`} />
        <path d="M34 164c24 22 126 22 152 0 4 21-11 38-76 38s-82-17-76-38Z" fill="#0F172A" opacity="0.08" />
        <circle cx="173" cy="49" fill={tone.accent} opacity="0.16" r="22" />
        <circle cx="45" cy="66" fill="#FFFFFF" opacity="0.72" r="10" />

        {isTree ? (
          <>
            <path d="M110 57c-30 0-54 23-54 52 0 22 15 40 36 48h36c21-8 36-26 36-48 0-29-24-52-54-52Z" fill={tone.primary} filter={`url(#pet-shadow-${resolvedVariant})`} />
            <path d="M103 150h15v34h-15z" fill="#8B5E34" />
            <path d="M81 185h58" stroke={tone.accent} strokeLinecap="round" strokeWidth="10" />
          </>
        ) : (
          <>
            {!isRobot && !isOwl ? (
              <>
                <path d="M68 78 52 48l32 16Z" fill={tone.primary} />
                <path d="M152 78 168 48l-32 16Z" fill={tone.primary} />
                <path d="M68 62 58 48l17 10Z" fill="#FFE8D5" />
                <path d="M152 62 162 48l-17 10Z" fill="#FFE8D5" />
              </>
            ) : null}

            <path
              d={isRobot ? "M62 84c0-25 18-44 48-44s48 19 48 44v34c0 32-20 58-48 58s-48-26-48-58Z" : "M55 101c0-36 23-61 55-61s55 25 55 61c0 43-24 75-55 75s-55-32-55-75Z"}
              fill={tone.primary}
              filter={`url(#pet-shadow-${resolvedVariant})`}
            />
            {isRobot ? <rect x="82" y="28" width="56" height="15" rx="7" fill={tone.accent} /> : null}
          </>
        )}

        <path d="M78 139c14 15 50 15 64 0" fill="none" stroke="#0F172A" strokeLinecap="round" strokeWidth="7" />
        <circle cx="84" cy="107" fill="#0F172A" r={isOwl ? 13 : 8} />
        <circle cx="136" cy="107" fill="#0F172A" r={isOwl ? 13 : 8} />
        <circle cx="88" cy="103" fill="#FFFFFF" r="3" />
        <circle cx="140" cy="103" fill="#FFFFFF" r="3" />
        <path d="M103 123h14l-7 9Z" fill={tone.accent} />
        <circle cx="68" cy="127" fill={tone.blush} opacity="0.38" r="10" />
        <circle cx="152" cy="127" fill={tone.blush} opacity="0.38" r="10" />

        <path d="M70 84c11-9 69-9 80 0" fill="none" stroke="#0F172A" strokeLinecap="round" strokeWidth="5" opacity="0.16" />
        <rect x="76" y="97" width="28" height="22" rx="9" fill="none" stroke={tone.accent} strokeWidth="5" />
        <rect x="116" y="97" width="28" height="22" rx="9" fill="none" stroke={tone.accent} strokeWidth="5" />
        <path d="M104 108h12" stroke={tone.accent} strokeLinecap="round" strokeWidth="5" />

        <g transform="translate(121 145) rotate(-8)">
          <path d="M0 0h42a8 8 0 0 1 8 8v25H8a8 8 0 0 1-8-8Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
          <path d="M8 9h30M8 18h24" stroke="#94A3B8" strokeLinecap="round" strokeWidth="3" />
          <path d="M0 0h20v33H8a8 8 0 0 1-8-8Z" fill="#CCFBF1" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
