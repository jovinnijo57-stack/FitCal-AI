import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, ChevronDown, Check, Mic, MicOff } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Markdown from "markdown-to-jsx";
import { clsx } from "clsx";

// Initialize APIs using environment variables (with fallback to provided keys for testing)
const geminiAi = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Coach — PulsePeak" }] }),
  component: AIChat,
});

type Message = { role: "user" | "model"; content: string; id: string };

const MarkdownOptions = {
  overrides: {
    p: { component: "p", props: { className: "mb-2 last:mb-0 text-[15px] leading-relaxed" } },
    ul: { component: "ul", props: { className: "list-disc pl-4 mb-2 text-[15px]" } },
    ol: { component: "ol", props: { className: "list-decimal pl-4 mb-2 text-[15px]" } },
    li: { component: "li", props: { className: "mb-1 text-[15px]" } },
    strong: { component: "strong", props: { className: "font-semibold text-inherit" } },
    a: { component: "a", props: { className: "text-primary underline underline-offset-2" } },
    h1: { component: "h1", props: { className: "text-lg font-bold mb-2 mt-4" } },
    h2: { component: "h2", props: { className: "text-base font-bold mb-2 mt-3" } },
    h3: { component: "h3", props: { className: "text-sm font-bold mb-2 mt-2" } },
    code: {
      component: "code",
      props: { className: "bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono" },
    },
    pre: {
      component: "pre",
      props: {
        className:
          "bg-black/10 dark:bg-white/10 rounded-xl p-3 overflow-x-auto text-xs font-mono mb-2 shadow-inner",
      },
    },
  },
};
function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Hi there! I'm your PulsePeak AI Coach. How can I help you reach your fitness and nutrition goals today?",
      id: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      // Setting continuous and interimResults to false improves mobile browser compatibility and reliability
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => prev + (prev ? " " : "") + transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert(
        "Voice search is not fully supported in this browser. Please try Chrome, Edge, or Safari.",
      );
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMsg: Message = { role: "user", content: userText, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.filter((m) => m.id !== "welcome");

      // 1. Gemini Promise
      const geminiPromise = (async () => {
        const model = geminiAi.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chatHistory = history.map((m) => ({
          role: m.role === "model" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(userText);
        return result.response.text();
      })();

      // 2. Groq Promise (using active llama-3.3-70b-versatile model)
      const groqPromise = (async () => {
        const groqHistory = history.map((m) => ({
          role: m.role === "model" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        }));
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are PulsePeak AI Coach. Provide helpful fitness and nutrition advice.",
            },
            ...groqHistory,
            { role: "user", content: userText },
          ],
          model: "llama-3.3-70b-versatile",
        });
        return completion.choices[0]?.message?.content || "";
      })();

      // Run both APIs simultaneously
      const [geminiRes, groqRes] = await Promise.allSettled([geminiPromise, groqPromise]);

      let combinedResponse = "";
      if (geminiRes.status === "fulfilled" && groqRes.status === "fulfilled") {
        combinedResponse = `### 🌟 Gemini AI Coach\n${geminiRes.value}\n\n---\n\n### ⚡ Groq LLaMA-3 Coach\n${groqRes.value}`;
      } else if (geminiRes.status === "fulfilled") {
        combinedResponse = geminiRes.value;
      } else if (groqRes.status === "fulfilled") {
        combinedResponse = groqRes.value;
      } else {
        const geminiErr = geminiRes.status === "rejected" ? geminiRes.reason?.message : "Unknown";
        const groqErr = groqRes.status === "rejected" ? groqRes.reason?.message : "Unknown";
        throw new Error(`Gemini: ${geminiErr} | Groq: ${groqErr}`);
      }

      setMessages((prev) => [
        ...prev,
        { role: "model", content: combinedResponse, id: (Date.now() + 1).toString() },
      ]);
    } catch (error: any) {
      console.error("AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: `Oops, something went wrong connecting to the AI: ${error.message}`,
          id: (Date.now() + 1).toString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PhoneShell>
      <ScreenHeader title="AI Coach" subtitle="Ask me anything!" />

      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-2 scrollbar-hide relative z-10">
        <div className="flex flex-col gap-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={clsx(
                  "group relative max-w-[85%] rounded-3xl px-4.5 py-3.5 shadow-sm transition-all hover:shadow-md",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm ml-8"
                    : "bg-card border border-border rounded-bl-sm mr-8",
                )}
              >
                {msg.role === "model" && (
                  <div className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-hero text-white shadow-md">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="break-words">
                  <Markdown options={MarkdownOptions}>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2">
              <div className="relative max-w-[85%] rounded-3xl rounded-bl-sm border border-border bg-card px-5 py-4 shadow-sm mr-8">
                <div className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-hero text-white shadow-md">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary/40"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary/80"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 mx-auto w-full max-w-md px-5 pb-4 pt-4 z-20">
        {/* Glow effect behind input */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />

        <div className="relative flex items-end gap-2">
          <div className="absolute bottom-2 left-2 flex items-center z-10">
            <button
              onClick={toggleListen}
              className={clsx(
                "flex h-[40px] w-[40px] items-center justify-center rounded-full transition-all active:scale-95",
                isListening
                  ? "bg-red-500/10 text-red-500 animate-pulse"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "Listening..." : "Ask your AI coach..."}
            className={clsx(
              "max-h-32 min-h-[56px] w-full resize-none rounded-[28px] border bg-card/95 backdrop-blur-md pl-12 pr-14 pt-4 text-[15px] shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 scrollbar-hide",
              isListening ? "border-primary/50" : "border-border",
            )}
            rows={1}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
