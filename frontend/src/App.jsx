import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.mongo ? "Connected to MongoDB" : "MongoDB not configured");
      })
      .catch(() => setStatus("Backend not available"));
  }, []);

  const handleIngest = async () => {
    setIngestLoading(true);
    setStatus("Ingesting files and generating embeddings...");

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ingestion failed");
      setStatus(`Ingested ${data.chunks} chunks from ${data.files} files`);
      fetchChunks();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIngestLoading(false);
    }
  };

  const fetchChunks = async () => {
    try {
      const res = await fetch("/api/chunks?limit=10");
      const data = await res.json();
      setChunks(data.chunks || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      setStatus("Please enter a question.");
      return;
    }

    setChatLoading(true);
    setStatus("Searching for relevant chunks...");
    setAnswer("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat request failed");
      setAnswer(data.answer || "No answer returned.");
      setChunks(data.chunks || []);
      setStatus("Answer generated successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>RAG Chatbot</h1>
        <p>Ask questions about ingested files using MongoDB Atlas vector search.</p>
      </header>

      <section className="controls">
        <button onClick={handleIngest} disabled={ingestLoading || chatLoading}>
          {ingestLoading ? "Ingesting..." : "Ingest files & generate embeddings"}
        </button>
        <span className="status">{status}</span>
      </section>

      <section className="chat-panel">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Enter your question here..."
          rows={4}
        />
        <button onClick={handleAsk} disabled={chatLoading || ingestLoading}>
          {chatLoading ? "Thinking..." : "Ask"}
        </button>
      </section>

      <section className="answer-panel">
        <h2>Answer</h2>
        <div className="answer-box">{answer || "Ask a question to get started."}</div>
      </section>

      <section className="chunks-panel">
        <h2>Top Relevant Chunks</h2>
        {chunks.length === 0 ? (
          <p>No chunks available yet. Ingest files first.</p>
        ) : (
          chunks.map((chunk, index) => (
            <article key={`${chunk.filePath}-${index}`} className="chunk-card">
              <div className="chunk-meta">
                <span>{chunk.filePath}</span>
                {chunk.score !== undefined && <span>score: {chunk.score.toFixed(3)}</span>}
              </div>
              <p>{chunk.text}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default App;
