import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_ENABLED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.length > 10);

/* ─── Inline styles ─────────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById("buspulse-styles")) return;
  const style = document.createElement("style");
  style.id = "buspulse-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .bp-page {
      min-height: 100vh;
      background: #0a0f1e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'DM Sans', sans-serif;
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    /* ── Road Scene ── */
    .bp-scene {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    /* Night sky gradient */
    .bp-sky {
      position: absolute;
      inset: 0;
      background: linear-gradient(175deg, #040810 0%, #0a1428 40%, #0d1f3c 70%, #071530 100%);
    }

    /* Stars */
    .bp-star {
      position: absolute;
      border-radius: 50%;
      background: #fff;
      animation: bp-twinkle var(--dur, 3s) ease-in-out infinite;
      animation-delay: var(--delay, 0s);
    }
    @keyframes bp-twinkle {
      0%, 100% { opacity: var(--max-op, 0.8); transform: scale(1); }
      50% { opacity: 0.1; transform: scale(0.5); }
    }

    /* City skyline */
    .bp-city {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }

    /* Road */
    .bp-road {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: #111827;
    }
    .bp-road-line {
      position: absolute;
      top: 50%;
      left: -100%;
      width: 200%;
      height: 4px;
      background: repeating-linear-gradient(90deg, #f59e0b 0px, #f59e0b 60px, transparent 60px, transparent 120px);
      animation: bp-road-scroll 3s linear infinite;
    }
    @keyframes bp-road-scroll {
      from { transform: translateX(0); }
      to { transform: translateX(120px); }
    }
    .bp-road-edge {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: #374151;
    }
    .bp-road-kerb {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: #374151;
    }

    /* Bus */
    .bp-bus-wrap {
      position: absolute;
      bottom: 30px;
      left: -340px;
      width: 320px;
      height: 90px;
      animation: bp-bus-drive 18s linear infinite;
    }
    @keyframes bp-bus-drive {
      0%   { left: -340px; }
      100% { left: 110%; }
    }
    .bp-bus-body {
      position: absolute;
      bottom: 16px;
      left: 10px;
      right: 10px;
      height: 62px;
      background: linear-gradient(180deg, #22c55e 0%, #16a34a 60%, #15803d 100%);
      border-radius: 10px 10px 4px 4px;
      box-shadow: 0 0 40px rgba(34,197,94,0.4);
    }
    .bp-bus-roof {
      position: absolute;
      top: -8px;
      left: 14px;
      right: 14px;
      height: 14px;
      background: #16a34a;
      border-radius: 6px 6px 0 0;
    }
    .bp-bus-window-row {
      position: absolute;
      top: 8px;
      left: 14px;
      right: 50px;
      display: flex;
      gap: 5px;
    }
    .bp-bus-window {
      flex: 1;
      height: 20px;
      background: rgba(255,255,255,0.9);
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    }
    .bp-bus-window::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, rgba(147,197,253,0.5) 0%, rgba(255,255,255,0.3) 100%);
    }
    .bp-bus-front {
      position: absolute;
      top: 8px;
      right: 6px;
      width: 38px;
      height: 20px;
      background: rgba(255,255,255,0.85);
      border-radius: 3px;
    }
    .bp-bus-door {
      position: absolute;
      bottom: 0;
      right: 20px;
      width: 20px;
      height: 22px;
      background: rgba(0,0,0,0.3);
      border-radius: 3px 3px 0 0;
      border: 1px solid rgba(0,0,0,0.2);
    }
    .bp-bus-stripe {
      position: absolute;
      left: 0; right: 0;
      top: 32px;
      height: 3px;
      background: rgba(255,255,255,0.35);
    }
    .bp-bus-headlight {
      position: absolute;
      right: 6px;
      bottom: 12px;
      width: 10px;
      height: 8px;
      background: #fef08a;
      border-radius: 2px;
      box-shadow: 0 0 16px 6px rgba(254,240,138,0.6), 40px 0 60px 20px rgba(254,240,138,0.15);
    }
    .bp-bus-undercarriage {
      position: absolute;
      bottom: 8px;
      left: 10px; right: 10px;
      height: 10px;
      background: #0f172a;
      border-radius: 0 0 4px 4px;
    }
    .bp-bus-wheel {
      position: absolute;
      bottom: 0;
      width: 28px;
      height: 28px;
      background: #1e293b;
      border-radius: 50%;
      border: 4px solid #374151;
      animation: bp-wheel-spin 0.6s linear infinite;
    }
    .bp-bus-wheel::after {
      content: '';
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background: #475569;
    }
    @keyframes bp-wheel-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .bp-bus-wheel-l { left: 20px; }
    .bp-bus-wheel-r { right: 20px; }

    /* Lamp post */

    /* ── Card ── */
    .bp-card {
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border: 1px solid rgba(34,197,94,0.15);
      border-radius: 28px;
      padding: 40px 38px 36px;
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 10;
      box-shadow:
        0 0 0 1px rgba(34,197,94,0.08),
        0 40px 100px rgba(0,0,0,0.7),
        inset 0 1px 0 rgba(255,255,255,0.05);
      animation: bp-card-in 0.6s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes bp-card-in {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Green glow behind card */
    .bp-card::before {
      content: '';
      position: absolute;
      top: -60px; left: -60px; right: -60px; bottom: -60px;
      background: radial-gradient(ellipse at 50% 20%, rgba(34,197,94,0.12) 0%, transparent 65%);
      pointer-events: none;
      border-radius: 50%;
      z-index: -1;
    }

    /* ── Logo ── */
    .bp-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }
    .bp-logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 4px 20px rgba(34,197,94,0.4);
      animation: bp-logo-pulse 3s ease-in-out infinite;
    }
    @keyframes bp-logo-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(34,197,94,0.4); }
      50% { box-shadow: 0 4px 32px rgba(34,197,94,0.7); }
    }
    .bp-logo-text { font-family: 'Plus Jakarta Sans', sans-serif; }
    .bp-logo-name { font-size: 22px; font-weight: 800; color: #f1f5f9; letter-spacing: -0.5px; }
    .bp-logo-sub  { font-size: 11px; font-weight: 400; color: #64748b; letter-spacing: 2px; text-transform: uppercase; }

    /* ── Tabs ── */
    .bp-tabs {
      display: flex;
      background: rgba(255,255,255,0.04);
      border-radius: 14px;
      padding: 4px;
      margin-bottom: 26px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .bp-tab {
      flex: 1;
      padding: 10px;
      border: none;
      background: none;
      color: #64748b;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
      letter-spacing: 0.2px;
    }
    .bp-tab:hover:not(.bp-tab-active) { color: #94a3b8; background: rgba(255,255,255,0.04); }
    .bp-tab-active {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #fff;
      box-shadow: 0 4px 16px rgba(34,197,94,0.35);
    }

    /* ── Alert boxes ── */
    .bp-error {
      background: rgba(239,68,68,0.10);
      border: 1px solid rgba(239,68,68,0.25);
      color: #fca5a5;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: bp-shake 0.4s ease;
    }
    @keyframes bp-shake {
      0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
    }
    .bp-info {
      background: rgba(34,197,94,0.08);
      border: 1px solid rgba(34,197,94,0.20);
      color: #86efac;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* ── Form ── */
    .bp-form { display: flex; flex-direction: column; }
    .bp-field { margin-bottom: 18px; }
    .bp-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .bp-input {
      width: 100%;
      padding: 13px 16px;
      border-radius: 13px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      color: #f1f5f9;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .bp-input::placeholder { color: #334155; }
    .bp-input:focus {
      border-color: rgba(34,197,94,0.5);
      background: rgba(34,197,94,0.04);
      box-shadow: 0 0 0 3px rgba(34,197,94,0.10);
    }
    .bp-pass-wrap { position: relative; }
    .bp-eye {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #475569;
      padding: 4px;
      transition: color 0.2s;
    }
    .bp-eye:hover { color: #94a3b8; }

    /* ── Submit button ── */
    .bp-btn {
      width: 100%;
      padding: 14px;
      border-radius: 13px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #fff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 700;
      font-size: 15px;
      border: none;
      cursor: pointer;
      margin-top: 6px;
      margin-bottom: 18px;
      transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
      box-shadow: 0 4px 20px rgba(34,197,94,0.35);
      position: relative;
      overflow: hidden;
      letter-spacing: 0.3px;
    }
    .bp-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .bp-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(34,197,94,0.5);
    }
    .bp-btn:hover:not(:disabled)::after { opacity: 1; }
    .bp-btn:active:not(:disabled) { transform: translateY(0); }
    .bp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    /* Loading dots inside button */
    .bp-btn-loading {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .bp-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: rgba(255,255,255,0.8);
      animation: bp-bounce 1.2s ease-in-out infinite;
    }
    .bp-dot:nth-child(2) { animation-delay: 0.15s; }
    .bp-dot:nth-child(3) { animation-delay: 0.30s; }
    @keyframes bp-bounce {
      0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)}
    }

    /* ── Divider ── */
    .bp-divider {
      display: flex; align-items: center; gap: 12px; margin-bottom: 18px;
    }
    .bp-div-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
    .bp-div-text { color: #334155; font-size: 12px; }

    /* ── Google button wrapper ── */
    .bp-google-wrap { display: flex; justify-content: center; margin-bottom: 4px; }

    /* ── OTP ── */
    .bp-otp-header {
      text-align: center;
      margin-bottom: 24px;
    }
    .bp-otp-icon {
      width: 56px; height: 56px;
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.2);
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px;
      margin: 0 auto 14px;
      animation: bp-otp-appear 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes bp-otp-appear {
      from { opacity:0; transform:scale(0.7) rotate(-10deg); }
      to   { opacity:1; transform:scale(1) rotate(0deg); }
    }
    .bp-otp-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 6px;
    }
    .bp-otp-sub {
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
    }
    .bp-otp-email { color: #22c55e; font-weight: 600; }

    /* OTP digit boxes */
    .bp-otp-boxes {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 22px;
    }
    .bp-otp-digit {
      width: 46px; height: 54px;
      border-radius: 12px;
      background: rgba(255,255,255,0.04);
      border: 1.5px solid rgba(255,255,255,0.08);
      color: #22c55e;
      font-size: 24px;
      font-weight: 800;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
      outline: none;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
      caret-color: #22c55e;
    }
    .bp-otp-digit:focus {
      border-color: #22c55e;
      background: rgba(34,197,94,0.06);
      box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
      transform: scale(1.05);
    }
    .bp-otp-digit.filled {
      border-color: rgba(34,197,94,0.4);
      background: rgba(34,197,94,0.06);
    }

    .bp-resend-row {
      display: flex; justify-content: space-between; align-items: center; margin-top: 6px;
    }
    .bp-countdown { font-size: 12px; color: #475569; }
    .bp-resend-btn {
      background: none; border: none; color: #22c55e; font-size: 12px;
      cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif;
      transition: opacity 0.2s;
    }
    .bp-resend-btn:hover { opacity: 0.75; }
    .bp-back-btn {
      background: none; border: none; color: #475569; font-size: 12px;
      cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.2s;
    }
    .bp-back-btn:hover { color: #94a3b8; }

    /* ── Route badge ── */
    .bp-route-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(34,197,94,0.06);
      border: 1px solid rgba(34,197,94,0.12);
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 22px;
      font-size: 12px;
      color: #64748b;
    }
    .bp-route-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
      box-shadow: 0 0 8px rgba(34,197,94,0.8);
      animation: bp-dot-pulse 2s ease-in-out infinite;
    }
    @keyframes bp-dot-pulse {
      0%,100%{box-shadow:0 0 6px rgba(34,197,94,0.8)} 50%{box-shadow:0 0 14px rgba(34,197,94,1)}
    }

    /* ── Progress bar (signup step) ── */
    .bp-step-bar {
      display: flex; gap: 6px; margin-bottom: 22px;
    }
    .bp-step-seg {
      flex: 1; height: 3px; border-radius: 99px;
      background: rgba(255,255,255,0.07);
      transition: background 0.4s;
    }
    .bp-step-seg.active { background: #22c55e; }

    /* ── Fade enter animation for form sections ── */
    .bp-form-enter {
      animation: bp-fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both;
    }
    @keyframes bp-fade-up {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

/* ─── Star field ─────────────────────────────────────────────────── */
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 60,
  size: Math.random() * 2 + 0.5,
  dur: (Math.random() * 3 + 2).toFixed(1),
  delay: (Math.random() * 4).toFixed(1),
  op: (Math.random() * 0.4 + 0.4).toFixed(2),
}));

/* ─── City SVG ───────────────────────────────────────────────────── */
function CityScape() {
  // Each building: x, y (top), w, h, color, windows [{cx, cy}]
  // All window coords are ABSOLUTE svg coords; clipPath ensures they stay inside the building.
  const W = 900, H = 280;
  const buildings = [
    { id: 0, x: 0, y: 60, w: 58, h: 220, color: "#0b1828", wins: [{ x: 6, y: 72 }, { x: 22, y: 72 }, { x: 38, y: 72 }, { x: 6, y: 100 }, { x: 38, y: 100 }, { x: 6, y: 128 }, { x: 22, y: 128 }, { x: 6, y: 156 }, { x: 38, y: 156 }, { x: 22, y: 184 }] },
    { id: 1, x: 53, y: 105, w: 44, h: 175, color: "#091420", wins: [{ x: 58, y: 116 }, { x: 74, y: 116 }, { x: 58, y: 142 }, { x: 74, y: 142 }, { x: 58, y: 168 }, { x: 74, y: 194 }] },
    { id: 2, x: 92, y: 35, w: 68, h: 245, color: "#0c1a2e", wins: [{ x: 98, y: 48 }, { x: 115, y: 48 }, { x: 132, y: 48 }, { x: 98, y: 76 }, { x: 132, y: 76 }, { x: 115, y: 104 }, { x: 98, y: 132 }, { x: 132, y: 132 }, { x: 98, y: 160 }, { x: 115, y: 160 }, { x: 115, y: 188 }] },
    { id: 3, x: 155, y: 85, w: 50, h: 195, color: "#091624", wins: [{ x: 161, y: 97 }, { x: 176, y: 97 }, { x: 161, y: 124 }, { x: 186, y: 124 }, { x: 161, y: 151 }, { x: 176, y: 178 }] },
    { id: 4, x: 200, y: 50, w: 78, h: 230, color: "#0d1f35", wins: [{ x: 207, y: 63 }, { x: 225, y: 63 }, { x: 243, y: 63 }, { x: 261, y: 63 }, { x: 207, y: 93 }, { x: 243, y: 93 }, { x: 225, y: 123 }, { x: 261, y: 123 }, { x: 207, y: 153 }, { x: 243, y: 153 }, { x: 225, y: 183 }] },
    { id: 5, x: 273, y: 18, w: 54, h: 262, color: "#08122a", wins: [{ x: 280, y: 30 }, { x: 297, y: 30 }, { x: 310, y: 30 }, { x: 280, y: 58 }, { x: 310, y: 58 }, { x: 280, y: 86 }, { x: 297, y: 86 }, { x: 297, y: 114 }, { x: 310, y: 114 }, { x: 280, y: 142 }, { x: 297, y: 170 }, { x: 280, y: 198 }] },
    { id: 6, x: 322, y: 98, w: 40, h: 182, color: "#0a1827", wins: [{ x: 328, y: 110 }, { x: 344, y: 110 }, { x: 328, y: 136 }, { x: 344, y: 162 }, { x: 328, y: 188 }] },
    { id: 7, x: 357, y: 40, w: 88, h: 240, color: "#0a1a2f", wins: [{ x: 364, y: 54 }, { x: 382, y: 54 }, { x: 400, y: 54 }, { x: 418, y: 54 }, { x: 364, y: 84 }, { x: 400, y: 84 }, { x: 382, y: 114 }, { x: 418, y: 114 }, { x: 364, y: 144 }, { x: 400, y: 144 }, { x: 382, y: 174 }, { x: 418, y: 174 }, { x: 364, y: 204 }] },
    { id: 8, x: 440, y: 72, w: 52, h: 208, color: "#091525", wins: [{ x: 447, y: 84 }, { x: 464, y: 84 }, { x: 476, y: 84 }, { x: 447, y: 112 }, { x: 476, y: 112 }, { x: 464, y: 140 }, { x: 447, y: 168 }, { x: 476, y: 168 }, { x: 447, y: 196 }] },
    { id: 9, x: 487, y: 30, w: 72, h: 250, color: "#0c1d32", wins: [{ x: 494, y: 44 }, { x: 512, y: 44 }, { x: 530, y: 44 }, { x: 548, y: 44 }, { x: 494, y: 74 }, { x: 530, y: 74 }, { x: 512, y: 104 }, { x: 548, y: 104 }, { x: 494, y: 134 }, { x: 530, y: 134 }, { x: 512, y: 164 }, { x: 494, y: 194 }, { x: 548, y: 194 }] },
    { id: 10, x: 554, y: 100, w: 44, h: 180, color: "#091522", wins: [{ x: 560, y: 112 }, { x: 576, y: 112 }, { x: 560, y: 138 }, { x: 585, y: 138 }, { x: 560, y: 164 }, { x: 576, y: 190 }] },
    { id: 11, x: 593, y: 58, w: 78, h: 222, color: "#0b1929", wins: [{ x: 600, y: 72 }, { x: 618, y: 72 }, { x: 636, y: 72 }, { x: 654, y: 72 }, { x: 600, y: 102 }, { x: 636, y: 102 }, { x: 618, y: 132 }, { x: 654, y: 132 }, { x: 600, y: 162 }, { x: 636, y: 162 }, { x: 618, y: 192 }, { x: 654, y: 192 }] },
    { id: 12, x: 666, y: 78, w: 50, h: 202, color: "#0a1525", wins: [{ x: 673, y: 92 }, { x: 690, y: 92 }, { x: 673, y: 120 }, { x: 700, y: 120 }, { x: 673, y: 148 }, { x: 690, y: 176 }, { x: 673, y: 204 }] },
    { id: 13, x: 711, y: 22, w: 68, h: 258, color: "#08121e", wins: [{ x: 718, y: 36 }, { x: 736, y: 36 }, { x: 754, y: 36 }, { x: 770, y: 36 }, { x: 718, y: 66 }, { x: 754, y: 66 }, { x: 736, y: 96 }, { x: 770, y: 96 }, { x: 718, y: 126 }, { x: 754, y: 126 }, { x: 736, y: 156 }, { x: 718, y: 186 }, { x: 770, y: 186 }, { x: 736, y: 216 }] },
    { id: 14, x: 774, y: 72, w: 88, h: 208, color: "#0d1e33", wins: [{ x: 781, y: 86 }, { x: 799, y: 86 }, { x: 817, y: 86 }, { x: 835, y: 86 }, { x: 781, y: 116 }, { x: 817, y: 116 }, { x: 799, y: 146 }, { x: 835, y: 146 }, { x: 781, y: 176 }, { x: 817, y: 176 }, { x: 799, y: 206 }, { x: 835, y: 206 }] },
  ];
  const winColors = ["rgba(254,240,138,0.65)", "rgba(147,197,253,0.5)", "rgba(254,240,138,0.55)", "rgba(147,197,253,0.55)", "rgba(254,240,138,0.7)"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", bottom: 120, left: 0, right: 0, width: "100%", height: "auto" }}>
      <defs>
        {buildings.map(b => (
          <clipPath key={b.id} id={`bcp${b.id}`}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} />
          </clipPath>
        ))}
      </defs>
      {buildings.map((b, i) => (
        <g key={b.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color} />
          <g clipPath={`url(#bcp${b.id})`}>
            {b.wins.map((w, j) => (
              <rect key={j} x={w.x} y={w.y} width={11} height={15} rx={1}
                fill={winColors[(i * 3 + j) % winColors.length]} />
            ))}
          </g>
        </g>
      ))}
      {/* Antenna on building 5 */}
      <line x1={300} y1={4} x2={300} y2={18} stroke="#1e3a5f" strokeWidth={2} />
      <circle cx={300} cy={3} r={3.5} fill="rgba(239,68,68,0.9)" />
    </svg>
  );
}


/* ─── OTP box inputs ─────────────────────────────────────────────── */
function OtpBoxes({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value + "      ").slice(0, 6).split("");

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = value.slice(0, Math.max(0, value.length - 1));
      onChange(next);
      if (i > 0) setTimeout(() => refs[i - 1].current?.focus(), 0);
      return;
    }
    if (e.key === "ArrowLeft" && i > 0) refs[i - 1].current?.focus();
    if (e.key === "ArrowRight" && i < 5) refs[i + 1].current?.focus();
  };

  const handleInput = (i, e) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    if (!ch) return;
    const next = (value + ch).slice(0, 6);
    onChange(next);
    if (i < 5) setTimeout(() => refs[i + 1].current?.focus(), 0);
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); setTimeout(() => refs[Math.min(pasted.length, 5)].current?.focus(), 0); }
    e.preventDefault();
  };

  return (
    <div className="bp-otp-boxes">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={refs[i]}
          className={`bp-otp-digit${digits[i].trim() ? " filled" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onKeyDown={(e) => handleKey(i, e)}
          onInput={(e) => handleInput(i, e)}
          onPaste={handlePaste}
          onChange={() => { }}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

/* ─── Loading Button ─────────────────────────────────────────────── */
function BtnContent({ loading, children }) {
  if (!loading) return children;
  return (
    <span className="bp-btn-loading">
      <span className="bp-dot" />
      <span className="bp-dot" />
      <span className="bp-dot" />
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function UserLogin() {
  const { loginEmail, loginGoogle, signupInit, verifySignup } = useUserAuth();
  const navigate = useNavigate();

  useEffect(() => { injectStyles(); }, []);

  const [tab, setTab] = useState("login");
  const [signupStep, setSignupStep] = useState(1);
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

  const handleLogin = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    try { await loginEmail(email, password); navigate("/home"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

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

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); clearMessages();
    if (otp.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    try { await verifySignup(email, otp); navigate("/home"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogle = async (cr) => {
    clearMessages(); setLoading(true);
    try { await loginGoogle(cr.credential); navigate("/home"); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const switchTab = (t) => { setTab(t); setSignupStep(1); clearMessages(); setOtp(""); };

  return (
    <div className="bp-page">
      {/* ── Scene ── */}
      <div className="bp-scene">
        <div className="bp-sky" />

        {/* Stars */}
        {STARS.map(s => (
          <div key={s.id} className="bp-star" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            "--dur": `${s.dur}s`, "--delay": `${s.delay}s`, "--max-op": s.op,
          }} />
        ))}

        {/* City */}
        <CityScape />

        {/* Road */}
        <div className="bp-road">
          <div className="bp-road-edge" />
          <div className="bp-road-line" />
          <div className="bp-road-kerb" />
        </div>


        {/* Bus */}
        <div className="bp-bus-wrap">
          <div className="bp-bus-roof" />
          <div className="bp-bus-body">
            <div className="bp-bus-stripe" />
            <div className="bp-bus-window-row">
              {[0, 1, 2, 3, 4].map(i => <div key={i} className="bp-bus-window" />)}
            </div>
            <div className="bp-bus-front" />
            <div className="bp-bus-door" />
            <div className="bp-bus-headlight" />
            <div className="bp-bus-undercarriage" />
          </div>
          <div className="bp-bus-wheel bp-bus-wheel-l" />
          <div className="bp-bus-wheel bp-bus-wheel-r" />
        </div>
      </div>

      {/* ── Card ── */}
      <div className="bp-card">
        {/* Logo */}
        <div className="bp-logo">
          <div className="bp-logo-icon">🚌</div>
          <div className="bp-logo-text">
            <div className="bp-logo-name">BusPulse</div>
            <div className="bp-logo-sub">Live Transit Tracker</div>
          </div>
        </div>

        {/* Live route badge */}


        {/* Tabs */}
        <div className="bp-tabs">
          <button className={`bp-tab${tab === "login" ? " bp-tab-active" : ""}`} onClick={() => switchTab("login")}>Login</button>
          <button className={`bp-tab${tab === "signup" ? " bp-tab-active" : ""}`} onClick={() => switchTab("signup")}>Sign Up</button>
        </div>

        {/* Step progress (signup only) */}
        {tab === "signup" && (
          <div className="bp-step-bar">
            <div className={`bp-step-seg${signupStep >= 1 ? " active" : ""}`} />
            <div className={`bp-step-seg${signupStep >= 2 ? " active" : ""}`} />
          </div>
        )}

        {error && <div className="bp-error"><span>⚠</span>{error}</div>}
        {info && <div className="bp-info"><span>✉</span>{info}</div>}

        {/* ═══ LOGIN ═══ */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="bp-form bp-form-enter">
            <div className="bp-field">
              <label className="bp-label">Email address</label>
              <input id="login-email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required className="bp-input" autoFocus />
            </div>
            <div className="bp-field">
              <label className="bp-label">Password</label>
              <div className="bp-pass-wrap">
                <input id="login-password" type={showPass ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required className="bp-input" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="bp-eye">{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>
            <button id="login-btn" type="submit" className="bp-btn" disabled={loading}>
              <BtnContent loading={loading}>Sign In →</BtnContent>
            </button>
            {GOOGLE_ENABLED && <>
              <div className="bp-divider"><span className="bp-div-line" /><span className="bp-div-text">or continue with</span><span className="bp-div-line" /></div>
              <div className="bp-google-wrap">
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-in failed.")}
                  theme="filled_black" shape="pill" text="continue_with" width="320" />
              </div>
            </>}
          </form>
        )}

        {/* ═══ SIGNUP step 1 ═══ */}
        {tab === "signup" && signupStep === 1 && (
          <form onSubmit={handleSignupSubmit} className="bp-form bp-form-enter">
            <div className="bp-field">
              <label className="bp-label">Full name</label>
              <input id="signup-name" type="text" placeholder="e.g. Priya Kumar" value={name}
                onChange={e => setName(e.target.value)} required className="bp-input" autoFocus />
            </div>
            <div className="bp-field">
              <label className="bp-label">Email address</label>
              <input id="signup-email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required className="bp-input" />
            </div>
            <div className="bp-field">
              <label className="bp-label">Password</label>
              <div className="bp-pass-wrap">
                <input id="signup-password" type={showPass ? "text" : "password"} placeholder="Min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required className="bp-input" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="bp-eye">{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>
            <button id="signup-btn" type="submit" className="bp-btn" disabled={loading}>
              <BtnContent loading={loading}>Create Account →</BtnContent>
            </button>
            {GOOGLE_ENABLED && <>
              <div className="bp-divider"><span className="bp-div-line" /><span className="bp-div-text">or continue with</span><span className="bp-div-line" /></div>
              <div className="bp-google-wrap">
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError("Google sign-in failed.")}
                  theme="filled_black" shape="pill" text="continue_with" width="320" />
              </div>
            </>}
          </form>
        )}

        {/* ═══ SIGNUP step 2: OTP ═══ */}
        {tab === "signup" && signupStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="bp-form bp-form-enter">
            <div className="bp-otp-header">
              <div className="bp-otp-icon">✉️</div>
              <div className="bp-otp-title">Check your inbox</div>
              <p className="bp-otp-sub">
                We sent a 6-digit code to<br />
                <span className="bp-otp-email">{email}</span>
              </p>
            </div>
            <OtpBoxes value={otp} onChange={setOtp} />
            <button id="verify-btn" type="submit" className="bp-btn" disabled={loading || otp.length !== 6}>
              <BtnContent loading={loading}>Verify & Board 🚌</BtnContent>
            </button>
            <div className="bp-resend-row">
              {countdown > 0
                ? <span className="bp-countdown">Resend in {countdown}s</span>
                : <button type="button" className="bp-resend-btn" onClick={async () => {
                  clearMessages(); setOtp(""); setLoading(true);
                  try { await signupInit(name, email, password); setInfo("New code sent!"); startCountdown(); }
                  catch (err) { setError(err.message); }
                  finally { setLoading(false); }
                }}>Resend code</button>
              }
              <button type="button" className="bp-back-btn" onClick={() => { setSignupStep(1); setOtp(""); clearMessages(); }}>← Go back</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}