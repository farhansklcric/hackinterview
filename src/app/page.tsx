"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  HackInterview - Loading Screen (performance-tuned v2)              */
/*  - GPU-only animations (transform + opacity)                        */
/*  - No blend modes, no SVG filters                                   */
/*  - Blood "ENTERING" transition wipe before /interview               */
/* ------------------------------------------------------------------ */

type PartId = "head" | "torso" | "armL" | "armR" | "legL" | "legR";

interface BloodSplat {
  id: number;
  x: number; // vw
  y: number; // vh
  w: number;
  h: number;
  rot: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  delay: number;
  duration: number;
  dripW: number;
  dripH: number;
  dripDur: number;
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
  const [leaving, setLeaving] = useState(false);
  const splatId = useRef(0);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allDead = crushed.size >= TOTAL_PARTS;

  /* begin the blood exit: overlay in, then route */
  const beginExit = useCallback(() => {
    if (redirectTimer.current) return; // guard double-calls
    setLeaving(true);
    redirectTimer.current = setTimeout(
      () => router.push("/interview"),
      1500
    );
  }, [router]);

  /* all parts destroyed -> brief beat, then blood exit */
  useEffect(() => {
    if (!allDead) return;
    const t = setTimeout(beginExit, 1100);
    return () => clearTimeout(t);
  }, [allDead, beginExit]);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const crush = useCallback(
    (part: PartId) => {
      if (crushed.has(part) || leaving) return;

      setCrushed((prev) => new Set(prev).add(part));
      setShake(true);
      setTimeout(() => setShake(false), 450);

      const burst: BloodSplat[] = Array.from({ length: 16 }, () => {
        const size = 28 + Math.random() * 110;
        return {
          id: splatId.current++,
          x: Math.random() * 100,
          y: Math.random() * 100,
          w: size,
          h: size * (0.7 + Math.random() * 0.6),
          rot: Math.random() * 360,
          r1: 40 + Math.random() * 40,
          r2: 50 + Math.random() * 40,
          r3: 45 + Math.random() * 40,
          r4: 50 + Math.random() * 40,
          delay: Math.random() * 0.2,
          duration: 0.35 + Math.random() * 0.3,
          dripW: 4 + Math.random() * 5,
          dripH: size * 1.5,
          dripDur: 1.1 + Math.random() * 0.8,
        };
      });
      setSplats((prev) => [...prev, ...burst]);
      setPhrase(true);
    },
    [crushed, leaving]
  );

  const partStyle = (p: PartId): React.CSSProperties =>
    crushed.has(p)
      ? {
          transform: "scale(0.02) rotate(45deg)",
          opacity: 0,
          transition:
            "transform 0.28s cubic-bezier(.6,-0.3,.7,-0.4), opacity 0.3s",
          transformOrigin: "center",
          pointerEvents: "none",
          cursor: "default",
          willChange: "transform, opacity",
        }
      : {
          cursor: "crosshair",
          transition:
            "transform 0.28s cubic-bezier(.6,-0.3,.7,-0.4), opacity 0.3s",
          transformOrigin: "center",
          willChange: "transform, opacity",
        };

  return (
    <div
      className={shake ? "shake" : undefined}
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

      {/* ------- stickman interviewer (white, no filters) ------- */}
      <svg
        viewBox="0 0 400 520"
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          transform: "translate(-50%, -50%)",
          height: "62vh",
          maxHeight: "70vh",
        }}
      >
        {/* legs */}
        <g onClick={() => crush("legL")} style={partStyle("legL")}>
          <line x1="185" y1="360" x2="160" y2="480" stroke="#f5f5f5" strokeWidth="14" strokeLinecap="round" />
          <line x1="160" y1="480" x2="140" y2="482" stroke="#f5f5f5" strokeWidth="12" strokeLinecap="round" />
        </g>
        <g onClick={() => crush("legR")} style={partStyle("legR")}>
          <line x1="215" y1="360" x2="240" y2="480" stroke="#f5f5f5" strokeWidth="14" strokeLinecap="round" />
          <line x1="240" y1="480" x2="260" y2="482" stroke="#f5f5f5" strokeWidth="12" strokeLinecap="round" />
        </g>

        {/* arms */}
        <g onClick={() => crush("armL")} style={partStyle("armL")}>
          <line x1="150" y1="230" x2="105" y2="320" stroke="#f5f5f5" strokeWidth="13" strokeLinecap="round" />
        </g>
        <g onClick={() => crush("armR")} style={partStyle("armR")}>
          <line x1="250" y1="230" x2="310" y2="260" stroke="#f5f5f5" strokeWidth="13" strokeLinecap="round" />
          <circle cx="318" cy="263" r="9" fill="#f5f5f5" />
        </g>

        {/* torso: suit jacket + shirt + tie */}
        <g onClick={() => crush("torso")} style={partStyle("torso")}>
          <rect x="145" y="205" width="110" height="165" rx="14" fill="#dcdce4" stroke="#9a9aa8" strokeWidth="2" />
          <path d="M175 205 L200 255 L225 205 Z" fill="#ffffff" />
          <path d="M194 212 L206 212 L203 232 L197 232 Z" fill="#ff2d2d" />
          <path d="M197 232 L203 232 L210 300 L200 315 L190 300 Z" fill="#cc0000" />
          <path d="M175 205 L160 260 L185 240 Z" fill="#b8b8c4" />
          <path d="M225 205 L240 260 L215 240 Z" fill="#b8b8c4" />
          <rect x="222" y="300" width="16" height="8" fill="#ffffff" />
        </g>

        {/* head */}
        <g onClick={() => crush("head")} style={partStyle("head")}>
          <circle cx="200" cy="140" r="55" fill="#f5f5f5" stroke="#c9c9d4" strokeWidth="3" />
          <path d="M148 130 Q150 82 200 80 Q250 82 252 130 L252 112 Q240 95 200 94 Q160 95 148 112 Z" fill="#2a2a33" />
          <line x1="172" y1="132" x2="190" y2="140" stroke="#2a2a33" strokeWidth="5" strokeLinecap="round" />
          <line x1="228" y1="132" x2="210" y2="140" stroke="#2a2a33" strokeWidth="5" strokeLinecap="round" />
          <circle cx="182" cy="148" r="4" fill="#2a2a33" />
          <circle cx="218" cy="148" r="4" fill="#2a2a33" />
          <path d="M182 172 Q200 160 218 172" stroke="#2a2a33" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* HUD */}
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
          ? "TARGET NEUTRALIZED."
          : `TARGETS REMAINING: ${TOTAL_PARTS - crushed.size} — ${
              (Object.keys(PART_LABEL) as PartId[])
                .filter((p) => !crushed.has(p))
                .map((p) => PART_LABEL[p])
                .join(" | ")
            }`}
      </p>

      {/* skip button */}
      <button
        onClick={beginExit}
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
        <div key={s.id} style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: s.w,
              height: s.h,
              background:
                "radial-gradient(circle, #c40000 0%, #8a0000 60%, rgba(110,0,0,0.9) 100%)",
              borderRadius: `${s.r1}% ${s.r2}% ${s.r3}% ${s.r4}%`,
              ["--tx" as string]: `${s.x}vw`,
              ["--ty" as string]: `${s.y}vh`,
              ["--rot" as string]: `${s.rot}deg`,
              animation: `splat ${s.duration}s ${s.delay}s cubic-bezier(.2,1.4,.4,1) forwards`,
              willChange: "transform",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: s.dripW,
              height: s.dripH,
              background: "linear-gradient(#8a0000, transparent)",
              borderRadius: 4,
              ["--tx" as string]: `${s.x}vw`,
              ["--ty" as string]: `${s.y}vh`,
              animation: `drip ${s.dripDur}s ${s.delay + s.duration}s ease-in forwards`,
              opacity: 0,
              willChange: "transform, opacity",
            }}
          />
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
              transform: "scale(0)",
              animation: "slam 0.45s 0.15s cubic-bezier(.2,1.8,.4,1) forwards",
              willChange: "transform",
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
        }}
      >
        SHOOT THE INTERVIEWER
      </footer>

      {/* ------- BLOODY EXIT WIPE ------- */}
      {leaving && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(ellipse at center, #a30000 0%, #5c0000 55%, #1a0000 100%)",
            animation: "bloodIn 0.85s cubic-bezier(.65,0,.35,1) forwards",
            willChange: "transform, opacity",
          }}
        >
          {/* splatter ring for texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 30%, rgba(255,60,60,0.25) 0%, transparent 25%), radial-gradient(circle at 80% 70%, rgba(255,60,60,0.2) 0%, transparent 30%), radial-gradient(circle at 60% 20%, rgba(255,60,60,0.15) 0%, transparent 20%)",
            }}
          />

          <span
            style={{
              color: "#fff",
              fontSize: "clamp(40px, 9vw, 120px)",
              letterSpacing: "0.4em",
              textIndent: "0.4em",
              opacity: 0,
              animation: "enterText 0.6s 0.45s cubic-bezier(.2,1.4,.4,1) forwards",
              willChange: "transform, opacity",
              zIndex: 1,
            }}
          >
            ENTERING
          </span>

          <span
            style={{
              marginTop: 18,
              color: "rgba(255,255,255,0.65)",
              fontSize: "clamp(12px, 1.6vw, 18px)",
              letterSpacing: "0.5em",
              textIndent: "0.5em",
              fontFamily: "monospace",
              opacity: 0,
              animation: "enterText 0.6s 0.7s cubic-bezier(.2,1.4,.4,1) forwards",
              zIndex: 1,
            }}
          >
            HACKINTERVIEW
          </span>

          {/* loading bar */}
          <div
            style={{
              marginTop: 40,
              width: "min(320px, 60vw)",
              height: 3,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 3,
              overflow: "hidden",
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: "100%",
                width: "100%",
                background: "#fff",
                transformOrigin: "left",
                transform: "scaleX(0)",
                animation:
                  "barFill 1.1s 0.3s cubic-bezier(.65,0,.35,1) forwards",
              }}
            />
          </div>
        </div>
      )}

      {/* keyframes */}
      <style>{`
        @keyframes splat {
          0% { transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--rot)); opacity: 1; }
          70% { transform: translate(var(--tx), var(--ty)) scale(1.15) rotate(calc(var(--rot) + 20deg)); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(calc(var(--rot) + 15deg)); opacity: 0.95; }
        }
        @keyframes drip {
          0% { transform: translate(var(--tx), var(--ty)) scaleY(0.3); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(var(--tx), calc(var(--ty) + 90px)) scaleY(1); opacity: 0; }
        }
        @keyframes slam {
          0% { transform: scale(0) rotate(-14deg); }
          60% { transform: scale(1.25) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes bloodIn {
          0% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes enterText {
          0% { transform: translateY(24px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes barFill {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        .shake { animation: shakeAnim 0.45s linear; will-change: transform; }
        @keyframes shakeAnim {
          0%, 100% { transform: translate3d(0, 0, 0); }
          15% { transform: translate3d(-12px, 7px, 0); }
          30% { transform: translate3d(10px, -8px, 0); }
          45% { transform: translate3d(-8px, -5px, 0); }
          60% { transform: translate3d(7px, 6px, 0); }
          75% { transform: translate3d(-4px, 3px, 0); }
          90% { transform: translate3d(3px, -2px, 0); }
        }
      `}</style>
    </div>
  );
}