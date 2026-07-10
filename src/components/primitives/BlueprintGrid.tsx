export function BlueprintGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(107,138,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(107,138,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse at 50% 0%, black 40%, transparent 75%)',
      }}
    />
  );
}
