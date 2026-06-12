interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-xl px-4 py-3 mb-4 text-[0.8125rem] text-[var(--danger-hover)] animate-[slideIn_0.3s_ease_forwards]">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Cerrar mensaje de error"
          className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none cursor-pointer flex-shrink-0 text-[var(--danger-hover)] opacity-60 hover:opacity-100 hover:bg-[rgba(239,68,68,0.15)] transition-all duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
