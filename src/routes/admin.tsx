import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Users, Utensils, Flag, TrendingUp } from "lucide-react";
import { FOODS } from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PulsePeak" }] }),
  component: Admin,
});

function Admin() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your platform</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { Icon: Users, l: "Users", v: "12,480", c: "+8.2%" },
            { Icon: Utensils, l: "Foods", v: FOODS.length.toLocaleString(), c: "Verified DB" },
            { Icon: Flag, l: "Reports", v: "23", c: "Pending review" },
            { Icon: TrendingUp, l: "Premium", v: "1,204", c: "+12.5%" },
          ].map(({ Icon, l, v, c }) => (
            <div
              key={l}
              className="rounded-3xl border border-border bg-gradient-card p-4 shadow-card"
            >
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-2xl font-bold">{v}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
              <p className="mt-1 text-xs text-success">{c}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-6 mb-2 font-display text-base font-semibold">Food database</h2>
        <ul className="space-y-2">
          {FOODS.slice(0, 6).map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {f.brand ?? "Generic"} · {f.serving} · {f.kcal} kcal
                </p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-muted px-3 py-1 text-xs font-semibold">
                  Edit
                </button>
                <button className="rounded-lg bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
