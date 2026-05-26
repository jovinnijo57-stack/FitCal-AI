import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Flame, Apple } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulsePeak — Your Premium Nutrition Coach" },
      {
        name: "description",
        content: "Track calories, macros, workouts and let AI plan your meals.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("ai_plan")
            .eq("id", session.user.id)
            .single();
          if (profile && profile.ai_plan) {
            nav({ to: "/dashboard" });
            return;
          } else {
            nav({ to: "/onboarding" });
            return;
          }
        }
      } catch (err) {}
      setLoading(false);
    }
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        checkSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [nav]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setShowIntro(false), 2200);
    return () => clearTimeout(timer);
  }, [loading]);

  if (showIntro) {
    return (
      <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-gradient-hero text-primary-foreground z-50">
        <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-20 -right-20 h-80 w-80 rounded-full bg-primary-glow/40 blur-3xl animate-pulse pointer-events-none" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-4 z-10"
        >
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-gold text-gold-foreground shadow-glow animate-bounce duration-1000">
            <Sparkles className="h-12 w-12" />
          </div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-display text-4xl font-extrabold tracking-tight bg-gradient-to-r from-gold to-white bg-clip-text text-transparent"
          >
            PulsePeak
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs uppercase tracking-widest text-gold/80 font-semibold"
          >
            Empowering Your Fitness Peak
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-20 h-80 w-80 rounded-full bg-primary-glow/40 blur-3xl pointer-events-none" />

      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">PulsePeak</span>
        </motion.div>

        <div className="mt-16 flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance"
          >
            Eat smarter.
            <br />
            <span className="bg-gradient-to-r from-gold to-primary-foreground bg-clip-text text-transparent">
              Train sharper.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-5 max-w-xs text-base text-primary-foreground/80"
          >
            A premium calorie & fitness companion powered by AI nutrition coaching.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 grid grid-cols-3 gap-3"
          >
            {[
              { Icon: Flame, label: "Smart calorie engine" },
              { Icon: Apple, label: "AI meal scoring" },
              { Icon: Sparkles, label: "Weekly insights" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur-md"
              >
                <Icon className="mb-2 h-5 w-5 text-gold" />
                <p className="text-[11px] leading-tight text-primary-foreground/80">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="space-y-3 relative z-20"
        >
          <Link
            to="/signup"
            className="block w-full rounded-2xl bg-gradient-gold py-4 text-center font-display text-base font-semibold text-gold-foreground shadow-glow transition active:scale-[0.98] cursor-pointer"
          >
            Get started — it's free
          </Link>
          <Link
            to="/login"
            className="block w-full rounded-2xl border border-white/20 bg-white/5 py-4 text-center font-display text-base font-medium backdrop-blur-md cursor-pointer"
          >
            I already have an account
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
