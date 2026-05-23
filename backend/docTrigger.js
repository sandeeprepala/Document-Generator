import { cloneRepo, getAllFiles } from "./repoReader.js";
import { chunkFile } from "./chunker.js";
import { generateEmbedding } from "./embedding.js";
import { generateDocumentation } from "./gemini.js";
import fs from "fs";

/**
 * Full documentation generation pipeline.
 *
 * @param {object} params
 * @param {string} params.repoUrl       - HTTPS clone URL of the repo
 * @param {string} params.repoFullName  - "owner/repo" string
 * @param {object} params.octokit       - Authenticated Octokit instance
 */
export async function triggerDocGeneration({ repoUrl, repoFullName, octokit }) {
    console.log("\n[DocGen] Starting documentation generation...");
    console.log("[DocGen] Repo:", repoUrl);

    try {
        // ── STEP 1: Clone the repo ────────────────────────────────────────────
        await cloneRepo(repoUrl);

        // ── STEP 2: Collect all source files ─────────────────────────────────
        const files = getAllFiles("./cloned-repo");
        console.log(`[DocGen] Found ${files.length} files`);

        // ── STEP 3: Chunk + embed every file ─────────────────────────────────
        const allChunks = [];

        for (const file of files) {
            const chunks = chunkFile(file);

            for (const chunk of chunks) {
                const embedding = await generateEmbedding(chunk.text);
                allChunks.push({ file: chunk.file, text: chunk.text, embedding });
                console.log(`[DocGen] Embedded: ${chunk.file}`);
            }
        }

        // ── STEP 4: Build combined context ───────────────────────────────────
        const combinedContext = allChunks.map((item) => item.text).join("\n");

        // ── STEP 5: Generate documentation via Gemini ────────────────────────
        const docs = await generateDocumentation(combinedContext);
        console.log("[DocGen] Documentation generated successfully");

        // ── STEP 6: Push DOCUMENTATION.md back to the repo ───────────────────
        await pushDocsToRepo({ repoFullName, octokit, docs });

        console.log("[DocGen] Done ✓");
    } catch (err) {
        console.error("[DocGen] Pipeline failed:", err.message);
        throw err;
    }
}

/**
 * Commits and pushes DOCUMENTATION.md to the default branch of the repo.
 */
async function pushDocsToRepo({ repoFullName, octokit, docs }) {
    const [owner, repo] = repoFullName.split("/");
    const filePath = "DOCUMENTATION.md";
    const content = Buffer.from(docs).toString("base64");

    console.log(`[DocGen] Pushing ${filePath} to ${repoFullName}...`);

    // Check if DOCUMENTATION.md already exists (need its SHA to update it)
    let existingSha = null;
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
        });
        existingSha = data.sha;
        console.log("[DocGen] Existing DOCUMENTATION.md found — will update.");
    } catch (err) {
        if (err.status === 404) {
            console.log("[DocGen] No existing DOCUMENTATION.md — will create.");
        } else {
            throw err;
        }
    }

    // Create or update the file
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: "docs: auto-update DOCUMENTATION.md [skip ci]",
        content,
        ...(existingSha ? { sha: existingSha } : {}),
    });

    console.log("[DocGen] DOCUMENTATION.md pushed successfully ✓");
}