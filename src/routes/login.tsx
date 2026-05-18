import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/login")({ component: Login });

async function hashPassword(password: string) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Only @gmail.com emails are supported.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const hashedPw = await hashPassword(pw);
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === hashedPw);

    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      if (user.onboardingComplete) {
        nav({ to: "/dashboard" });
      } else {
        nav({ to: "/onboarding" });
      }
    } else {
      setErrors({ form: "Invalid email or password." });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn("Supabase Google OAuth not fully configured, falling back to local simulation:", err);
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: any) => u.email === "google@gmail.com" || u.email === email);
      if (!user) {
        setErrors({ google: "Google account not found in local records. Please register first." });
        return;
      }
      localStorage.setItem("currentUser", JSON.stringify(user));
      if (user.onboardingComplete) {
        nav({ to: "/dashboard" });
      } else {
        nav({ to: "/onboarding" });
      }
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md px-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        
        <div className="mt-8 mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue your streak and reach your goals.</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <div>
            <div className={clsx("flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2", errors.email ? "border-destructive focus-within:ring-destructive/30" : "border-border focus-within:ring-primary/50")}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email (you@gmail.com)"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                required
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.email}</p>}
          </div>

          <div>
            <div className={clsx("flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2 relative", errors.form || errors.google ? "border-destructive focus-within:ring-destructive/30" : "border-border focus-within:ring-primary/50")}>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setErrors({}); }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground pr-8"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.form && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.form}</p>}
            {errors.google && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.google}</p>}
          </div>

          <div className="text-right pt-1 pb-2">
            <Link to="/forgot" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
          </div>
          
          <button type="submit" className="w-full rounded-2xl bg-gradient-hero py-4 font-display text-base font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98]">
            Sign in
          </button>
        </form>

        <div className="my-8 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR CONTINUE WITH <div className="h-px flex-1 bg-border" />
        </div>
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md py-4 font-display font-medium shadow-sm transition hover:bg-muted active:scale-[0.98]"
        >
          <GoogleIcon /> Google
        </button>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.6 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2 14-5.3l-6.5-5.5C29.6 34.4 27 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.5 5.5C41.6 36 43.5 30.5 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
    </svg>
  );
}
