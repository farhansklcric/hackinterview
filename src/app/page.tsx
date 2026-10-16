
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  CircleStop,
  Loader2,
  Mic,
  MicOff,
  Radio,
  ShieldCheck,
  Volume2,
  Waves,
  AlertCircle,
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

type DetectedQuestion = {
  id: string;
  question: string;
  answer: string;
  loading: boolean;
  error: string;
};

export default function InterviewPage() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [status, setStatus] = useState("Ready to start");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<DetectedQuestion[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const listeningRef = useRef(false);
  const restartTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const questionBufferRef = useRef("");
  const processedRef = useRef(new Set<string>());

  // Generate an answer using your server-side API.
  // The API key stays on the server, not in this browser component.
  async function generateAnswer(question: string, id: string) {
    try {
      const response = await fetch("/api/generate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data: {
        answer?: string;
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Request failed (${response.status})`
        );
      }

      if (!data.answer) {
        throw new Error("The AI returned an empty answer.");
      }

      setQuestions((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                answer: data.answer!,
                loading: false,
                error: "",
              }
            : item
        )
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not generate an answer. Please try again.";

      setQuestions((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                loading: false,
                error: message,
              }
            : item
        )
      );
    }
  }

  // Called after a pause in finalized speech.
  function processQuestionBuffer() {
    const question = questionBufferRef.current.trim();
    questionBufferRef.current = "";

    if (!question) return;

    const words = question.split(/\s+/);

    if (words.length < 4) return;

    const looksLikeQuestion =
      question.includes("?") ||
      /\b(what|why|how|when|where|which|who|whom|whose|can you|could you|would you|will you|do you|does|did|is|are|have you|has|explain|tell me|describe|introduce yourself|walk me through|compare|define|discuss|give me|write|solve)\b/i.test(
        question
      );

    if (!looksLikeQuestion) return;

    const normalized = question
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized || processedRef.current.has(normalized)) {
      return;
    }

    // Mark it before making the request to prevent duplicates.
    processedRef.current.add(normalized);

    const id = normalized;

    setQuestions((previous) =>
      [
        {
          id,
          question,
          answer: "",
          loading: true,
          error: "",
        },
        ...previous,
      ].slice(0, 10)
    );

    void generateAnswer(question, id);
  }

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      setStatus("Speech recognition unavailable");
      setError(
        "Your browser does not support the Web Speech API. Try an updated version of Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (result.isFinal) {
          finalText += text + " ";
        } else {
          interim += text + " ";
        }
      }

      if (finalText.trim()) {
        const cleanFinalText = finalText.trim();

        questionBufferRef.current += " " + cleanFinalText;

        setTranscript((previous) =>
          (previous + " " + cleanFinalText).trim()
        );

        // Wait for the speaker to pause before deciding whether
        // the accumulated speech is a question.
        if (questionTimerRef.current) {
          clearTimeout(questionTimerRef.current);
        }

        questionTimerRef.current = setTimeout(() => {
          processQuestionBuffer();
        }, 1400);
      }

      setCurrentSpeech(interim.trim());
    };

    recognition.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        listeningRef.current = false;
        setListening(false);
        setStatus("Microphone permission required");
        setError(
          "Allow microphone access in your browser's site settings."
        );
      } else if (event.error === "network") {
        setError(
          "Speech recognition encountered a network error. Check your connection."
        );
      } else if (
        event.error !== "no-speech" &&
        event.error !== "aborted"
      ) {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (!listeningRef.current) return;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      restartTimerRef.current = setTimeout(() => {
        if (!listeningRef.current) return;

        try {
          recognition.start();
        } catch {
          // The recognition service may already be starting.
        }
      }, 300);
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }

      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    if (!recognitionRef.current) {
      setError(
        "Speech recognition is unavailable. Check your browser."
      );
      return;
    }

    try {
      setError("");
      listeningRef.current = true;
      setListening(true);
      setStatus("Listening continuously");
      recognitionRef.current.start();
    } catch {
      setError(
        "Could not start listening. Stop any existing session and try again."
      );
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

    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
      questionTimerRef.current = null;
    }

    // Process any remaining speech when the user stops.
    processQuestionBuffer();

    recognitionRef.current?.stop();
  }

  function retryAnswer(item: DetectedQuestion) {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === item.id
          ? { ...question, loading: true, error: "" }
          : question
      )
    );

    void generateAnswer(item.question, item.id);
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
            Transcribe speech, identify likely questions, and generate
            suggested answers for mock interviews and authorized practice.
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
                  ? "Speak clearly and pause briefly after a question."
                  : "Allow microphone access when your browser asks."}
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
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 text-sm leading-6 text-red-400"
              >
                <AlertCircle size={17} className="mt-1 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!supported && (
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                This browser does not expose the Web Speech API.
              </p>
            )}

            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              AI requests are sent to your configured server endpoint.
              Get consent before capturing another person's speech.
            </div>
          </section>

          <div className="flex flex-col gap-5">
            <section className="rounded-2xl border border-white/10 bg-[#101116] p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="font-semibold">Live transcript</h2>
                <Volume2 size={18} className="text-zinc-500" />
              </div>

              <div className="min-h-36 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
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
                <h2 className="font-semibold">Detected questions & answers</h2>

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
                    When a likely question is detected, the app will request
                    a suggested answer from your AI backend.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          size={18}
                          className="mt-1 shrink-0 text-amber-400"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                            Detected question
                          </p>

                          <p className="mt-2 break-words text-sm leading-6 text-zinc-200">
                            {item.question}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                          <BrainCircuit
                            size={17}
                            className="shrink-0 text-amber-400"
                          />

                          <h3 className="text-sm font-semibold">
                            Suggested answer
                          </h3>
                        </div>

                        {item.loading ? (
                          <div className="mt-4 flex items-center gap-3 text-sm text-zinc-400">
                            <Loader2
                              size={18}
                              className="animate-spin text-amber-400"
                            />
                            Generating your answer...
                          </div>
                        ) : item.error ? (
                          <div className="mt-3">
                            <p className="text-sm leading-6 text-red-400">
                              {item.error}
                            </p>

                            <button
                              onClick={() => retryAnswer(item)}
                              className="mt-3 rounded-lg border border-amber-400/30 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-400/10"
                            >
                              Try again
                            </button>
                          </div>
                        ) : (
                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
                            {item.answer}
                          </p>
                        )}
                      </div>
                    </article>
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
