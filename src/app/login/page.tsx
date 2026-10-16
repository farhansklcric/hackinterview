
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { auth, db, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  async function continueToNextPage(uid: string) {
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      router.replace("/onboarding/personal-details");
      return;
    }

    const profile = userSnapshot.data();

    if (profile.profileComplete !== true) {
      router.replace("/onboarding/personal-details");
      return;
    }

    if (profile.resumeUploaded !== true) {
      router.replace("/onboarding/upload-cv");
      return;
    }

    router.replace("/interview");
  }

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        setCheckingSession(false);
        return;
      }

      try {
        await continueToNextPage(user.uid);
      } catch (err) {
        console.error("Could not load your saved profile:", err);

        if (active) {
          setError(
            "We couldn't check your saved profile. Please try again."
          );
          setCheckingSession(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      // Explicitly request the Google profile and email scopes.
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new Error("Google sign-in could not be completed.");
      }

      await continueToNextPage(result.user.uid);
    } catch (err) {
      console.error("Google sign-in failed:", err);

      const code =
        typeof err === "object" &&
        err !== null &&
        "code" in err
          ? String(err.code)
          : "";

      if (code === "auth/popup-closed-by-user") {
        setError("The Google sign-in window was closed. Try again.");
      } else if (code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized in Firebase Authentication."
        );
      } else if (code === "auth/popup-blocked") {
        setError(
          "Your browser blocked the Google sign-in popup. Allow popups and try again."
        );
      } else {
        setError(
          "Sign-in failed. Please check your connection and Firebase settings, then try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080809] text-white">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="animate-spin text-red-500" size={34} />
          <p className="text-sm text-zinc-400">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080809] px-4 py-10 text-white sm:px-6">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-red-900/15 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <section className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-[0_0_45px_rgba(239,68,68,0.12)]">
            <BrainCircuit className="text-red-400" size={29} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-400">
            HackInterview
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your next interview.
            <span className="mt-1 block text-red-500">
              Your next breakthrough.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            Sign in to build your interview profile, save your resume,
            and prepare with your personal AI interview workspace.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-3xl border border-white/10 bg-[#111113]/95 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Sign in or create your account to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={20} />
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="h-5 w-5"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.07 13.22l7.98 6.19C12.93 13.72 18.06 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.85 46.98 24.55Z"
                />
                <path
                  fill="#FBBC05"
                  d="M11.05 28.59A14.4 14.4 0 0 1 10.3 24c0-1.59.27-3.13.75-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 3.07 10.78l7.98-6.19Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.94-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.18 2.3-5.94 0-11.07-4.22-12.95-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                />
              </svg>
            )}

            <span>
              {loading ? "Signing you in..." : "Continue with Google"}
            </span>

            {!loading && <ArrowRight size={18} />}
          </button>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
            >
              {error}
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Built for your success
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                <CheckCircle2 size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Your profile stays saved
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  No need to enter your details every time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                <ShieldCheck size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Personal account
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Your account is connected to your Google identity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                <Sparkles size={17} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  Ready for interview prep
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Continue from where your setup left off.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 px-4 text-center text-xs leading-5 text-zinc-600">
          By continuing, you agree to use HackInterview responsibly.
          Only record conversations when you have appropriate consent.
        </p>
      </section>
    </main>
  );
}
