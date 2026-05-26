import { Link, useLocation } from "@tanstack/react-router";
import { Home, Utensils, Plus, Dumbbell, User } from "lucide-react";

type NavItem = { to: string; label: string; Icon: typeof Home; primary?: boolean };
const items: NavItem[] = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/diary", label: "Diary", Icon: Utensils },
  { to: "/add", label: "Add", Icon: Plus, primary: true },
  { to: "/exercise", label: "Train", Icon: Dumbbell },
  { to: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="pointer-events-auto mx-3 flex w-full max-w-md items-end justify-between rounded-3xl border border-border bg-card/95 px-3 py-2 shadow-card backdrop-blur-xl">
        {items.map(({ to, label, Icon, primary }) => {
          const active = pathname === to;
          if (primary) {
            return (
              <Link key={to} to={to as never} className="-mt-7 flex flex-col items-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-glow ring-4 ring-background">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to as never}
              className="flex flex-1 flex-col items-center gap-1 py-1.5"
            >
              <Icon
                className={`h-5 w-5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
