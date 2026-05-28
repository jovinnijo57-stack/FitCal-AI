import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneShell({
  children,
  hideNav = false,
  bgClass = "bg-background",
}: {
  children: ReactNode;
  hideNav?: boolean;
  bgClass?: string;
}) {
  return (
    <div className={`min-h-dvh ${bgClass}`}>
      <div className="mx-auto w-full max-w-md pb-28">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between px-5 pb-3 pt-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
