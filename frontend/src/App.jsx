import { useEffect, useRef, useState } from "react";
import "./App.css";
import { API } from "./config.js";

const HINTS = [
  "How does the ingestion pipeline work?",
  "Explain the vector search fallback strategy",
  "What APIs does this project expose?",
];

function SendIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon({ size = 14 }) {
  return (
    <svg
      className="spin"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

function IngestIcon({ loading }) {
  return loading ? (
    <SpinnerIcon size={13} />
  ) : (
    <svg className="ingest-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1v10M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [statusMsg, setStatusMsg] = useState("Ready");
  const [statusType, setStatusType] = useState("idle"); // idle | loading | active
  const [ingestLoading, setIngestLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const conversationRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetch(API.STATUS)
      .then((r) => r.json())
      .then((d) => {
        setStatusMsg(d.qdrant ? "Qdrant connected" : "Qdrant not configured");
        setStatusType(d.qdrant ? "active" : "idle");
      })
      .catch(() => {
        setStatusMsg("Backend unavailable");
        setStatusType("idle");
      });
  }, []);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  const handleIngest = async () => {
    setIngestLoading(true);
    setStatusMsg("Ingesting files…");
    setStatusType("loading");
    try {
      const res = await fetch(API.INGEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingestion failed");
      setStatusMsg(`${data.chunks} chunks · ${data.files} files`);
      setStatusType("active");
      fetchChunks();
    } catch (err) {
      setStatusMsg(err.message);
      setStatusType("idle");
    } finally {
      setIngestLoading(false);
    }
  };

  const fetchChunks = async () => {
    try {
      const res = await fetch(API.CHUNKS + '?limit=10');
      const data = await res.json();
      setChunks(data.chunks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsk = async (q) => {
    const query = (q || question).trim();
    if (!query) return;

    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setQuestion("");
    setChatLoading(true);
    setStatusMsg("Searching…");
    setStatusType("loading");

    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }

    try {
      const res = await fetch(API.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "No answer returned." },
      ]);
      setChunks(data.chunks || []);
      setStatusMsg(`${data.chunks?.length ?? 0} chunks retrieved`);
      setStatusType("active");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
      setStatusMsg(err.message);
      setStatusType("idle");
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleTextareaInput = (e) => {
    setQuestion(e.target.value);
    e.target.style.height = "24px";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="shell">
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-brand">
          <h1>RAG Chatbot</h1>
          <span>v1.0</span>
        </div>
        <div className="topbar-status">
          <div className={`status-dot ${statusType === "active" ? "active" : statusType === "loading" ? "loading" : ""}`} />
          {statusMsg}
        </div>
      </header>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <span className="sidebar-label">Ingest</span>
          <button
            className="ingest-btn"
            onClick={handleIngest}
            disabled={ingestLoading || chatLoading}
          >
            <IngestIcon loading={ingestLoading} />
            {ingestLoading ? "Ingesting…" : "Ingest files"}
          </button>
          {statusMsg && (
            <p className="status-msg">{statusMsg}</p>
          )}
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">Sources</span>
          {chunks.length === 0 ? (
            <p className="empty-chunks">
              No sources yet.<br />Ingest files first.
            </p>
          ) : (
            <div className="chunks-list">
              {chunks.map((chunk, i) => (
                <div key={`${chunk.filePath}-${i}`} className="chunk-item">
                  <div className="chunk-item-path" title={chunk.filePath}>
                    {chunk.filePath}
                  </div>
                  {chunk.score !== undefined && (
                    <>
                      <div className="chunk-item-score">
                        score {chunk.score.toFixed(3)}
                      </div>
                      <div className="chunk-item-score-bar">
                        <div
                          className="chunk-item-score-fill"
                          style={{ width: `${Math.min(chunk.score * 100, 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <div className="conversation" ref={conversationRef}>
          {messages.length === 0 && !chatLoading ? (
            <div className="empty-state">
              <h2 className="empty-state-title">Ask anything.</h2>
              <p className="empty-state-sub">
                Query your ingested codebase using natural language. Start by ingesting files, then ask a question.
              </p>
              <div className="empty-state-hints">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    className="hint-pill"
                    onClick={() => handleAsk(hint)}
                    disabled={chatLoading}
                  >
                    {hint}
                    <span className="hint-pill-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`message msg-${msg.role}`}>
                  <span className="msg-role">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </span>
                  <div className="msg-bubble">{msg.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="message msg-assistant">
                  <span className="msg-role">Assistant</span>
                  <div className="msg-bubble">
                    <div className="thinking">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Input ── */}
        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your codebase…"
              rows={1}
              disabled={chatLoading}
            />
            <button
              className="send-btn"
              onClick={() => handleAsk()}
              disabled={chatLoading || !question.trim()}
              aria-label="Send"
            >
              {chatLoading ? <SpinnerIcon size={14} /> : <SendIcon />}
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  );
}