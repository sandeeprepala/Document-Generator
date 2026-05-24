import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";
import { QdrantClient } from "@qdrant/js-client-rest";
import { triggerDocGeneration } from "./docTrigger.js";
import { ingestDirectory, searchChunks, listChunks } from "./rag.js";
import { generateAnswer } from "./gemini.js";
//comment812
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../");

const app = express();
//comment5
app.use(cors());
app.use(express.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

let qdrant = null;

async function start() {
    const qdrantUrl = process.env.QDRANT_URL || process.env.Cluster_endpoint;
    const qdrantApiKey = process.env.QDRANT_API_KEY || process.env.Qdrant_key;
    const qdrantCollectionName = process.env.QDRANT_COLLECTION || "chunks";

    if (qdrantUrl && qdrantApiKey) {
        const qdrantClient = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });
        qdrant = { client: qdrantClient, collectionName: qdrantCollectionName };
        console.log("Connected to Qdrant");
    } else {
        console.log("QDRANT_URL/QDRANT_API_KEY not set — skipping Qdrant connection");
    }

    app.get("/", (req, res) => {
        res.send("Backend running successfully");
    });

    app.post("/github/webhook", async (req, res) => {
        const event = req.headers["x-github-event"];
        const payload = req.body;

        console.log("\n====================");
        console.log("Webhook received");
        console.log("Event:", event);

        // ─── PUSH EVENT ──────────────────────────────────────────────────────────
        if (event === "push") {
            const branch = payload.ref; // e.g. "refs/heads/main"
            const isMainOrMaster =
                branch === "refs/heads/main" ||
                branch === "refs/heads/master";

            console.log("Push detected on branch:", branch);
            payload.commits.forEach((commit) => {
                console.log("Commit:", commit.message);
            });

            if (isMainOrMaster) {
                console.log("Main/master push — triggering doc generation...");

                const repoFullName = payload.repository.full_name; // "owner/repo"
                const commits = payload.commits; // Array of commit objects

                // Fire-and-forget so webhook responds instantly
                triggerDocGeneration({
                    repoFullName,
                    octokit,
                    db: qdrant,
                    eventType: "push",
                    commits,
                }).catch((err) => console.error("Doc generation error:", err));
            } else {
                console.log("Not main/master — skipping doc generation.");
            }
        }

        // ─── PULL REQUEST EVENT ──────────────────────────────────────────────────
        if (event === "pull_request") {
            const action = payload.action;
            console.log("PR Action:", action);
            console.log("PR Title:", payload.pull_request.title);

            if (action === "opened") {
                console.log("PR Opened");
            }

            if (action === "closed" && payload.pull_request.merged) {
                console.log("PR Merged — triggering doc generation...");

                const repoFullName = payload.repository.full_name;
                const prNumber = payload.pull_request.number;

                triggerDocGeneration({
                    repoFullName,
                    octokit,
                    db: qdrant,
                    eventType: "pull_request",
                    prNumber,
                }).catch((err) => console.error("Doc generation error:", err));
            }
        }

        res.sendStatus(200);
    });

    app.get("/api/status", (req, res) => {
        res.json({
            status: "ok",
            qdrant: !!qdrant,
        });
    });

    app.post("/api/ingest", async (req, res) => {
        try {
            if (!qdrant) {
                return res.status(500).json({ error: "Qdrant is not configured." });
            }
            const rootDir = req.body.rootDir || workspaceRoot;
            const result = await ingestDirectory({ db: qdrant, sourceRoot: rootDir, chunkSize: 800 });
            res.json(result);
        } catch (error) {
            console.error("Ingestion error:", error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post("/api/chat", async (req, res) => {
        try {
            const { question } = req.body;
            if (!question || typeof question !== "string") {
                return res.status(400).json({ error: "Question is required." });
            }
            if (!qdrant) {
                return res.status(500).json({ error: "Qdrant is not configured." });
            }

                let chunks = await searchChunks({ db: qdrant, query: question, topK: 6 });

            if (chunks.length === 0) {
                console.log("No chunks found for query — running ingestion before retrying.");
                await ingestDirectory({ db: qdrant, sourceRoot: workspaceRoot, chunkSize: 800 });
                    chunks = await searchChunks({ db: qdrant, query: question, topK: 6 });
            }

            if (chunks.length === 0) {
                return res.status(400).json({
                    error:
                        "No document chunks are available. Please ingest files first using the ingest button or POST /api/ingest.",
                });
            }

            const answer = await generateAnswer(question, chunks);
            res.json({ answer, chunks });
        } catch (error) {
            console.error("Chat error:", error);
            res.status(500).json({ error: error.message });
        }
    });

    app.get("/api/chunks", async (req, res) => {
        try {
            if (!qdrant) {
                return res.status(500).json({ error: "Qdrant is not configured." });
            }
            const limit = Number(req.query.limit) || 20;
            const chunks = await listChunks({ db: qdrant, limit });
            res.json({ chunks });
        } catch (error) {
            console.error("Chunks listing error:", error);
            res.status(500).json({ error: error.message });
        }
    });

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});