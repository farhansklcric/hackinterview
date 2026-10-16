
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  CircleStop,
  Mic,
  MicOff,
  Radio,
  ShieldCheck,
  Volume2,
  Waves,
} from "lucide-react";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function InterviewPage() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [status, setStatus] = useState("Ready to start");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const listeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuestionRef = useRef("");
  const questionBufferRef = useRef("");
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setStatus("Speech recognition unavailable");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (result.isFinal) {
          finalText += text + " ";
        } else {
          interim += text + " ";
        }
      }

      if (finalText) {
        questionBufferRef.current += " " + finalText.trim();
        setTranscript((previous) =>
          (previous + " " + finalText.trim()).trim()
        );
      }

      setCurrentSpeech(interim.trim());

      const buffer = questionBufferRef.current.trim();

      // Prototype question detection: sentence endings or likely
      // question words. This will be replaced with AI detection.
      const looksLikeQuestion =
        /[?]\s*$/.test(buffer) ||
        /\b(what|why|how|when|where|which|who|can you|could you|explain|tell me|describe)\b/i.test(
          buffer
        );

      const hasEnoughWords = buffer.split(/\s+/).length >= 4;

      if (looksLikeQuestion && hasEnoughWords) {
        const normalized = buffer
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .trim();

        if (
          normalized &&
          normalized !== lastQuestionRef.current &&
          !processedRef.current.has(normalized)
        ) {
          lastQuestionRef.current = normalized;
          processedRef.current.add(normalized);

          setQuestions((previous) => [buffer, ...previous].slice(0, 10));
          questionBufferRef.current = "";
        }
      } else if (buffer.split(/\s+/).length > 70) {
        questionBufferRef.current = "";
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        listeningRef.current = false;
        setListening(false);
        setStatus("Microphone permission required");
        setError("Allow microphone access in your browser settings.");
      } else if (event.error === "network") {
        setError("Speech recognition encountered a network error.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (!listeningRef.current) return;

      // Some browsers stop recognition automatically.
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      restartTimerRef.current = setTimeout(() => {
        if (!listeningRef.current) return;

        try {
          recognition.start();
        } catch {
          // Ignore an already-started recognition instance.
        }
      }, 300);
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      setError("");
      listeningRef.current = true;
      setListening(true);
      setStatus("Listening continuously");
      recognitionRef.current.start();
    } catch {
      setError("Could not start listening. Please try again.");
      listeningRef.current = false;
      setListening(false);
    }
  }

  function stopListening() {
    listeningRef.current = false;
    setListening(false);
    setStatus("Session paused");

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    recognitionRef.current?.stop();
  }

  return (
    <main className="min-h-screen bg-[#08090c] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8">
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={17} />
          <span className="hidden sm:inline">Back</span>
        </a>

        <div className="flex items-center gap-2">
          <BrainCircuit className="text-amber-400" size={23} />
          <span className="font-bold">
            Hack <span className="text-amber-400">Interview</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span
            className={`h-2 w-2 rounded-full ${
              listening ? "animate-pulse bg-green-400" : "bg-zinc-600"
            }`}
          />
          {listening ? "Live" : "Offline"}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="text-sm font-medium text-amber-400">
            LIVE AUDIO SESSION
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Interview workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Start listening to transcribe speech and identify likely
            interview questions automatically.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-white/10 bg-[#101116] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-400/10 p-3 text-amber-400">
                <Mic size={23} />
              </div>
              <div>
                <h2 className="font-semibold">Audio controls</h2>
                <p className="mt-1 text-sm text-zinc-500">{status}</p>
              </div>
            </div>

            <div className="my-8 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/20 p-5">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  listening
                    ? "bg-amber-400/15 text-amber-400"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                {listening ? (
                  <Waves size={30} />
                ) : (
                  <MicOff size={30} />
                )}
              </div>

              <p className="text-center font-medium">
                {listening ? "Listening to microphone" : "Ready when you are"}
              </p>

              <p className="mt-2 text-center text-xs leading-5 text-zinc-500">
                {listening
                  ? "Speak near your microphone to test transcription."
                  : "Your browser will ask for microphone permission."}
              </p>
            </div>

            {!listening ? (
              <button
                onClick={startListening}
                disabled={!supported}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 font-semibold text-black hover:bg-amber-300 disabled:opacity-40"
              >
                <Radio size={19} />
                Start listening
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 font-semibold text-red-300 hover:bg-red-500/20"
              >
                <CircleStop size={19} />
                Stop listening
              </button>
            )}

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}

            {!supported && (
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                This browser does not expose the Web Speech API. We'll add
                a streaming speech provider for broader compatibility.
              </p>
            )}

            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              Audio processing depends on your browser's speech service.
              Get consent before capturing another person's speech.
            </div>
          </section>

          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-white/10 bg-[#101116] p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Live transcript</h2>
                <Volume2 size={18} className="text-zinc-500" />
              </div>

              <div className="min-h-36 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {transcript || (
                  <span className="text-zinc-600">
                    Recognized speech will appear here automatically...
                  </span>
                )}

                {currentSpeech && (
                  <span className="text-amber-300">
                    {" "}{currentSpeech}
                  </span>
                )}
              </div>
            </section>

            <section className="flex-1 rounded-2xl border border-white/10 bg-[#101116] p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Detected questions</h2>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                  {questions.length}
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="flex min-h-36 flex-col items-center justify-center text-center">
                  <BrainCircuit size={28} className="text-zinc-600" />
                  <p className="mt-3 text-sm text-zinc-400">
                    Waiting for a likely question
                  </p>
                  <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-600">
                    Questions detected by this prototype will appear here.
                    AI answers are the next integration.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={`${question}-${index}`}
                      className="flex gap-3 rounded-xl border border-white/5 bg-black/20 p-4"
                    >
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-400"
                      />
                      <p className="text-sm leading-6 text-zinc-300">
                        {question}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
