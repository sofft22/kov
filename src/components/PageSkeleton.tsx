export function PageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <span
        className="font-serif text-[28px] uppercase tracking-[0.24em] text-charcoal/60"
        style={{ animation: 'kovaPulse 1.8s ease-in-out infinite' }}
      >
        KOVA
      </span>
      <style>{`
        @keyframes kovaPulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}