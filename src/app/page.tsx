"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  HackInterview - Loading Screen                                     */
/*  Stickman interviewer. Click a body part to crush it.               */
/*  Blood splash + "F*ck This Rat Sh*t" slams the screen.              */
/*  All 6 parts destroyed -> auto-redirect to /interview.            */
/*  Skip button available for the merciful.                            */
/* ------------------------------------------------------------------ */

type PartId = "head" | "torso" | "armL" | "armR" | "legL" | "legR";

interface BloodSplat {
  id: number;
  x: number; // vw
  y: number; // vh
  size: number;
  delay: number;
  duration: number;
  drip: boolean;
}

const PART_LABEL: Record<PartId, string> = {
  head: "HEAD",
  torso: "CHEST",
  armL: "LEFT ARM",
  armR: "RIGHT ARM",
  legL: "LEFT LEG",
  legR: "RIGHT LEG",
};

const TOTAL_PARTS = 6;

export default function LoadingScreen() {
  const router = useRouter();

  const [crushed, setCrushed] = useState<Set<PartId>>(new Set());
  const [splats, setSplats] = useState<BloodSplat[]>([]);
  const [phrase, setPhrase] = useState(false);
  const [shake, setShake] = useState(false);
  const splatId = useRef(0);

  const allDead = crushed.size >= TOTAL_PARTS;

  /* auto-enter the app once every part is destroyed */
  useEffect(() => {
    if (!allDead) return;
    const t = setTimeout(() => router.push("/interview"), 2000);
    return () => clearTimeout(t);
  }, [allDead, router]);

  const crush = useCallback(
    (part: PartId) => {
      if (crushed.has(part)) return;

      setCrushed((prev) => new Set(prev).add(part));
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // burst of blood across the whole screen
      const burst: BloodSplat[] = Array.from({ length: 26 }, () => ({
        id: splatId.current++,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 30 + Math.random() * 140,
        delay: Math.random() * 0.25,
        duration: 0.35 + Math.random() * 0.4,
        drip: Math.random() > 0.5,
      }));
      setSplats((prev) => [...prev, ...burst]);
      setPhrase(true);
    },
    [crushed]
  );

  const partStyle = (p: PartId) =>
    crushed.has(p)
      ? {
          transform: "scale(0.02) rotate(45deg)",
          opacity: 0,
          transition:
            "transform 0.28s cubic-bezier(.6,-0.3,.7,-0.4), opacity 0.3s",
          transformOrigin: "center",
          pointerEvents: "none" as const,
          cursor: "default" as const,
        }
      : {
          cursor: "crosshair" as const,
          transition:
            "transform 0.28s cubic-bezier(.6,-0.3,.7,-0.4), opacity 0.3s",
          transformOrigin: "center",
        };

  return (
    <div
      className={shake ? "shake" : ""}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0f",
        overflow: "hidden",
        fontFamily: "Impact, 'Arial Black', sans-serif",
        userSelect: "none",
      }}
    >
      {/* faint grid backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* title */}
      <h1
        style={{
          position: "absolute",
          top: "6%",
          width: "100%",
          textAlign: "center",
          color: "#ff2d2d",
          letterSpacing: "0.35em",
          fontSize: "clamp(22px, 4vw, 44px)",
          textShadow: "0 0 18px rgba(255,45,45,0.6)",
        }}
      >
        HACKINTERVIEW
      </h1>

      {/* hint */}
      <p
        style={{
          position: "absolute",
          top: "14%",
          width: "100%",
          textAlign: "center",
          color: "#8a8a99",
          fontSize: "clamp(12px, 1.4vw, 16px)",
          letterSpacing: "0.2em",
          fontFamily: "monospace",
        }}
      >
        [ TARGET ACQUIRED — CLICK TO EXECUTE ]
      </p>

      {/* ------- stickman interviewer ------- */}
      <svg
        viewBox="0 0 400 520"
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          transform: "translate(-50%, -50%)",
          height: "62vh",
          filter: "drop-shadow(0 0 25px rgba(255,45,45,0.15))",
        }}
      >
        {/* legs */}
        <g onClick={() => crush("legL")} style={partStyle("legL")}>
          <line x1="185" y1="360" x2="160" y2="480" stroke="#111" strokeWidth="14" strokeLinecap="round" />
          <line x1="160" y1="480" x2="140" y2="482" stroke="#111" strokeWidth="12" strokeLinecap="round" />
        </g>
        <g onClick={() => crush("legR")} style={partStyle("legR")}>
          <line x1="215" y1="360" x2="240" y2="480" stroke="#111" strokeWidth="14" strokeLinecap="round" />
          <line x1="240" y1="480" x2="260" y2="482" stroke="#111" strokeWidth="12" strokeLinecap="round" />
        </g>

        {/* arms */}
        <g onClick={() => crush("armL")} style={partStyle("armL")}>
          <line x1="150" y1="230" x2="105" y2="320" stroke="#111" strokeWidth="13" strokeLinecap="round" />
        </g>
        <g onClick={() => crush("armR")} style={partStyle("armR")}>
          {/* right arm points at you */}
          <line x1="250" y1="230" x2="310" y2="260" stroke="#111" strokeWidth="13" strokeLinecap="round" />
          <circle cx="318" cy="263" r="9" fill="#111" />
        </g>

        {/* torso: suit jacket + shirt + tie */}
        <g onClick={() => crush("torso")} style={partStyle("torso")}>
          <rect x="145" y="205" width="110" height="165" rx="14" fill="#1a1a22" stroke="#333" strokeWidth="2" />
          {/* shirt V */}
          <path d="M175 205 L200 255 L225 205 Z" fill="#f2f2f2" />
          {/* tie */}
          <path d="M194 212 L206 212 L203 232 L197 232 Z" fill="#ff2d2d" />
          <path d="M197 232 L203 232 L210 300 L200 315 L190 300 Z" fill="#cc0000" />
          {/* lapels */}
          <path d="M175 205 L160 260 L185 240 Z" fill="#111" />
          <path d="M225 205 L240 260 L215 240 Z" fill="#111" />
          {/* pocket square */}
          <rect x="222" y="300" width="16" height="8" fill="#f2f2f2" />
        </g>

        {/* head */}
        <g onClick={() => crush("head")} style={partStyle("head")}>
          <circle cx="200" cy="140" r="55" fill="#f5f5f5" stroke="#111" strokeWidth="3" />
          {/* hair */}
          <path d="M148 130 Q150 82 200 80 Q250 82 252 130 L252 112 Q240 95 200 94 Q160 95 148 112 Z" fill="#111" />
          {/* angry eyes */}
          <line x1="172" y1="132" x2="190" y2="140" stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <line x1="228" y1="132" x2="210" y2="140" stroke="#111" strokeWidth="5" strokeLinecap="round" />
          <circle cx="182" cy="148" r="4" fill="#111" />
          <circle cx="218" cy="148" r="4" fill="#111" />
          {/* frown */}
          <path d="M182 172 Q200 160 218 172" stroke="#111" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* HUD: targets remaining / entering */}
      <p
        style={{
          position: "absolute",
          bottom: "17%",
          width: "100%",
          textAlign: "center",
          color: allDead ? "#ff2d2d" : "#55556a",
          fontSize: 13,
          letterSpacing: "0.25em",
          fontFamily: "monospace",
        }}
      >
        {allDead
          ? "TARGET NEUTRALIZED. ENTERING HACKINTERVIEW..."
          : `TARGETS REMAINING: ${TOTAL_PARTS - crushed.size} — ${
              (Object.keys(PART_LABEL) as PartId[])
                .filter((p) => !crushed.has(p))
                .map((p) => PART_LABEL[p])
                .join(" | ")
            }`}
      </p>

      {/* skip button */}
      <button
        onClick={() => router.push("/interview")}
        style={{
          position: "absolute",
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "none",
          border: "1px solid #333344",
          color: "#777788",
          padding: "8px 24px",
          borderRadius: 8,
          letterSpacing: "0.25em",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        SKIP →
      </button>

      {/* ------- blood splats ------- */}
      {splats.map((s) => (
        <div key={s.id}>
          <div
            style={{
              position: "absolute",
              left: `${s.x}vw`,
              top: `${s.y}vh`,
              width: s.size,
              height: s.size * (0.7 + Math.random() * 0.6),
              background:
                "radial-gradient(circle, #b30000 0%, #8a0000 55%, rgba(120,0,0,0.85) 80%, transparent 100%)",
              borderRadius: `${40 + Math.random() * 40}% ${50 + Math.random() * 40}% ${45 + Math.random() * 40}% ${50 + Math.random() * 40}%`,
              transform: "scale(0) rotate(0deg)",
              animation: `splat ${s.duration}s ${s.delay}s cubic-bezier(.2,1.4,.4,1) forwards`,
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
          {s.drip && (
            <div
              style={{
                position: "absolute",
                left: `${s.x}vw`,
                top: `${s.y}vh`,
                width: 4 + Math.random() * 5,
                height: s.size * 1.6,
                background: "linear-gradient(#8a0000, transparent)",
                borderRadius: 4,
                animation: `drip ${1.2 + Math.random()}s ${s.delay + s.duration}s ease-in forwards`,
                opacity: 0,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      ))}

      {/* ------- the phrase ------- */}
      {phrase && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <span
            style={{
              color: "#ff1a1a",
              fontSize: "clamp(36px, 8vw, 110px)",
              letterSpacing: "0.08em",
              textShadow:
                "0 0 12px #ff0000, 0 0 40px #990000, 3px 3px 0 #4d0000",
              transform: "scale(0)",
              animation: "slam 0.45s 0.15s cubic-bezier(.2,1.8,.4,1) forwards",
            }}
          >
            F*ck This Rat Sh*t
          </span>
        </div>
      )}

      {/* footer */}
      <footer
        style={{
          position: "absolute",
          bottom: "4%",
          width: "100%",
          textAlign: "center",
          color: "#e8e8f0",
          fontSize: "clamp(18px, 2.6vw, 34px)",
          letterSpacing: "0.3em",
          textShadow: "0 0 14px rgba(255,255,255,0.25)",
        }}
      >
        SHOOT THE INTERVIEWER
      </footer>

      {/* keyframes + shake */}
      <style>{`
        @keyframes splat {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          70% { transform: scale(1.15) rotate(20deg); opacity: 1; }
          100% { transform: scale(1) rotate(15deg); opacity: 0.92; }
        }
        @keyframes drip {
          0% { opacity: 0; transform: translateY(0) scaleY(0.3); }
          20% { opacity: 1; transform: translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translateY(90px) scaleY(1); }
        }
        @keyframes slam {
          0% { transform: scale(0) rotate(-14deg); }
          60% { transform: scale(1.25) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .shake { animation: shakeAnim 0.5s linear; }
        @keyframes shakeAnim {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-14px, 8px) rotate(-0.6deg); }
          30% { transform: translate(12px, -10px) rotate(0.6deg); }
          45% { transform: translate(-10px, -6px); }
          60% { transform: translate(9px, 7px) rotate(-0.4deg); }
          75% { transform: translate(-5px, 3px); }
          90% { transform: translate(4px, -2px); }
        }
      `}</style>
    </div>
  );
}