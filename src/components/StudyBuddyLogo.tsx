type StudyBuddyLogoProps = {
  compact?: boolean;
  className?: string;
};

export function StudyBuddyLogo({ compact = false, className = "" }: StudyBuddyLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[1.2rem] bg-white shadow-[0_14px_35px_rgba(37,99,235,0.18)]">
        <svg aria-hidden="true" className="h-12 w-12" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="buddy-study-shell" x1="8" x2="72" y1="8" y2="72">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="buddy-study-book-left" x1="8" x2="36" y1="50" y2="68">
              <stop stopColor="#2DD4BF" />
              <stop offset="1" stopColor="#22C55E" />
            </linearGradient>
            <linearGradient id="buddy-study-book-right" x1="42" x2="72" y1="48" y2="68">
              <stop stopColor="#FCD34D" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          <path
            d="M40 8c15.5 0 28 12.5 28 28v19.5c0 1.7-1.3 3-3 3H15c-1.7 0-3-1.3-3-3V36C12 20.5 24.5 8 40 8Z"
            fill="url(#buddy-study-shell)"
          />
          <path
            d="M31 18c-10.2 2.8-17.5 12.1-17.5 23.1v8.3L9 58.8c-1.4 2.8.6 6.2 3.8 6.2h18.7c7.4 0 13.5-6.1 13.5-13.5V29.8C45 21.4 38.1 16.1 31 18Z"
            fill="#2563EB"
            opacity="0.16"
          />
          <path
            d="M56 31.5c0 11.3-9.1 20.5-20.5 20.5S15 42.8 15 31.5 24.1 11 35.5 11c4 0 7.8 1.1 11.1 3.2 2.1 1.3 4 3 5.4 5.1 2.6 3.4 4 7.6 4 12.2Z"
            fill="#FFFFFF"
          />
          <circle cx="29" cy="32" fill="#0F2F7D" r="3.6" />
          <circle cx="43" cy="32" fill="#0F2F7D" r="3.6" />
          <path d="M31 44c3 2.6 8 2.6 11 0" fill="none" stroke="#0F2F7D" strokeLinecap="round" strokeWidth="3.8" />
          <path d="M37 40h6c0 3.2-1.4 5.3-3 5.3s-3-2.1-3-5.3Z" fill="#FF6B7A" />
          <path d="M50.5 28.5c3.7-1.7 7.6.1 9 3.6 1.4 3.4.1 7.1-2.6 8.7-2 1.2-3.6 2.8-5 4.6-.8 1-2.3.2-2-1l1.5-5.7c-2.8-1.8-4.1-5.4-2.8-8.2.4-1 1.1-1.7 1.9-2Z" fill="#FFFFFF" stroke="#0F2F7D" strokeWidth="2.8" />
          <path d="M16 52c7.8-2 15.8-2.1 24 0v17c-8.2-4.1-16.2-4.1-24 0V52Z" fill="url(#buddy-study-book-left)" stroke="#0F2F7D" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M64 52c-7.8-2-15.8-2.1-24 0v17c8.2-4.1 16.2-4.1 24 0V52Z" fill="url(#buddy-study-book-right)" stroke="#0F2F7D" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M16 52c8.2-2.2 16.2-2.2 24 0M64 52c-8.2-2.2-16.2-2.2-24 0" fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeOpacity="0.88" strokeWidth="5" />
          <path d="M40 52v17" stroke="#0F2F7D" strokeLinecap="round" strokeWidth="2.8" />
        </svg>
      </div>
      {!compact ? (
        <div className="min-w-0">
          <h1 className="text-[1.6rem] font-black leading-none text-slate-950">
            Buddy <span className="text-blue-500">Study</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Học vui hơn, tiến bộ rõ hơn</p>
        </div>
      ) : null}
    </div>
  );
}
