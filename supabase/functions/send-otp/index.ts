import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey!,
      },
      body: JSON.stringify({
        sender: { name: "PulsePeak", email: "pulsepeaktracker@gmail.com" },
        to: [{ email }],
        subject: "Your PulsePeak Verification Code",
        htmlContent: `<!DOCTYPE html>
<html>
<head>
<style>
@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(13, 122, 95, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 0 20px 5px rgba(212, 175, 55, 0.6); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(13, 122, 95, 0.4); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.animated-box {
  animation: pulse 3s infinite ease-in-out;
}
.shimmer-text {
  background: linear-gradient(90deg, #0d7a5f 0%, #d4af37 50%, #0d7a5f 100%);
  background-size: 200% auto;
  color: #0d7a5f;
  background-clip: text;
  text-fill-color: transparent;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s infinite linear;
}
</style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6;">
  <div style="max-w: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d7a5f 0%, #115e49 100%); padding: 40px 20px; text-align: center; position: relative;">
      <div style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f3e5ab 100%); padding: 16px; border-radius: 20px; box-shadow: 0 8px 20px rgba(212,175,55,0.4); margin-bottom: 16px;">
        <span style="font-size: 32px; line-height: 1;">✨</span>
      </div>
      <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">PulsePeak</h1>
      <p style="color: #a7f3d0; font-size: 16px; margin: 8px 0 0 0; opacity: 0.9;">Your Premium Nutrition & Fitness Companion</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 32px; text-align: center;">
      <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 16px 0; font-weight: 700;">Secure Verification Code</h2>
      <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">Please use the verification code below to verify your email address and unlock your personalized AI fitness dashboard.</p>
      
      <!-- OTP Box -->
      <div class="animated-box" style="margin: 0 auto 32px auto; max-w: 300px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #d4af37; border-radius: 20px; padding: 24px; box-shadow: 0 10px 25px rgba(212,175,55,0.2);">
        <div class="shimmer-text" style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #0d7a5f;">${otp}</div>
      </div>
      
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">This code will expire in 10 minutes. If you did not request this verification, please ignore this email.</p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
      <p style="color: #64748b; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Empowering Your Fitness Peak</p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 PulsePeak AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
