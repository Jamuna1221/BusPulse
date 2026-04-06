import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import logoImg from "../assets/logo.png";

/* ─── static data ─────────────────────────────────────────────── */
const FEATURES = [
  { icon: "📍", title: "Real-Time Tracking", desc: "Know exactly where your bus is at every moment. Live updates without GPS dependency.", color: "#22c55e", glow: "rgba(34,197,94,0.4)" },
  { icon: "⏱️", title: "Accurate ETAs", desc: "Smart ETA engine calculates arrival time using route geometry and speed patterns.", color: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { icon: "🗺️", title: "Route Intelligence", desc: "Visualise every bus route passing near you. Tap a route to see its full journey.", color: "#a78bfa", glow: "rgba(167,139,250,0.4)" },
  { icon: "🔔", title: "Smart Alerts", desc: "Get notified when your bus is approaching so you never miss a ride again.", color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
  { icon: "📊", title: "Schedule Overview", desc: "Browse complete daily and weekly bus schedules for all routes in one place.", color: "#ec4899", glow: "rgba(236,72,153,0.4)" },
  { icon: "🌐", title: "Works Offline", desc: "Cached schedules mean you can check timings even without an active connection.", color: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
];

const STATS = [
  { value: "50+", label: "Bus Routes", icon: "🛣️" },
  { value: "200+", label: "Daily Services", icon: "🚌" },
  { value: "10k+", label: "Happy Commuters", icon: "😊" },
  { value: "99%", label: "Uptime", icon: "⚡" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Share Your Location", desc: "Allow location access or pick a spot on the map — your choice.", icon: "📡" },
  { step: "02", title: "Discover Nearby Buses", desc: "Instantly see all buses passing close to you with ETAs.", icon: "🚌" },
  { step: "03", title: "Board with Confidence", desc: "Arrive at the stop just in time and never stand waiting again.", icon: "✅" },
];

/* ─── Bus SVG Illustration ─────────────────────────────────────── */
function BusSVG({ style }) {
  return (
    <svg viewBox="0 0 340 160" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Road shadow */}
      <ellipse cx="170" cy="148" rx="140" ry="10" fill="rgba(0,0,0,0.3)" />

      {/* Bus body */}
      <rect x="20" y="40" width="290" height="95" rx="18" fill="#1e3a5f" />
      <rect x="20" y="40" width="290" height="95" rx="18" fill="url(#busGrad)" />

      {/* Top stripe */}
      <rect x="20" y="40" width="290" height="22" rx="18" fill="#22c55e" />
      <rect x="20" y="52" width="290" height="10" fill="#22c55e" />

      {/* Bottom stripe */}
      <rect x="20" y="118" width="290" height="5" fill="#16a34a" />

      {/* Windows row */}
      {[50, 100, 150, 200, 250].map((x, i) => (
        <g key={i}>
          <rect x={x} y="60" width="38" height="28" rx="5" fill="url(#windowGrad)" opacity="0.9" />
          <rect x={x + 2} y="62" width="15" height="24" rx="3" fill="rgba(255,255,255,0.15)" />
          {i < 3 && <rect x={x + 4} y="64" width="8" height="3" rx="1" fill="rgba(255,255,255,0.4)" />}
        </g>
      ))}

      {/* Front windshield */}
      <rect x="285" y="55" width="22" height="32" rx="6" fill="url(#windowGrad)" opacity="0.9" />
      <rect x="287" y="57" width="10" height="28" rx="3" fill="rgba(255,255,255,0.2)" />

      {/* Headlights */}
      <ellipse cx="312" cy="96" rx="10" ry="7" fill="#fef08a" opacity="0.9" />
      <ellipse cx="312" cy="96" rx="6" ry="4" fill="#fff" />

      {/* Tail light */}
      <rect x="20" y="88" width="8" height="16" rx="3" fill="#ef4444" opacity="0.9" />

      {/* Door */}
      <rect x="32" y="72" width="28" height="40" rx="4" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5" />
      <rect x="45" y="75" width="2" height="34" rx="1" fill="rgba(34,197,94,0.5)" />

      {/* Route sign */}
      <rect x="90" y="28" width="80" height="18" rx="5" fill="#0f172a" stroke="#22c55e" strokeWidth="1.5" />
      <text x="130" y="41" textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="bold" fontFamily="monospace">ROUTE 12A</text>

      {/* Wheels */}
      <circle cx="75" cy="138" r="17" fill="#0f172a" stroke="#334155" strokeWidth="3" />
      <circle cx="75" cy="138" r="9" fill="#1e293b" />
      <circle cx="75" cy="138" r="4" fill="#22c55e" />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <line key={i} x1={75 + 6 * Math.cos(a * Math.PI / 180)} y1={138 + 6 * Math.sin(a * Math.PI / 180)} x2={75 + 13 * Math.cos(a * Math.PI / 180)} y2={138 + 13 * Math.sin(a * Math.PI / 180)} stroke="#334155" strokeWidth="1.5" />
      ))}

      <circle cx="255" cy="138" r="17" fill="#0f172a" stroke="#334155" strokeWidth="3" />
      <circle cx="255" cy="138" r="9" fill="#1e293b" />
      <circle cx="255" cy="138" r="4" fill="#22c55e" />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <line key={i} x1={255 + 6 * Math.cos(a * Math.PI / 180)} y1={138 + 6 * Math.sin(a * Math.PI / 180)} x2={255 + 13 * Math.cos(a * Math.PI / 180)} y2={138 + 13 * Math.sin(a * Math.PI / 180)} stroke="#334155" strokeWidth="1.5" />
      ))}

      {/* Undercarriage */}
      <rect x="30" y="128" width="270" height="8" rx="3" fill="#0f172a" />

      {/* BusPulse brand on side */}
      <text x="175" y="108" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="700" fontFamily="sans-serif" letterSpacing="2">BusPulse</text>

      <defs>
        <linearGradient id="busGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Bus Stop SVG ─────────────────────────────────────────────── */
function BusStopSVG({ style }) {
  return (
    <svg viewBox="0 0 80 200" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="36" y="20" width="8" height="160" rx="3" fill="#334155" />
      <rect x="20" y="20" width="52" height="42" rx="6" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
      <rect x="24" y="24" width="44" height="34" rx="4" fill="#0f172a" />
      <text x="46" y="36" textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="bold">BUS</text>
      <text x="46" y="47" textAnchor="middle" fill="#60a5fa" fontSize="6">12A · 15B</text>
      <text x="46" y="56" textAnchor="middle" fill="#94a3b8" fontSize="5">4 min · 12 min</text>
      <circle cx="40" cy="185" r="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
    </svg>
  );
}

/* ─── Road SVG background element ─────────────────────────────── */
function RoadDashes() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "6px", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: "12px", animation: "roadScroll 1.5s linear infinite" }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{ width: "40px", height: "6px", background: "#fbbf24", borderRadius: "3px", flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Animated counter ─────────────────────────────────────────── */
function AnimatedStat({ value, label, icon }) {
  const [displayed, setDisplayed] = useState("0");
  const ref = useRef();
  const observed = useRef(false);

  useEffect(() => {
    const numericVal = parseInt(value.replace(/[^0-9]/g, ""));
    const suffix = value.replace(/[0-9]/g, "");
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        let start = 0;
        const duration = 1500;
        const step = duration / numericVal;
        const timer = setInterval(() => {
          start += Math.ceil(numericVal / 40);
          if (start >= numericVal) { setDisplayed(numericVal + suffix); clearInterval(timer); }
          else setDisplayed(start + suffix);
        }, step > 16 ? step : 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={s.statCard} className="stat-card">
      <span style={s.statIcon}>{icon}</span>
      <span style={s.statValue}>{displayed}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

/* ─── Live bus ticker ──────────────────────────────────────────── */
const TICKER_ITEMS = [
  "🚌 Route 12A — Kovilpatti Bus Stand → Thoothukudi Central — ETA 4 min",
  "🚌 Route 15B — Tirunelveli → Nagercoil — ETA 11 min",
  "🚌 Route 7C — Madurai → Dindigul — ETA 7 min",
  "🚌 Route 22X — Chennai Central → Tambaram — ETA 3 min",
  "🚌 Route 8D — Coimbatore → Pollachi — ETA 14 min",
  "✅ Route 12A departed Kovilpatti 2 min ago — ON SCHEDULE",
];

function LiveTicker() {
  return (
    <div style={s.tickerWrap}>
      <div style={s.tickerBadge}>🔴 LIVE</div>
      <div style={s.tickerTrack}>
        <div style={s.tickerInner} className="ticker-scroll">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={s.tickerItem}>{item}<span style={s.tickerDot}>·</span></span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [navSolid, setNavSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => { setScrollY(window.scrollY); setNavSolid(window.scrollY > 60); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* intersection-based reveal — force-trigger hero elements already in viewport */
  useEffect(() => {
    const timer = setTimeout(() => {
      const els = document.querySelectorAll(".reveal");
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed"); });
      }, { threshold: 0.05, rootMargin: "0px 0px -20px 0px" });
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("revealed");
        } else {
          obs.observe(el);
        }
      });
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={s.root}>
      {/* ── CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: #060d1a; }

        /* ── Reveal animation ── */
        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .reveal.revealed { opacity: 1 !important; transform: translateY(0) !important; }
        /* Safety: if JS fails, still show content after 1s */
        @keyframes fallbackReveal { to { opacity: 1; transform: translateY(0); } }
        .reveal { animation: fallbackReveal 0s 1.2s forwards; }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }
        .reveal-d5 { transition-delay: 0.5s; }

        /* ── Bus driving animation ── */
        @keyframes driveBus {
          0%   { transform: translateX(-360px); }
          100% { transform: translateX(calc(100vw + 360px)); }
        }
        @keyframes busFloat {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50%       { transform: translateY(-8px) rotate(0.5deg); }
        }
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes roadScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-52px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes borderRotate {
          from { --angle: 0deg; }
          to   { --angle: 360deg; }
        }
        @keyframes pinBounce {
          0%, 100% { transform: translateY(0); }
          40%       { transform: translateY(-10px); }
          60%       { transform: translateY(-5px); }
        }
        @keyframes signalPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* ── Bus driving scene ── */
        .bus-scene { position: relative; width: 100%; overflow: hidden; }
        .driving-bus { animation: driveBus 18s linear infinite; }
        .driving-bus-slow { animation: driveBus 30s linear infinite; }
        .hero-bus { animation: busFloat 4s ease-in-out infinite; }

        /* ── Ticker ── */
        .ticker-scroll { animation: ticker-scroll 28s linear infinite; white-space: nowrap; }

        /* ── Feature cards ── */
        .feat-card {
          background: rgba(14,22,42,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 28px;
          cursor: default;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          overflow: hidden;
        }
        .feat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.4s;
        }
        .feat-card:hover {
          transform: translateY(-8px) scale(1.01);
          border-color: rgba(34,197,94,0.3);
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 40px var(--glow);
        }
        .feat-card:hover::before { opacity: 1; }

        /* ── Nav button hover ── */
        .nav-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .cta-pill:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(34,197,94,0.45) !important; }
        .sec-pill:hover { background: rgba(255,255,255,0.1) !important; }

        /* ── How step cards ── */
        .how-card:hover { transform: translateY(-6px); border-color: rgba(34,197,94,0.25) !important; }
        .how-card { transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }

        /* ── Footer column links ── */
        .fcol-link:hover { color: #e2e8f0 !important; background: rgba(255,255,255,0.05) !important; transform: translateX(4px); }
        .fcol-link { transition: all 0.22s cubic-bezier(0.16,1,0.3,1); }
        .foot-link:hover { color: #22c55e !important; border-color: rgba(34,197,94,0.3) !important; background: rgba(34,197,94,0.06) !important; }
        .foot-link { transition: all 0.2s; }

        /* ── Magnetic button effect ── */
        @keyframes magneticPulse {
          0%, 100% { box-shadow: 0 6px 28px rgba(34,197,94,0.35); }
          50%       { box-shadow: 0 6px 44px rgba(34,197,94,0.6), 0 0 60px rgba(34,197,94,0.15); }
        }
        .cta-pill { animation: magneticPulse 3s ease-in-out infinite; }
        .cta-pill:hover { animation: none; transform: translateY(-3px) scale(1.02); box-shadow: 0 16px 48px rgba(34,197,94,0.55) !important; }

        /* ── Particle float ── */
        @keyframes particleFloat {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
          33%  { transform: translateY(-30px) translateX(12px) scale(1.1); opacity: 0.4; }
          66%  { transform: translateY(-18px) translateX(-8px) scale(0.9); opacity: 0.7; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
        }
        .particle { animation: particleFloat var(--dur, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }

        /* ── Typewriter cursor ── */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .cursor { animation: blink 1s step-end infinite; color: #22c55e; }

        /* ── Glitch flicker on live badge ── */
        @keyframes glitch {
          0%, 90%, 100% { transform: translate(0); }
          92%           { transform: translate(-2px, 0); }
          94%           { transform: translate(2px, 0); }
          96%           { transform: translate(-1px, 0); }
        }
        .live-badge { animation: glitch 5s ease-in-out infinite; }

        /* ── Route line draw ── */
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to   { stroke-dashoffset: 0; }
        }
        .draw-line { stroke-dasharray: 1000; animation: drawLine 2s ease-out forwards; }

        /* ── Stats card hover glow ── */
        .stat-card:hover { background: rgba(34,197,94,0.04) !important; }
        .stat-card { transition: background 0.3s; cursor: default; }

        /* ── How card numbered glow ── */
        @keyframes stepGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(34,197,94,0.3)); }
          50%       { filter: drop-shadow(0 0 20px rgba(34,197,94,0.7)); }
        }
        .how-card:hover .step-num { animation: stepGlow 1.5s ease-in-out infinite; }

        /* ── Feature card spotlight sweep ── */
        @keyframes spotlightSweep {
          0%   { background-position: -200px center; }
          100% { background-position: 200px center; }
        }
        .feat-card:hover .feat-sweep {
          opacity: 1;
          animation: spotlightSweep 0.8s ease-out forwards;
        }
        .feat-sweep {
          position: absolute; inset: 0; border-radius: 20px; opacity: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%);
          background-size: 400px 100%; pointer-events: none;
        }

        /* ── Map pin pulse ── */
        .pin-pulse::after {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 2px solid #22c55e;
          animation: pulse-ring 1.8s ease-out infinite;
        }

        /* ── Shimmer text ── */
        .shimmer-text {
          background: linear-gradient(90deg, #22c55e, #60a5fa, #a78bfa, #22c55e);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        /* ── Road scene ── */
        .road-stripe { animation: roadScroll 1.2s linear infinite; }

        /* ── Signal bars ── */
        .sig1 { animation: signalPulse 1.2s ease-in-out infinite 0s; }
        .sig2 { animation: signalPulse 1.2s ease-in-out infinite 0.3s; }
        .sig3 { animation: signalPulse 1.2s ease-in-out infinite 0.6s; }

        /* ── Scroll indicator ── */
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50%       { transform: translateY(8px); opacity: 0.4; }
        }
        .scroll-ind { animation: scrollBounce 1.8s ease-in-out infinite; }

        /* ── Mobile responsive ── */
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: 38px !important; letter-spacing: -1.5px !important; }
          .hero-sub { font-size: 15px !important; }
          .nav-links { display: none; }
          .hero-bus-wrap { display: none; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }

        /* ── Glowing border card ── */
        @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        .glow-border {
          border: 1px solid transparent;
          background: linear-gradient(rgba(14,22,42,0.95), rgba(14,22,42,0.95)) padding-box,
                      conic-gradient(from var(--angle), #22c55e, #3b82f6, #a78bfa, #22c55e) border-box;
          animation: borderRotate 4s linear infinite;
        }
      `}</style>

      {/* ── Background grid texture ── */}
      <div style={s.bgGrid} />
      {/* ── Ambient blobs ── */}
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />

      {/* ══════════ LIVE TICKER ══════════ */}
      <LiveTicker />

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{ ...s.nav, background: navSolid ? "rgba(6,13,26,0.97)" : "rgba(6,13,26,0.6)", boxShadow: navSolid ? "0 1px 30px rgba(0,0,0,0.4)" : "none" }}>
        <div style={s.navInner}>
          <div style={s.logoWrap}>
            <img src={logoImg} alt="BusPulse" style={s.logoImg} />
            <span style={s.logoText}>
              <span style={{ color: "#22c55e" }}>Bus</span>
              <span style={{ color: "#60a5fa" }}>Pulse</span>
            </span>
          </div>

          <div style={s.navLinks} className="nav-links">
            {["Features", "How it Works", "Routes"].map(lnk => (
              <button
                key={lnk}
                onClick={() => document.getElementById(lnk.toLowerCase().replace(/ /g, "-"))?.scrollIntoView({ behavior: "smooth" })}
                style={s.navLink}
                className="nav-btn"
              >{lnk}</button>
            ))}
          </div>

          <div style={s.navActions}>
            <button onClick={() => navigate("/user/login")} style={s.loginBtn} className="nav-btn">Login</button>
            <button onClick={() => navigate("/user/login")} style={s.getStartedBtn} className="cta-pill">
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section style={s.hero}>
        {/* ── Floating particles ── */}
        {[
          { size: 4, top: "15%", left: "8%", dur: "7s", delay: "0s", color: "#22c55e" },
          { size: 3, top: "30%", left: "92%", dur: "9s", delay: "-3s", color: "#60a5fa" },
          { size: 5, top: "60%", left: "5%", dur: "11s", delay: "-5s", color: "#a78bfa" },
          { size: 3, top: "75%", left: "88%", dur: "8s", delay: "-2s", color: "#22c55e" },
          { size: 4, top: "20%", left: "78%", dur: "10s", delay: "-7s", color: "#f59e0b" },
          { size: 2, top: "50%", left: "15%", dur: "6s", delay: "-4s", color: "#60a5fa" },
        ].map((p, i) => (
          <div key={i} className="particle" style={{
            position: "absolute", width: p.size, height: p.size, borderRadius: "50%",
            background: p.color, top: p.top, left: p.left,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            "--dur": p.dur, "--delay": p.delay, pointerEvents: "none", zIndex: 0,
          }} />
        ))}

        {/* Badge */}
        <div style={s.heroBadge} className="reveal">
          <span style={s.pulseDot} />
          <span style={{ color: "#86efac", fontWeight: 700 }}>Live Now</span>
          <span style={{ color: "#475569" }}>·</span>
          <span style={{ color: "#64748b" }}>200+ Services Running</span>
          {/* Signal bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", marginLeft: "6px" }}>
            <div className="sig1" style={{ width: 3, height: 6, background: "#22c55e", borderRadius: 1 }} />
            <div className="sig2" style={{ width: 3, height: 9, background: "#22c55e", borderRadius: 1 }} />
            <div className="sig3" style={{ width: 3, height: 12, background: "#22c55e", borderRadius: 1 }} />
          </div>
        </div>

        {/* Title */}
        <h1 style={s.heroTitle} className="hero-title reveal reveal-d1">
          Never Miss Your<br />
          <span className="shimmer-text">Bus Again.</span>
        </h1>

        <p style={s.heroSub} className="hero-sub reveal reveal-d2">
          BusPulse delivers real-time bus arrival predictions for Tamil Nadu commuters —
          no GPS required. Built for <strong style={{ color: "#e2e8f0" }}>real routes, real roads, real people.</strong>
        </p>

        <div style={s.heroCTA} className="reveal reveal-d3">
          <button onClick={() => navigate("/user/login")} style={s.primaryBtn} className="cta-pill">
            🚀 Start Tracking Free
          </button>
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            style={s.secondaryBtn}
            className="sec-pill"
          >
            See How It Works ↓
          </button>
        </div>

        {/* ── Hero illustration: bus + road + stop ── */}
        <div style={s.heroBusWrap} className="reveal reveal-d4 hero-bus-wrap">
          {/* Road base */}
          <div style={s.road}>
            <RoadDashes />
            {/* Center line */}
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "2px dashed rgba(251,191,36,0.4)", transform: "translateY(-50%)" }} />
          </div>

          {/* Bus stop */}
          <div style={s.busStopWrap}>
            <BusStopSVG style={{ width: 60, height: 150 }} />
          </div>

          {/* Floating bus */}
          <div style={s.heroBusSvgWrap} className="hero-bus">
            <BusSVG style={{ width: "100%", height: "100%" }} />
          </div>

          {/* ETA bubble floating above bus */}
          <div style={s.etaBubble} className="glow-border">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Next Arrival</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#22c55e", fontFamily: "Plus Jakarta Sans, sans-serif", lineHeight: 1, letterSpacing: "-1px" }}>4 min</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac", padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>Route 12A</span>
              <span style={{ fontSize: 10, color: "#475569" }}>Approaching stop</span>
            </div>
          </div>

          {/* Map pin */}
          <div style={s.mapPin} className="pin-pulse">
            <svg width="28" height="36" viewBox="0 0 28 36">
              <path d="M14 0C6.27 0 0 6.27 0 14c0 9.75 14 22 14 22S28 23.75 28 14C28 6.27 21.73 0 14 0z" fill="#22c55e" />
              <circle cx="14" cy="14" r="5" fill="white" />
            </svg>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-ind" style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.4 }}>
          <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </div>
      </section>

      {/* ── Driving bus strip ── */}
      <div style={s.busStrip}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(90deg, rgba(34,197,94,0.03) 0px, rgba(34,197,94,0.03) 1px, transparent 1px, transparent 80px)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
          <div className="driving-bus" style={{ flexShrink: 0 }}>
            <BusSVG style={{ width: 200, height: 95 }} />
          </div>
        </div>
        <div style={s.busStripRoad}>
          <div style={{ display: "flex", gap: "16px", animation: "roadScroll 0.8s linear infinite" }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} style={{ width: "32px", height: "4px", background: "#fbbf24", borderRadius: 2, flexShrink: 0, opacity: 0.6 }} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ STATS ══════════ */}
      <section style={s.statsSection}>
        <div style={s.statsGrid} className="stats-grid">
          {STATS.map((st, i) => (
            <div key={st.label} className={`reveal reveal-d${i + 1}`}>
              <AnimatedStat {...st} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionBadge} className="reveal">✦ Features</div>
          <h2 style={s.sectionTitle} className="reveal reveal-d1">Everything you need<br />to commute smarter</h2>
          <p style={s.sectionSub} className="reveal reveal-d2">
            Built for regions without live GPS — schedule-based intelligence that just works.
          </p>
        </div>

        <div style={s.featuresGrid} className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`feat-card reveal reveal-d${(i % 3) + 1}`}
              style={{ "--glow": f.glow }}
            >
              <div className="feat-sweep" />
              <div style={{ ...s.featureIcon, background: f.color + "18", color: f.color, boxShadow: `0 0 20px ${f.color}22` }}>
                {f.icon}
              </div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)`, borderRadius: "0 0 20px 20px" }} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ ROUTE MAP VISUAL ══════════ */}
      <section style={s.mapSection}>
        <div style={s.sectionHeader}>
          <div style={s.sectionBadge} className="reveal">🗺️ Live Routes</div>
          <h2 style={s.sectionTitle} className="reveal reveal-d1">Your city, fully connected</h2>
          <p style={s.sectionSub} className="reveal reveal-d2">Real routes across Tamil Nadu — visualised in real time.</p>
        </div>

        {/* Stylised route map card */}
        <div style={s.mapCard} className="reveal glow-border">
          {/* SVG route map illustration */}
          <svg viewBox="0 0 700 320" style={{ width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            {/* Background */}
            <rect width="700" height="320" fill="#060d1a" rx="16" />

            {/* Grid */}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 52} y1="0" x2={i * 52} y2="320" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 52} x2="700" y2={i * 52} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            ))}

            {/* Route lines */}
            <polyline points="50,260 150,200 260,160 380,140 500,170 640,120" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8,4" opacity="0.8" />
            <polyline points="80,80 200,130 320,180 440,190 560,250" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            <polyline points="140,290 220,220 340,160 460,130 600,100" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <polyline points="60,150 180,170 300,140 420,110 540,130 650,160" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" opacity="0.5" />

            {/* Stops */}
            {[
              { x: 50, y: 260, label: "Kovilpatti", color: "#22c55e", active: true },
              { x: 150, y: 200, label: "Sivakasi", color: "#22c55e" },
              { x: 260, y: 160, label: "Virudhunagar", color: "#22c55e" },
              { x: 380, y: 140, label: "Madurai", color: "#22c55e", active: true },
              { x: 500, y: 170, label: "Dindigul", color: "#22c55e" },
              { x: 640, y: 120, label: "Thoothukudi", color: "#22c55e", active: true },
              { x: 80, y: 80, label: "Chennai", color: "#3b82f6", active: true },
              { x: 320, y: 180, label: "Trichy", color: "#3b82f6" },
              { x: 560, y: 250, label: "Nagercoil", color: "#3b82f6" },
            ].map((stop) => (
              <g key={stop.label}>
                {stop.active && <circle cx={stop.x} cy={stop.y} r="14" fill={stop.color} opacity="0.12" />}
                {stop.active && <circle cx={stop.x} cy={stop.y} r="10" fill={stop.color} opacity="0.2" />}
                <circle cx={stop.x} cy={stop.y} r={stop.active ? 6 : 4} fill={stop.color} />
                <circle cx={stop.x} cy={stop.y} r={stop.active ? 3 : 2} fill="white" />
                <text x={stop.x} y={stop.y - 14} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="DM Sans" fontWeight="600">{stop.label}</text>
              </g>
            ))}

            {/* Moving bus dot on route 1 */}
            <circle r="7" fill="#22c55e" opacity="0.9">
              <animateMotion dur="8s" repeatCount="indefinite" path="M50,260 L150,200 L260,160 L380,140 L500,170 L640,120" />
            </circle>
            <circle r="3" fill="white" opacity="1">
              <animateMotion dur="8s" repeatCount="indefinite" path="M50,260 L150,200 L260,160 L380,140 L500,170 L640,120" />
            </circle>

            {/* Moving bus dot on route 2 */}
            <circle r="5" fill="#3b82f6" opacity="0.9">
              <animateMotion dur="12s" repeatCount="indefinite" path="M80,80 L200,130 L320,180 L440,190 L560,250" />
            </circle>

            {/* Legend */}
            {[
              { color: "#22c55e", label: "Route 12A · Kovilpatti–Thoothukudi" },
              { color: "#3b82f6", label: "Route 15B · Chennai–Nagercoil" },
              { color: "#a78bfa", label: "Route 7C · Madurai–Trichy" },
              { color: "#f59e0b", label: "Route 22X · Express Limited" },
            ].map((l, i) => (
              <g key={l.label} transform={`translate(20, ${260 + i * 0})`}>
              </g>
            ))}
          </svg>

          {/* Legend below */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: 20, justifyContent: "center" }}>
            {[
              { color: "#22c55e", label: "Route 12A" },
              { color: "#3b82f6", label: "Route 15B" },
              { color: "#a78bfa", label: "Route 7C" },
              { color: "#f59e0b", label: "Route 22X" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                <div style={{ width: 24, height: 3, background: l.color, borderRadius: 2 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" style={s.howSection}>
        <div style={s.sectionHeader}>
          <div style={s.sectionBadge} className="reveal">⚡ How it works</div>
          <h2 style={s.sectionTitle} className="reveal reveal-d1">Three steps to your next bus</h2>
        </div>

        <div style={s.howGrid} className="how-grid">
          {HOW_IT_WORKS.map((h, i) => (
            <div key={h.step} className={`how-card reveal reveal-d${i + 1}`} style={s.howCard}>
              <div style={s.howStep} className="step-num">{h.step}</div>
              <div style={s.howIconWrap}>{h.icon}</div>
              <h3 style={s.howTitle}>{h.title}</h3>
              <p style={s.howDesc}>{h.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <div style={s.howConnector}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ APP MOCKUP / CARD ══════════ */}
      <section style={{ ...s.section, paddingTop: 20 }}>
        <div style={{ display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          {/* Phone mockup */}
          <div className="reveal" style={{ flexShrink: 0 }}>
            <div style={s.phoneMockup}>
              <div style={s.phoneScreen}>
                {/* App header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Good morning 👋</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "Plus Jakarta Sans" }}>Your Routes</div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                </div>

                {/* Search bar */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12 }}>🔍</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>Search stops, routes...</span>
                </div>

                {/* Bus cards */}
                {[
                  { route: "12A", from: "Kovilpatti", to: "Thoothukudi", eta: "4 min", status: "LIVE", color: "#22c55e" },
                  { route: "15B", from: "Tirunelveli", to: "Nagercoil", eta: "11 min", status: "ON TIME", color: "#3b82f6" },
                  { route: "7C", from: "Madurai", to: "Dindigul", eta: "18 min", status: "DELAYED", color: "#f59e0b" },
                ].map((card, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${card.color}30`, borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ background: card.color + "20", color: card.color, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5 }}>Route {card.route}</span>
                        <span style={{ fontSize: 9, color: card.color + "aa", fontWeight: 600 }}>● {card.status}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: card.color, fontFamily: "Plus Jakarta Sans" }}>{card.eta}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{card.from} <span style={{ color: card.color }}>→</span> {card.to}</div>
                  </div>
                ))}

                {/* Bottom nav */}
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {["🏠", "🗺️", "🔔", "👤"].map((icon, i) => (
                    <div key={i} style={{ fontSize: 18, opacity: i === 0 ? 1 : 0.35 }}>{icon}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Text side */}
          <div style={{ maxWidth: 420 }} className="reveal reveal-d2">
            <div style={s.sectionBadge}>📱 Mobile Ready</div>
            <h2 style={{ ...s.sectionTitle, textAlign: "left", marginTop: 16 }}>Track buses from your pocket</h2>
            <p style={{ ...s.sectionSub, textAlign: "left", margin: "16px 0 28px" }}>
              BusPulse works on any device, any browser. No app download needed — just open and go. Optimised for low-data connections across Tamil Nadu.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Works on any smartphone or browser", "Offline schedule access", "Push notifications for approaching buses", "Low data usage — under 5KB per update"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 14, color: "#94a3b8" }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/user/login")} style={{ ...s.primaryBtn, marginTop: 32 }} className="cta-pill">
              Try BusPulse Now →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section style={s.ctaSection}>
        <div style={s.ctaCard} className="reveal">
          {/* Decorative bus silhouette */}
          <div style={{ position: "absolute", right: -20, bottom: 0, opacity: 0.05 }}>
            <BusSVG style={{ width: 400, height: 190 }} />
          </div>
          <div style={s.ctaBlob} />
          <div style={s.ctaBlob2} />
          <span style={s.sectionBadge}>🚌 Start Today</span>
          <h2 style={{ ...s.ctaTitle, marginTop: 16 }}>Ready to ride smarter?</h2>
          <p style={s.ctaSub}>
            Join thousands of Tamil Nadu commuters who never miss their bus.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/user/login")} style={s.ctaBtn} className="cta-pill">
              Get Started for Free →
            </button>
            <button onClick={() => navigate("/admin/login")} style={s.secondaryBtn} className="sec-pill">
              Admin Portal
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={s.footer}>
        {/* ── Animated road strip with driving bus ── */}
        <div style={{ position: "relative", height: 72, overflow: "hidden", background: "#040a14", borderBottom: "1px solid rgba(34,197,94,0.08)" }}>
          {/* Road surface */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 20, background: "#0c1525" }} />
          {/* Road markings */}
          <div style={{ position: "absolute", bottom: 7, left: 0, right: 0, height: 4, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: "14px", animation: "roadScroll 0.9s linear infinite" }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} style={{ width: 36, height: 4, background: "rgba(251,191,36,0.5)", borderRadius: 2, flexShrink: 0 }} />
              ))}
            </div>
          </div>
          {/* Curb lines */}
          <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.06)" }} />
          {/* Bus 1 */}
          <div className="driving-bus-slow" style={{ position: "absolute", bottom: 18 }}>
            <BusSVG style={{ width: 130, height: 58 }} />
          </div>
          {/* Bus 2 offset */}
          <div style={{ animation: "driveBus 22s linear infinite", animationDelay: "-11s", position: "absolute", bottom: 18 }}>
            <BusSVG style={{ width: 110, height: 50, opacity: 0.6 }} />
          </div>
        </div>

        {/* ── Footer body ── */}
        <div style={s.footerBody}>
          <div style={s.footerGrid} className="footer-grid">

            {/* Brand column */}
            <div style={s.footerBrandCol}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <img src={logoImg} alt="BusPulse" style={{ width: 40, height: 40, objectFit: "contain" }} />
                <span style={{ fontSize: 26, fontWeight: 900, fontFamily: "Plus Jakarta Sans, sans-serif", letterSpacing: "-0.5px" }}>
                  <span style={{ color: "#22c55e" }}>Bus</span>
                  <span style={{ color: "#60a5fa" }}>Pulse</span>
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.8, maxWidth: 240, marginBottom: 20 }}>
                Real-time bus arrival predictions for Tamil Nadu. Built for commuters who move the state.
              </p>
              {/* Status badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 999, padding: "6px 14px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e", animation: "pulse-ring 1.8s ease-out infinite" }} />
                <span style={{ fontSize: 12, color: "#86efac", fontWeight: 700 }}>All systems operational</span>
              </div>
            </div>

            {/* Quick Links */}
            <div style={s.footerCol}>
              <h4 style={s.footerColTitle}>Quick Access</h4>
              <div style={s.footerColLinks}>
                {[
                  { label: "Track My Bus", path: "/user/login", icon: "🚌" },
                  { label: "View Routes", path: "/user/login", icon: "🗺️" },
                  { label: "Schedule", path: "/user/login", icon: "📅" },
                  { label: "Set Alerts", path: "/user/login", icon: "🔔" },
                ].map(({ label, path, icon }) => (
                  <button key={label} onClick={() => navigate(path)} style={s.footerColLink} className="fcol-link">
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Portals */}
            <div style={s.footerCol}>
              <h4 style={s.footerColTitle}>Portals</h4>
              <div style={s.footerColLinks}>
                {[
                  { label: "User Login", path: "/user/login", icon: "👤" },
                  { label: "Admin Portal", path: "/admin/login", icon: "🔧" },
                  { label: "Scheduler", path: "/login", icon: "📋" },
                ].map(({ label, path, icon }) => (
                  <button key={label} onClick={() => navigate(path)} style={s.footerColLink} className="fcol-link">
                    <span style={{ fontSize: 14 }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live stats mini */}
            <div style={s.footerCol}>
              <h4 style={s.footerColTitle}>Live Now</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Buses on road", value: "143", color: "#22c55e" },
                  { label: "Active routes", value: "38", color: "#3b82f6" },
                  { label: "Avg wait time", value: "6 min", color: "#a78bfa" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "Plus Jakarta Sans, sans-serif" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer bottom bar ── */}
          <div style={s.footerBottom}>
            <span style={{ fontSize: 13, color: "#334155" }}>© 2026 BusPulse · Tamil Nadu, India</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "#334155" }}>Built for commuters, by commuters</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── styles ──────────────────────────────────────────────────── */
const s = {
  root: {
    minHeight: "100vh",
    background: "#060d1a",
    color: "#f1f5f9",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },

  bgGrid: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
  },

  blob1: {
    position: "fixed", top: -160, left: -160, width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.10) 0%, transparent 65%)",
    filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", bottom: -120, right: -120, width: 560, height: 560, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 65%)",
    filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
  },
  blob3: {
    position: "fixed", top: "35%", left: "45%", width: 380, height: 380, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 65%)",
    filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
  },

  /* ticker */
  tickerWrap: {
    position: "relative", zIndex: 100,
    background: "rgba(6,13,26,0.95)", borderBottom: "1px solid rgba(34,197,94,0.15)",
    display: "flex", alignItems: "center", height: 36, overflow: "hidden",
  },
  tickerBadge: {
    background: "#22c55e", color: "#000", fontSize: 10, fontWeight: 800,
    padding: "0 12px", height: "100%", display: "flex", alignItems: "center",
    flexShrink: 0, letterSpacing: 1, zIndex: 2, whiteSpace: "nowrap",
  },
  tickerTrack: { flex: 1, overflow: "hidden", position: "relative" },
  tickerInner: { display: "inline-flex", alignItems: "center" },
  tickerItem: { fontSize: 12, color: "#64748b", padding: "0 24px", fontWeight: 500 },
  tickerDot: { marginLeft: 24, color: "#22c55e", fontWeight: 900 },

  /* nav */
  nav: {
    position: "sticky", top: 0, zIndex: 90,
    backdropFilter: "blur(24px)", transition: "background 0.3s, box-shadow 0.3s",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  navInner: {
    maxWidth: 1200, margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 24px",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 10 },
  logoImg: { width: 36, height: 36, objectFit: "contain" },
  logoText: { fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", fontFamily: "Plus Jakarta Sans, sans-serif" },
  navLinks: { display: "flex", alignItems: "center", gap: 4 },
  navLink: {
    background: "transparent", border: "none", color: "#94a3b8",
    fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 14px",
    borderRadius: 8, transition: "all 0.2s", fontFamily: "DM Sans, sans-serif",
  },
  navActions: { display: "flex", alignItems: "center", gap: 10 },
  loginBtn: {
    padding: "8px 18px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer",
    transition: "background 0.2s", fontFamily: "DM Sans, sans-serif",
  },
  getStartedBtn: {
    padding: "8px 20px", borderRadius: 10,
    background: "linear-gradient(135deg,#22c55e,#15803d)",
    border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", transition: "all 0.25s",
    boxShadow: "0 4px 20px rgba(34,197,94,0.3)", fontFamily: "DM Sans, sans-serif",
  },

  /* hero */
  hero: {
    position: "relative", zIndex: 1,
    maxWidth: 900, margin: "0 auto",
    padding: "80px 24px 40px",
    display: "flex", flexDirection: "column", alignItems: "center",
    textAlign: "center",
  },
  heroBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)",
    borderRadius: 999, padding: "6px 16px",
    fontSize: 12, marginBottom: 28,
    backdropFilter: "blur(10px)",
  },
  pulseDot: {
    width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
    display: "inline-block", boxShadow: "0 0 0 0 rgba(34,197,94,0.4)",
    animation: "pulse-ring 1.8s ease-out infinite",
    position: "relative",
  },
  heroTitle: {
    fontSize: 72, fontWeight: 900, lineHeight: 1.1,
    letterSpacing: "-2px", color: "#f8fafc",
    marginBottom: 28, fontFamily: "Plus Jakarta Sans, sans-serif",
    wordSpacing: "2px",
  },
  heroSub: {
    fontSize: 18, lineHeight: 1.85, color: "#64748b",
    maxWidth: 540, marginBottom: 44,
    letterSpacing: "0.1px",
  },
  heroCTA: { display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 },
  primaryBtn: {
    padding: "14px 32px", borderRadius: 12,
    background: "linear-gradient(135deg,#22c55e,#15803d)",
    border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", transition: "all 0.25s",
    boxShadow: "0 6px 28px rgba(34,197,94,0.35)", fontFamily: "DM Sans, sans-serif",
  },
  secondaryBtn: {
    padding: "14px 28px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#94a3b8", fontSize: 15, fontWeight: 600,
    cursor: "pointer", transition: "background 0.2s", fontFamily: "DM Sans, sans-serif",
  },

  /* hero bus illustration */
  heroBusWrap: {
    position: "relative", width: "100%", maxWidth: 700, height: 220,
    marginBottom: 20,
  },
  road: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
    background: "#0f172a", borderRadius: "0 0 16px 16px",
    borderTop: "2px solid #1e293b", overflow: "hidden",
  },
  busStopWrap: {
    position: "absolute", right: 60, bottom: 30, zIndex: 3,
  },
  heroBusSvgWrap: {
    position: "absolute", left: "12%", bottom: 32, width: 380, height: 165, zIndex: 2,
  },
  etaBubble: {
    position: "absolute", top: 10, right: 10, zIndex: 4,
    background: "rgba(14,22,42,0.95)", borderRadius: 16, padding: "14px 18px",
    display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start",
    backdropFilter: "blur(20px)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
  },
  mapPin: { position: "absolute", top: 10, left: "30%", zIndex: 4, animation: "pinBounce 2.5s ease-in-out infinite" },

  /* bus driving strip */
  busStrip: {
    position: "relative", zIndex: 1,
    height: 80, background: "#080f1e", overflow: "hidden",
    borderTop: "1px solid rgba(34,197,94,0.08)",
    borderBottom: "1px solid rgba(34,197,94,0.08)",
  },
  busStripRoad: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
    display: "flex", overflow: "hidden",
  },

  /* stats */
  statsSection: {
    position: "relative", zIndex: 1,
    borderTop: "1px solid rgba(255,255,255,0.04)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(10,17,30,0.6)",
  },
  statsGrid: {
    maxWidth: 1000, margin: "0 auto",
    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
    gap: "1px", background: "rgba(255,255,255,0.04)",
  },
  statCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "44px 20px",
    background: "rgba(6,13,26,0.8)", gap: 6,
    transition: "background 0.2s",
  },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: {
    fontSize: 44, fontWeight: 900, color: "#f1f5f9",
    letterSpacing: "-1.5px", fontFamily: "Plus Jakarta Sans, sans-serif",
    background: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  statLabel: { fontSize: 12, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.8px" },

  /* section */
  section: { position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "100px 24px" },
  sectionHeader: { textAlign: "center", marginBottom: 64 },
  sectionBadge: {
    display: "inline-block",
    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 999, padding: "5px 16px",
    fontSize: 12, fontWeight: 700, color: "#60a5fa",
    marginBottom: 16, letterSpacing: "0.5px", textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#f8fafc",
    marginBottom: 16, letterSpacing: "-1.5px", lineHeight: 1.15,
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  sectionSub: { fontSize: 16, color: "#475569", maxWidth: 520, margin: "0 auto", lineHeight: 1.8 },

  /* features */
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 },
  featureIcon: { width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18 },
  featureTitle: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 10, fontFamily: "Plus Jakarta Sans, sans-serif" },
  featureDesc: { fontSize: 14, color: "#475569", lineHeight: 1.75 },

  /* map section */
  mapSection: { position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "60px 24px 100px" },
  mapCard: {
    background: "rgba(6,13,26,0.9)", borderRadius: 20, padding: 24,
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
  },

  /* how */
  howSection: { position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "60px 24px 100px" },
  howGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28, position: "relative" },
  howCard: {
    background: "rgba(10,17,30,0.8)", backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20,
    padding: "36px 28px", textAlign: "center", position: "relative",
  },
  howStep: {
    fontSize: 52, fontWeight: 900, fontFamily: "Plus Jakarta Sans, sans-serif",
    background: "linear-gradient(135deg,#22c55e,#60a5fa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text", marginBottom: 12, lineHeight: 1,
  },
  howIconWrap: { fontSize: 36, marginBottom: 16 },
  howTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", marginBottom: 10, fontFamily: "Plus Jakarta Sans, sans-serif" },
  howDesc: { fontSize: 14, color: "#475569", lineHeight: 1.75 },
  howConnector: { position: "absolute", top: "42%", right: -20, transform: "translateY(-50%)", zIndex: 2 },

  /* phone mockup */
  phoneMockup: {
    width: 240, background: "#060d1a",
    border: "2px solid rgba(255,255,255,0.08)", borderRadius: 32,
    padding: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.1)",
  },
  phoneScreen: { background: "#0a111e", borderRadius: 22, padding: 16, minHeight: 420 },

  /* CTA */
  ctaSection: { position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto 80px", padding: "0 24px" },
  ctaCard: {
    position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg,rgba(34,197,94,0.06) 0%,rgba(59,130,246,0.04) 100%)",
    border: "1px solid rgba(34,197,94,0.15)", borderRadius: 28,
    padding: "80px 40px", textAlign: "center",
    boxShadow: "0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
  ctaBlob: {
    position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(34,197,94,0.12) 0%,transparent 70%)",
    filter: "blur(50px)", pointerEvents: "none",
  },
  ctaBlob2: {
    position: "absolute", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%",
    background: "radial-gradient(circle,rgba(59,130,246,0.1) 0%,transparent 70%)",
    filter: "blur(40px)", pointerEvents: "none",
  },
  ctaTitle: { fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: "#f8fafc", marginBottom: 16, letterSpacing: "-1.5px", fontFamily: "Plus Jakarta Sans, sans-serif" },
  ctaSub: { fontSize: 17, color: "#64748b", marginBottom: 36, lineHeight: 1.7 },
  ctaBtn: {
    padding: "15px 40px", borderRadius: 12,
    background: "linear-gradient(135deg,#22c55e,#15803d)",
    border: "none", color: "#fff", fontSize: 16, fontWeight: 700,
    cursor: "pointer", transition: "all 0.25s",
    boxShadow: "0 6px 28px rgba(34,197,94,0.4)", fontFamily: "DM Sans, sans-serif",
  },

  /* footer */
  footer: { position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", background: "#040a14" },
  footerBody: { maxWidth: 1200, margin: "0 auto", padding: "64px 32px 0" },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
    gap: "48px",
    marginBottom: 48,
  },
  footerBrandCol: { display: "flex", flexDirection: "column" },
  footerCol: { display: "flex", flexDirection: "column" },
  footerColTitle: {
    fontSize: 11, fontWeight: 800, color: "#334155",
    textTransform: "uppercase", letterSpacing: "1.5px",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  footerColLinks: { display: "flex", flexDirection: "column", gap: 4 },
  footerColLink: {
    display: "flex", alignItems: "center", gap: 10,
    background: "transparent", border: "none",
    color: "#475569", fontSize: 14, fontWeight: 500,
    cursor: "pointer", padding: "8px 10px", borderRadius: 8,
    textAlign: "left", fontFamily: "DM Sans, sans-serif",
    transition: "all 0.2s",
  },
  footerBottom: {
    borderTop: "1px solid rgba(255,255,255,0.04)",
    padding: "24px 0 32px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 12,
  },
  /* old footer styles kept for compatibility */
  footerInner: { maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  footerLogo: { display: "flex", alignItems: "center", gap: 8 },
  footerLogoImg: { width: 28, height: 28, objectFit: "contain" },
  footerTagline: { fontSize: 13, color: "#334155", fontWeight: 500 },
  footerCopy: { fontSize: 12, color: "#1e293b" },
  footerLinks: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 },
  footerLink: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    color: "#475569", borderRadius: 8, padding: "7px 16px",
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
  },
};