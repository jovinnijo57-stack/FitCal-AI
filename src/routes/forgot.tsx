import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, X, Eye, EyeOff, KeyRound } from "lucide-react";
import { clsx } from "clsx";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot")({ component: Forgot });

async function hashPassword(password: string) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function Forgot() {
  const nav = useNavigate();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [expectedOtp, setExpectedOtp] = useState("123456");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwdValidations = {
    lowercase: /[a-z]/.test(newPassword),
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(pwdValidations).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  useEffect(() => {
    if (step !== "otp") return;
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = "Email is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(generatedOtp);
    setErrors({});
    setStep("otp");
    setTimeLeft(60);
    setCanResend(false);
    console.log("OTP sent to:", email, "Generated OTP:", generatedOtp);
    toast.success(`Reset code: ${generatedOtp} (logged to console)`, {
      duration: 10000,
    });

    try {
      // Invoke live Supabase Edge Function to send real OTP via Brevo
      await supabase.functions.invoke("send-otp", {
        body: { email, otp: generatedOtp },
      });
    } catch (err) {
      console.error("Failed to send reset OTP email via Supabase:", err);
    }
  };

  const handleResend = () => {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(generatedOtp);
    setOtp(["", "", "", "", "", ""]);
    setTimeLeft(60);
    setCanResend(false);
    setErrors({});
    console.log("New OTP sent to:", email, "Generated OTP:", generatedOtp);
    toast.success(`New reset code: ${generatedOtp} (logged to console)`, {
      duration: 10000,
    });

    try {
      supabase.functions.invoke("send-otp", {
        body: { email, otp: generatedOtp },
      });
    } catch (err) {}
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft === 0) {
      setErrors({ otp: "OTP has expired. Please resend." });
      return;
    }

    const otpString = otp.join("");
    if (otpString === expectedOtp) {
      setErrors({});
      setStep("password");
    } else {
      setErrors({ otp: `Invalid OTP. Please enter the 6-digit code sent to your email.` });
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrors({ password: "Please ensure your password meets all strength requirements." });
      return;
    }
    if (!passwordsMatch) {
      setErrors({ confirm: "Passwords do not match." });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u: any) => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, password: hashedPassword };
      }
      return u;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    nav({ to: "/login" });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center py-12 relative">
      <div className="w-full max-w-md px-6">
        {step !== "password" && (
          <button
            onClick={() => (step === "email" ? window.history.back() : setStep("email"))}
            className="absolute top-8 left-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors z-20"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <div className="mt-8 mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {step === "email" && "Reset password"}
            {step === "otp" && "Verify email"}
            {step === "password" && "New password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "email" && "Enter your email and we'll send a reset link."}
            {step === "otp" && `Enter the code sent to ${email} to reset your password.`}
            {step === "password" && "Create a new strong password for your account."}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email (e.g., you@gmail.com)"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                }}
                className={clsx(
                  "w-full rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 text-sm outline-none transition-all focus:ring-2",
                  errors.email
                    ? "border-destructive focus:ring-destructive/30"
                    : "border-border focus:ring-primary/50",
                )}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">
                  {errors.email}
                </p>
              )}
            </div>
            <button className="w-full rounded-2xl bg-gradient-hero py-4 font-display text-base font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98]">
              Send Reset OTP
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              {otp.slice(0, 3).map((val, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    handleOtpChange(i, e.target.value);
                    setErrors({});
                  }}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={clsx(
                    "w-12 h-12 rounded-lg border bg-card/80 backdrop-blur-md text-center font-display text-xl outline-none transition-all focus:ring-2",
                    errors.otp
                      ? "border-destructive focus:ring-destructive/30 text-destructive"
                      : otp.join("") === expectedOtp
                        ? "border-emerald-500/50 focus:ring-emerald-500/50"
                        : "border-border focus:ring-primary/50 text-foreground",
                  )}
                  maxLength={1}
                />
              ))}
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1" />
              {otp.slice(3, 6).map((val, i) => (
                <input
                  key={i + 3}
                  ref={(el) => {
                    inputRefs.current[i + 3] = el;
                  }}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    handleOtpChange(i + 3, e.target.value);
                    setErrors({});
                  }}
                  onKeyDown={(e) => handleOtpKeyDown(i + 3, e)}
                  className={clsx(
                    "w-12 h-12 rounded-lg border bg-card/80 backdrop-blur-md text-center font-display text-xl outline-none transition-all focus:ring-2",
                    errors.otp
                      ? "border-destructive focus:ring-destructive/30 text-destructive"
                      : otp.join("") === expectedOtp
                        ? "border-emerald-500/50 focus:ring-emerald-500/50"
                        : "border-border focus:ring-primary/50 text-foreground",
                  )}
                  maxLength={1}
                />
              ))}
            </div>

            {errors.otp && (
              <p className="text-sm text-center font-medium text-destructive animate-in slide-in-from-top-1">
                {errors.otp}
              </p>
            )}

            {otp.join("") === expectedOtp && (
              <div className="flex items-center justify-center gap-2 text-emerald-500 font-medium animate-in zoom-in-95">
                <Check className="h-5 w-5" strokeWidth={3} />
                <span className="text-lg">Code verified</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={otp.join("").length < 6 || timeLeft === 0}
                className="w-full rounded-2xl bg-gradient-hero py-4 font-display text-base font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                Verify Code
              </button>

              <div className="text-sm font-medium">
                {timeLeft > 0 ? (
                  <span className="text-muted-foreground">
                    Resend code in <span className="text-foreground">{timeLeft}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-4">
              <div>
                <div
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2 relative",
                    errors.password
                      ? "border-destructive focus-within:ring-destructive/30"
                      : "border-border focus-within:ring-primary/50",
                  )}
                >
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors({});
                    }}
                    placeholder="New password"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <div
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2 relative",
                    errors.confirm
                      ? "border-destructive focus-within:ring-destructive/30"
                      : "border-border focus-within:ring-primary/50",
                  )}
                >
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({});
                    }}
                    placeholder="Confirm new password"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">
                    {errors.confirm}
                  </p>
                )}
              </div>

              <div className="space-y-2 mt-2 px-1 text-sm font-medium">
                <ValidationItem
                  isValid={pwdValidations.lowercase}
                  label="At least one lowercase letter"
                />
                <ValidationItem isValid={pwdValidations.length} label="Minimum 8 characters" />
                <ValidationItem
                  isValid={pwdValidations.uppercase}
                  label="At least one uppercase letter"
                />
                <ValidationItem isValid={pwdValidations.number} label="At least one number" />
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/login"
                className="flex-1 flex items-center justify-center rounded-2xl border border-border bg-card py-4 font-display text-base font-semibold transition hover:bg-muted active:scale-[0.98]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch}
                className="flex-[2] rounded-2xl bg-gradient-hero py-4 font-display text-base font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                Reset password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ValidationItem({ isValid, label }: { isValid: boolean; label: string }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 transition-colors",
        isValid ? "text-emerald-500" : "text-muted-foreground/60",
      )}
    >
      {isValid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      <span>{label}</span>
    </div>
  );
}
