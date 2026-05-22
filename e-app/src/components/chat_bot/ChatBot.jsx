import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatBot } from "../../context/ChatBotContext";
import "./ChatBot.css";

const RAG_API_URL = import.meta.env.VITE_RAG_API_URL;
const REQUEST_TIMEOUT_MS = 90_000;

const SUGGESTED_QUESTIONS = [
  "What is this platform?",
  "How to creating an account?",
  "how to raise a complaint?",
  "Can you recommend a course for a beginner?",
];

const formatTime = (date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

let messageIdCounter = 0;
const nextId = () => `msg-${++messageIdCounter}`;

export function ChatBot() {
  const { isOpen, setIsOpen } = useChatBot();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [hasShownColdStartNotice, setHasShownColdStartNotice] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const baselineInputRef = useRef("");
  const finalTranscriptRef = useRef("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Cancel any in-flight request when component unmounts
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // Auto-resize textarea to content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  const isFirstMessage = useMemo(
    () => !messages.some((m) => m.from === "user"),
    [messages]
  );

  const sendQuery = useCallback(
    async (query) => {
      const trimmed = query.trim();
      if (!trimmed || isSending) return;

      if (!RAG_API_URL) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: "user",
            text: trimmed,
            timestamp: new Date(),
          },
          {
            id: nextId(),
            from: "bot",
            text: "Chatbot is not configured. Missing VITE_RAG_API_URL in environment.",
            timestamp: new Date(),
            error: true,
          },
        ]);
        return;
      }

      const userMsg = {
        id: nextId(),
        from: "user",
        text: trimmed,
        timestamp: new Date(),
      };
      const pendingId = nextId();
      const pendingMsg = {
        id: pendingId,
        from: "bot",
        text: "",
        timestamp: new Date(),
        pending: true,
      };

      const showColdNotice = isFirstMessage && !hasShownColdStartNotice;
      if (showColdNotice) setHasShownColdStartNotice(true);

      setMessages((prev) => [...prev, userMsg, pendingMsg]);
      setInput("");
      setIsSending(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(
        () => controller.abort(new DOMException("timeout", "AbortError")),
        REQUEST_TIMEOUT_MS
      );

      try {
        const res = await fetch(`${RAG_API_URL}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        const data = await res.json();
        const replyText =
          (data && typeof data.response === "string" && data.response.trim()) ||
          "I received an empty response. Please try rephrasing your question.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? { ...m, text: replyText, pending: false, timestamp: new Date() }
              : m
          )
        );
      } catch (err) {
        const isTimeout = err?.name === "AbortError";
        const errorText = isTimeout
          ? "The assistant is taking longer than expected to respond. It may be waking up from sleep — please try again in a moment."
          : "Sorry, I couldn't reach the assistant. Please check your connection and try again.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  text: errorText,
                  pending: false,
                  error: true,
                  timestamp: new Date(),
                }
              : m
          )
        );
      } finally {
        clearTimeout(timeoutId);
        abortControllerRef.current = null;
        setIsSending(false);
      }
    },
    [isSending, isFirstMessage, hasShownColdStartNotice]
  );

  const handleSendClick = () => sendQuery(input);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleClearChat = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setIsSending(false);
    setHasShownColdStartNotice(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSuggestionClick = (text) => {
    if (!isSending) sendQuery(text);
  };

  // ---- Voice input (Web Speech API: live speech-to-text) ----
  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    baselineInputRef.current = input.trim() ? `${input.trim()} ` : "";
    finalTranscriptRef.current = "";

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput(
        baselineInputRef.current + finalTranscriptRef.current + interim
      );
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        alert(
          "Microphone permission denied. Please allow microphone access and try again."
        );
      } else if (event.error === "audio-capture") {
        alert("No microphone was found. Please check your audio device.");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      textareaRef.current?.focus();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Failed to stop recognition:", err);
      }
    }
  };

  // ---- Text-to-speech ----
  const speakMessage = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <>
      <button
        type="button"
        className={`tara-fab${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={isOpen}
      >
        <i className={`bi ${isOpen ? "bi-x-lg" : "bi-chat-dots-fill"}`} />
      </button>

      {isOpen && (
        <section
          className="tara-window"
          role="dialog"
          aria-label="Course assistant chat"
        >
          <header className="tara-header">
            <div className="tara-avatar" aria-hidden="true">
              <i className="bi bi-robot" />
              <span className="tara-status-dot" />
            </div>
            <div className="tara-header-info">
              <span className="tara-title">Tara</span>
              <span className="tara-subtitle">AI Course Assistant • Online</span>
            </div>
            <div className="tara-header-actions">
              <button
                type="button"
                className="tara-icon-btn"
                onClick={handleClearChat}
                disabled={messages.length === 0 && !isSending}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <i className="bi bi-arrow-clockwise" />
              </button>
              <button
                type="button"
                className="tara-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close chat"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </header>

          <div className="tara-messages" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="tara-welcome">
                <div className="tara-welcome-emoji" aria-hidden="true">
                  <i className="bi bi-stars" style={{ color: "#20c997" }} />
                </div>
                <div className="tara-welcome-title">Hi, I'm Tara</div>
                <div className="tara-welcome-sub">
                  Ask me anything about the platform's courses, enrollment, or
                  how to get started.
                </div>
                <div className="tara-suggestions">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      type="button"
                      key={q}
                      className="tara-suggestion"
                      onClick={() => handleSuggestionClick(q)}
                    >
                      <i
                        className="bi bi-chat-right-text"
                        style={{ marginRight: 6 }}
                      />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {isSending && !hasShownColdStartNotice && (
                  <div className="tara-notice">
                    <i className="bi bi-info-circle" />
                    <span>
                      First response may take 30–60s while the assistant warms
                      up.
                    </span>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`tara-msg-row from-${m.from}${
                      m.error ? " is-error" : ""
                    }`}
                  >
                    <div className="tara-msg-avatar" aria-hidden="true">
                      <i
                        className={`bi ${
                          m.from === "bot" ? "bi-robot" : "bi-person-fill"
                        }`}
                      />
                    </div>
                    <div className="tara-msg-content">
                      <div className="tara-bubble">
                        {m.pending ? (
                          <span
                            className="tara-typing"
                            aria-label="Assistant is typing"
                          >
                            <span />
                            <span />
                            <span />
                          </span>
                        ) : (
                          m.text
                        )}
                      </div>
                      {!m.pending && (
                        <div className="tara-msg-meta">
                          <span>{formatTime(m.timestamp)}</span>
                          {m.from === "bot" && !m.error && (
                            <>
                              <button
                                type="button"
                                className="tara-meta-btn"
                                onClick={() => speakMessage(m.text)}
                                title="Read aloud"
                              >
                                <i className="bi bi-volume-up" />
                              </button>
                              <button
                                type="button"
                                className="tara-meta-btn"
                                onClick={() => copyToClipboard(m.text)}
                                title="Copy"
                              >
                                <i className="bi bi-clipboard" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="tara-input-area">
            <textarea
              ref={textareaRef}
              className="tara-textarea"
              rows={1}
              placeholder={
                isSending ? "Waiting for response..." : "Ask Tara anything..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              aria-label="Message"
            />
            <button
              type="button"
              className={`tara-input-btn tara-mic-btn${
                isRecording ? " is-recording" : ""
              }`}
              onClick={isRecording ? stopVoiceInput : startVoiceInput}
              title={isRecording ? "Stop recording" : "Voice input"}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
              disabled={isSending}
            >
              <i
                className={`bi ${
                  isRecording ? "bi-stop-circle-fill" : "bi-mic-fill"
                }`}
              />
            </button>
            <button
              type="button"
              className="tara-input-btn tara-send-btn"
              onClick={handleSendClick}
              disabled={isSending || !input.trim()}
              title="Send message"
              aria-label="Send message"
            >
              <i
                className={`bi ${
                  isSending ? "bi-hourglass-split" : "bi-send-fill"
                }`}
              />
            </button>
          </div>
          <div className="tara-footer-hint">
            Press Enter to send • Shift+Enter for new line
          </div>
        </section>
      )}
    </>
  );
}

export default ChatBot;
