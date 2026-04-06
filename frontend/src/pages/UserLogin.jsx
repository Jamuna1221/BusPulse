import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10);

export default function UserLogin() {
  const { loginEmail, loginGoogle, signupInit, verifySignup } = useUserAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [signupStep, setSignupStep] = useState(1); // 1 = form, 2 = OTP

  // shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [countdown, setCountdown] = useState(0);

  const clearMessages = () => { setError(""); setInfo(""); };

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  // ── LOGIN ──
  const handleLogin = async (e) => {
    e.preventDefault(); clearMessages();
    setLoading(true);
    try {
      await loginEmail(email, password);
      navigate("/home");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── SIGNUP step 1 ──
  const handleSignupSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await signupInit(name, email, password);
      setSignupStep(2);
      setInfo(`Verification code sent to ${email}`);
      startCountdown();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── SIGNUP step 2 ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); clearMessages();
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    try {
      await verifySignup(email, otp);
      navigate("/home");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── GOOGLE ──
  const handleGoogle = async (cr) => {
    clearMessages(); setLoading(true);
    try { await loginGoogle(cr.credential); navigate("/home"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); setSignupStep(1); clearMessages(); setOtp(""); };

  return (
    <div style={s.page}>
      <div style={s.blob1} /><div style={s.blob2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}><span style={s.bus}>🚌</span><span style={s.brand}>BusPulse</span></div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button id="tab-login" onClick={() => switchTab("login")} style={{ ...s.tab, ...(tab === "login" ? s.tabActive : {}) }}>Login</button>
          <button id="tab-signup" onClick={() => switchTab("signup")} style={{ ...s.tab, ...(tab === "signup" ? s.tabActive : {}) }}>Sign Up</button>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}
        {info  && <div style={s.infoBox}>{info}</div>}

        {/* ═══ LOGIN ═══ */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={s.form}>
            <Field label="Email address">
              <input id="login-email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required style={s.input} autoFocus />
            </Field>
            <Field label="Password">
              <div style={s.passWrap}>
                <input id="login-password" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required style={{ ...s.input, paddingRight: "44px" }} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={s.eye}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>
            <button id="login-btn" type="submit" style={s.btn} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>

            {GOOGLE_ENABLED && <>
              <Divider />
              <div style={s.gWrap}>
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-in failed.")}
                  theme="filled_black" shape="pill" text="continue_with" width="320" />
              </div>
            </>}
          </form>
        )}

        {/* ═══ SIGNUP — Step 1 ═══ */}
        {tab === "signup" && signupStep === 1 && (
          <form onSubmit={handleSignupSubmit} style={s.form}>
            <Field label="Full name">
              <input id="signup-name" type="text" placeholder="e.g. Priya Kumar" value={name}
                onChange={e => setName(e.target.value)} required style={s.input} autoFocus />
            </Field>
            <Field label="Email address">
              <input id="signup-email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required style={s.input} />
            </Field>
            <Field label="Password">
              <div style={s.passWrap}>
                <input id="signup-password" type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required style={{ ...s.input, paddingRight: "44px" }} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={s.eye}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </Field>
            <button id="signup-btn" type="submit" style={s.btn} disabled={loading}>{loading ? "Creating account…" : "Create Account →"}</button>

            {GOOGLE_ENABLED && <>
              <Divider />
              <div style={s.gWrap}>
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-in failed.")}
                  theme="filled_black" shape="pill" text="continue_with" width="320" />
              </div>
            </>}
          </form>
        )}

        {/* ═══ SIGNUP — Step 2: OTP ═══ */}
        {tab === "signup" && signupStep === 2 && (
          <form onSubmit={handleVerifyOtp} style={s.form}>
            <p style={s.otpHint}>We sent a 6-digit code to <strong style={{color:"#22c55e"}}>{email}</strong></p>
            <div style={s.otpWrap}>
              <input id="otp-input" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={s.otpInput} autoFocus />
            </div>
            <button id="verify-btn" type="submit" style={s.btn} disabled={loading || otp.length !== 6}>
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <div style={s.resendRow}>
              {countdown > 0
                ? <span style={s.cd}>Resend in {countdown}s</span>
                : <button type="button" style={s.resendBtn} onClick={async () => {
                    clearMessages(); setOtp(""); setLoading(true);
                    try { await signupInit(name, email, password); setInfo("New code sent!"); startCountdown(); }
                    catch (err) { setError(err.message); }
                    finally { setLoading(false); }
                  }}>Resend code</button>
              }
              <button type="button" style={s.backBtn} onClick={() => { setSignupStep(1); setOtp(""); clearMessages(); }}>← Go back</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: "16px" }}><label style={s.label}>{label}</label>{children}</div>;
}
function Divider() {
  return <div style={s.divider}><span style={s.divLine}/><span style={s.divText}>or</span><span style={s.divLine}/></div>;
}

const s = {
  page: { minHeight:"100vh", background:"#0f172a", display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Inter','Segoe UI',sans-serif", position:"relative", overflow:"hidden", padding:"24px" },
  blob1: { position:"absolute", top:"-100px", left:"-80px", width:"380px", height:"380px", borderRadius:"50%",
           background:"radial-gradient(circle,rgba(34,197,94,0.18) 0%,transparent 70%)", filter:"blur(40px)", pointerEvents:"none" },
  blob2: { position:"absolute", bottom:"-100px", right:"-80px", width:"340px", height:"340px", borderRadius:"50%",
           background:"radial-gradient(circle,rgba(59,130,246,0.14) 0%,transparent 70%)", filter:"blur(40px)", pointerEvents:"none" },
  card: { background:"rgba(30,41,59,0.97)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:"24px", padding:"40px 36px", width:"100%", maxWidth:"400px",
          boxShadow:"0 32px 80px rgba(0,0,0,0.5)", position:"relative", zIndex:1 },
  logo: { display:"flex", alignItems:"center", gap:"10px", marginBottom:"24px" },
  bus:  { fontSize:"26px" },
  brand:{ fontSize:"21px", fontWeight:"800", color:"#22c55e" },
  tabs: { display:"flex", background:"#0f172a", borderRadius:"12px", padding:"4px", marginBottom:"24px" },
  tab:  { flex:1, padding:"9px", border:"none", background:"none", color:"#64748b", fontWeight:"600",
          fontSize:"14px", cursor:"pointer", borderRadius:"9px", transition:"all 0.2s" },
  tabActive: { background:"#22c55e", color:"#fff" },
  errorBox: { background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5",
              borderRadius:"10px", padding:"11px 14px", fontSize:"13px", marginBottom:"18px" },
  infoBox:  { background:"rgba(34,197,94,0.10)", border:"1px solid rgba(34,197,94,0.25)", color:"#86efac",
              borderRadius:"10px", padding:"11px 14px", fontSize:"13px", marginBottom:"18px" },
  form:  { display:"flex", flexDirection:"column" },
  label: { display:"block", fontSize:"12px", fontWeight:"600", color:"#94a3b8", marginBottom:"7px", textTransform:"uppercase", letterSpacing:"0.5px" },
  input: { width:"100%", padding:"12px 14px", borderRadius:"11px", background:"#0f172a",
           border:"1.5px solid rgba(255,255,255,0.09)", color:"#f1f5f9", fontSize:"15px",
           outline:"none", boxSizing:"border-box" },
  passWrap: { position:"relative" },
  eye: { position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)",
         background:"none", border:"none", cursor:"pointer", fontSize:"16px", padding:"0" },
  btn: { width:"100%", padding:"13px", borderRadius:"11px", background:"linear-gradient(135deg,#22c55e,#16a34a)",
         color:"#fff", fontWeight:"700", fontSize:"15px", border:"none", cursor:"pointer", marginTop:"4px", marginBottom:"16px" },
  divider: { display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" },
  divLine: { flex:1, height:"1px", background:"rgba(255,255,255,0.08)", display:"block" },
  divText: { color:"#475569", fontSize:"12px" },
  gWrap:  { display:"flex", justifyContent:"center", marginBottom:"4px" },
  otpHint: { color:"#94a3b8", fontSize:"13px", textAlign:"center", marginBottom:"20px", lineHeight:"1.6" },
  otpWrap: { display:"flex", justifyContent:"center", marginBottom:"20px" },
  otpInput: { textAlign:"center", letterSpacing:"16px", fontSize:"30px", fontWeight:"800", fontFamily:"monospace",
              padding:"14px 18px", borderRadius:"14px", background:"#0f172a", border:"2px solid #22c55e",
              color:"#22c55e", outline:"none", width:"220px" },
  resendRow: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  cd:      { fontSize:"12px", color:"#64748b" },
  resendBtn: { background:"none", border:"none", color:"#22c55e", fontSize:"12px", cursor:"pointer", fontWeight:"600" },
  backBtn:   { background:"none", border:"none", color:"#64748b", fontSize:"12px", cursor:"pointer" },
};
