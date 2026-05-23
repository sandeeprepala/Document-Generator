import "dotenv/config";
import express from "express";
import { Octokit } from "@octokit/rest";
import { triggerDocGeneration } from "./docTrigger.js";
import { MongoClient } from "mongodb";

const app = express();
//comment4
app.use(express.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

let db = null;

async function start() {
    // Connect to MongoDB if MONGO_URI is provided
    if (process.env.MONGO_URI) {
        const mongoClient = new MongoClient(process.env.MONGO_URI);
        await mongoClient.connect();
        db = mongoClient.db(process.env.MONGO_DB_NAME || "docgen");
        console.log("Connected to MongoDB");
    } else {
        console.log("MONGO_URI not set — skipping MongoDB connection");
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
                    db,
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
                    db,
                    eventType: "pull_request",
                    prNumber,
                }).catch((err) => console.error("Doc generation error:", err));
            }
        }

        res.sendStatus(200);
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