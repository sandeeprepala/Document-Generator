const express = require("express");
const { Octokit } = require("@octokit/rest");

const app = express();

app.use(express.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
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

    if(event === "push") {

        console.log("Push detected");

        console.log("Branch:", payload.ref);

        payload.commits.forEach(commit => {
            console.log("Commit:", commit.message);
        });
    }

    if(event === "pull_request") {

        const action = payload.action;

        console.log("PR Action:", action);

        console.log(
            "PR Title:",
            payload.pull_request.title
        );

        if(action === "opened") {
            console.log("PR Opened");
        }

        if(
            action === "closed" &&
            payload.pull_request.merged
        ) {
            console.log("PR Merged");
        }
    }

    res.sendStatus(200);
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});