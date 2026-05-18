import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, X, Eye, EyeOff, User, Mail, Phone, Lock, Tag } from "lucide-react";
import { clsx } from "clsx";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/signup")({ component: Signup });

async function hashPassword(password: string) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function Signup() {
  const nav = useNavigate();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [countryCode, setCountryCode] = useState("+91");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", referral: "" });
  
  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [expectedOtp, setExpectedOtp] = useState("123456");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const pwd = formData.password;
  const pwdValidations = {
    length: pwd.length >= 8,
    capital: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd)
  };
  const isPasswordValid = Object.values(pwdValidations).every(Boolean);

  useEffect(() => {
    if (step !== "otp") return;
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Full name is required.";
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Only @gmail.com emails are allowed.";
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = "Phone number must be at least 10 digits.";
    }

    if (!isPasswordValid) {
      newErrors.password = "Please meet all password strength requirements.";
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
    console.log("OTP sent to:", formData.email, "Generated OTP:", generatedOtp);

    try {
      // Invoke live Supabase Edge Function to send real OTP via Brevo
      await supabase.functions.invoke('send-otp', {
        body: { email: formData.email, otp: generatedOtp }
      });
    } catch (err) {
      console.error("Failed to send OTP email via Supabase:", err);
    }
  };

  const handleResend = () => {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(generatedOtp);
    setOtp(["", "", "", "", "", ""]);
    setTimeLeft(60);
    setCanResend(false);
    setErrors({});
    console.log("New OTP sent to:", formData.email, "Generated OTP:", generatedOtp);

    try {
      supabase.functions.invoke('send-otp', {
        body: { email: formData.email, otp: generatedOtp }
      });
    } catch (err) {}
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft === 0) {
      setErrors({ otp: "OTP has expired. Please resend." });
      return;
    }

    const otpString = otp.join("");
    if (otpString === expectedOtp) {
      const fullPhone = `${countryCode} ${formData.phone}`;
      
      // Register user in Supabase auth.users
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              phone: fullPhone,
              referral: formData.referral,
            }
          }
        });
        if (error) console.error("Supabase signUp error:", error);
      } catch (err) {
        console.error("Supabase signUp exception:", err);
      }

      const hashedPassword = await hashPassword(formData.password);
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userToSave = { ...formData, phone: fullPhone, password: hashedPassword, onboardingComplete: false };
      users.push(userToSave);
      localStorage.setItem("users", JSON.stringify(users));
      
      setShowSuccessAnim(true);
      setTimeout(() => {
        nav({ to: "/login" });
      }, 2500);
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
    if (e.key === 'Backspace' && !otp[index] && index > 1) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  return (
    <div className="min-h-dvh bg-background flex flex-col justify-center py-12 relative">
      {showSuccessAnim && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gradient-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-glow flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 animate-bounce">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Account Created!</h3>
            <p className="text-sm text-muted-foreground mt-2">Your premium PulsePeak account is ready. Redirecting you to login...</p>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-md px-6">
        <button onClick={() => step === "otp" ? setStep("form") : window.history.back()} className="absolute top-8 left-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors z-20">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        
        <div className="mt-8 mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {step === "otp" ? "Verify your email" : "Create account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "otp" ? `Enter the code sent to ${formData.email} to verify your account.` : "Start your fitness transformation today."}
          </p>
        </div>

        {step === "form" ? (
          <>
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div>
                <div className={clsx("flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2", errors.name ? "border-destructive focus-within:ring-destructive/30" : "border-border focus-within:ring-primary/50")}>
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: "" }) }} placeholder="Full name" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
                {errors.name && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.name}</p>}
              </div>

              <div>
                <div className={clsx("flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2", errors.email ? "border-destructive focus-within:ring-destructive/30" : "border-border focus-within:ring-primary/50")}>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input type="email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors({ ...errors, email: "" }) }} placeholder="Email (e.g., you@gmail.com)" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
                {errors.email && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.email}</p>}
              </div>
              
              <div>
                <div className={clsx("flex items-center gap-2 rounded-2xl border bg-card/80 backdrop-blur-md px-3 py-3.5 transition-all focus-within:ring-2", errors.phone ? "border-destructive focus-within:ring-destructive/30" : "border-border focus-within:ring-primary/50")}>
                  <Phone className="h-4 w-4 ml-1 text-muted-foreground" />
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent text-sm outline-none appearance-none pr-2 font-medium"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+1">🇨🇦 +1</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+27">🇿🇦 +27</option>
                  </select>
                  <div className="h-4 w-px bg-border" />
                  <input type="tel" value={formData.phone} onChange={(e) => { setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); setErrors({ ...errors, phone: "" }) }} placeholder="Phone number" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
                {errors.phone && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.phone}</p>}
              </div>

              <div>
                <div className={clsx("flex items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2 relative", errors.password ? "border-destructive focus-within:ring-destructive/30" : "border-border focus-within:ring-primary/50")}>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors({ ...errors, password: "" }) }} placeholder="Password" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground pr-8" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{errors.password}</p>}
                
                <div className="grid grid-cols-2 gap-2 mt-3 px-1 text-xs">
                  <ValidationItem isValid={pwdValidations.length} label="Min 8 characters" />
                  <ValidationItem isValid={pwdValidations.capital} label="1 capital letter" />
                  <ValidationItem isValid={pwdValidations.number} label="1 number" />
                  <ValidationItem isValid={pwdValidations.special} label="1 special char" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-md px-4 py-3.5 transition-all focus-within:ring-2 focus-within:ring-primary/50">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <input value={formData.referral} onChange={(e) => setFormData({ ...formData, referral: e.target.value })} placeholder="Referral Code (Optional)" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
              </div>
              
              <button 
                disabled={!isPasswordValid || !formData.name || !formData.email || formData.phone.length < 10}
                className="mt-4 w-full rounded-2xl bg-gradient-hero py-4 font-display text-base font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                Create account
              </button>
            </form>
            
            <p className="mt-10 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">Sign in</Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              {otp.slice(0, 3).map((val, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  value={val}
                  onChange={(e) => { handleOtpChange(i, e.target.value); setErrors({}); }}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={clsx(
                    "w-12 h-12 rounded-lg border bg-card/80 backdrop-blur-md text-center font-display text-xl outline-none transition-all focus:ring-2", 
                    errors.otp ? "border-destructive focus:ring-destructive/30 text-destructive" : 
                    otp.join("") === expectedOtp ? "border-emerald-500/50 focus:ring-emerald-500/50" :
                    "border-border focus:ring-primary/50 text-foreground"
                  )}
                  maxLength={1}
                />
              ))}
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1" />
              {otp.slice(3, 6).map((val, i) => (
                <input
                  key={i + 3}
                  ref={el => { inputRefs.current[i + 3] = el; }}
                  type="text"
                  value={val}
                  onChange={(e) => { handleOtpChange(i + 3, e.target.value); setErrors({}); }}
                  onKeyDown={(e) => handleOtpKeyDown(i + 3, e)}
                  className={clsx(
                    "w-12 h-12 rounded-lg border bg-card/80 backdrop-blur-md text-center font-display text-xl outline-none transition-all focus:ring-2", 
                    errors.otp ? "border-destructive focus:ring-destructive/30 text-destructive" : 
                    otp.join("") === expectedOtp ? "border-emerald-500/50 focus:ring-emerald-500/50" :
                    "border-border focus:ring-primary/50 text-foreground"
                  )}
                  maxLength={1}
                />
              ))}
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-xs text-muted-foreground">Enter 6-digit verification code</span>
              {otp.join("") === expectedOtp && (
                <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold animate-in fade-in slide-in-from-right-2">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  <span>Code verified</span>
                </div>
              )}
            </div>
            
            {errors.otp && <p className="text-sm text-center font-medium text-destructive animate-in slide-in-from-top-1">{errors.otp}</p>}
            
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
                  <span className="text-muted-foreground">Resend code in <span className="text-foreground">{timeLeft}s</span></span>
                ) : (
                  <button type="button" onClick={handleResend} className="text-destructive hover:text-destructive/80 transition-colors">
                    Resend code
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ValidationItem({ isValid, label }: { isValid: boolean, label: string }) {
  return (
    <div className={clsx("flex items-center gap-1.5 transition-colors", isValid ? "text-primary font-medium" : "text-muted-foreground")}>
      {isValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-50" />}
      <span>{label}</span>
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
