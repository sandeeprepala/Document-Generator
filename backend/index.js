import "dotenv/config";
import express from "express";
import { Octokit } from "@octokit/rest";
import { triggerDocGeneration } from "./docTrigger.js";

const app = express();

app.use(express.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

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
                eventType: "pull_request",
                prNumber,
            }).catch((err) => console.error("Doc generation error:", err));
        }
    }

    res.sendStatus(200);
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});