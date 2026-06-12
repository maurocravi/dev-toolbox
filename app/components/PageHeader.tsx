import type { ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  right?: ReactNode;
}

export default function PageHeader({ icon, title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--card-border)]">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] text-white flex-shrink-0">
          {icon}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-neutral-100">{title}</h1>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
