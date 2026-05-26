import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ScanBarcode, Pencil } from "lucide-react";
import { FOODS } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan Barcode — PulsePeak" }] }),
  component: Scan,
});

function Scan() {
  const [scanning, setScanning] = useState(true);
  const [found, setFound] = useState<(typeof FOODS)[number] | null>(null);
  const { addMeal } = useStore();
  const nav = useNavigate();

  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(() => {
      setFound(FOODS[Math.floor(Math.random() * FOODS.length)]);
      setScanning(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [scanning]);

  return (
    <div className="min-h-dvh bg-foreground text-primary-foreground">
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <Link
          to="/add"
          search={{ meal: "Snacks" }}
          className="inline-flex items-center gap-1 text-sm text-primary-foreground/80"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>

        <h1 className="mt-6 font-display text-2xl font-bold">Scan barcode</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">
          Point your camera at any product barcode.
        </p>

        <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-3xl border border-white/15 bg-black/60">
          <div className="absolute inset-0 grid place-items-center">
            <ScanBarcode className="h-24 w-24 text-white/15" />
          </div>
          {scanning && (
            <div className="absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-gold shadow-glow" />
          )}
          <div className="absolute inset-6 rounded-2xl border-2 border-gold/80">
            <Corner className="top-0 left-0" />
            <Corner className="top-0 right-0 rotate-90" />
            <Corner className="bottom-0 right-0 rotate-180" />
            <Corner className="bottom-0 left-0 -rotate-90" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {found ? (
            <div className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-gold">Match found</p>
              <p className="mt-1 font-display text-lg font-bold">{found.name}</p>
              <p className="text-xs text-primary-foreground/70">
                {found.brand ?? "Generic"} · {found.serving} · {found.kcal} kcal
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setScanning(true);
                    setFound(null);
                  }}
                  className="flex-1 rounded-2xl border border-white/20 py-3 text-sm font-semibold"
                >
                  Scan again
                </button>
                <button
                  onClick={() => {
                    addMeal("Snacks", found, 1);
                    nav({ to: "/diary" });
                  }}
                  className="flex-[2] rounded-2xl bg-gradient-gold py-3 font-display text-sm font-semibold text-gold-foreground"
                >
                  Add to diary
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-primary-foreground/70">Scanning...</p>
          )}
          <Link
            to="/add"
            search={{ meal: "Snacks" }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-3.5 text-sm font-semibold"
          >
            <Pencil className="h-4 w-4" /> Enter manually
          </Link>
        </div>
      </div>
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return <span className={`absolute h-5 w-5 border-l-2 border-t-2 border-gold ${className}`} />;
}
