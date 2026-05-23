import { chunkFile } from "./chunker.js";
import { generateEmbedding } from "./embedding.js";
import { generateDocumentation } from "./gemini.js";
//comment3
// File extensions to process
const SUPPORTED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const DOCS_FILE = "Readme.md";

/**
 * Extracts changed file paths from push webhook payload.
 * Returns {file, status} for each changed file.
 *
 * @param {Array} commits - Array of commit objects from webhook
 * @returns {Array} Array of {file, status} objects (added/modified/removed)
 */
function getChangedFilesFromPush(commits) {
    const fileMap = new Map(); // file -> latest status

    for (const commit of commits) {
        for (const file of commit.added || []) {
            fileMap.set(file, "added");
        }
        for (const file of commit.modified || []) {
            fileMap.set(file, "modified");
        }
        for (const file of commit.removed || []) {
            fileMap.set(file, "removed");
        }
    }

    return Array.from(fileMap.entries()).map(([file, status]) => ({ file, status }));
}

/**
 * Gets file changes for a PR using Octokit.
 *
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} prNumber - Pull request number
 * @param {object} octokit - Authenticated Octokit instance
 * @returns {Array} Array of {file, status} objects (added/modified)
 */
async function getPRChangedFiles(owner, repo, prNumber, octokit) {
    try {
        const { data } = await octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
            per_page: 100,
        });

        return data.map((file) => ({
            file: file.filename,
            status: file.status, // added, modified, removed, renamed, etc.
        }));
    } catch (err) {
        console.error("[DocGen] Failed to get PR files:", err.message);
        throw err;
    }
}

/**
 * Fetches file content from GitHub API and decodes from base64.
 *
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} filePath - Path to file in repository
 * @param {object} octokit - Authenticated Octokit instance
 * @returns {string} File content as UTF-8 string
 */
async function fetchFileContent(owner, repo, filePath, octokit) {
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
        });

        // Content is base64 encoded from GitHub API
        if (typeof data.content === "string") {
            return Buffer.from(data.content, "base64").toString("utf-8");
        }
        throw new Error("No content in response");
    } catch (err) {
        console.error(`[DocGen] Failed to fetch ${filePath}:`, err.message);
        throw err;
    }
}

/**
 * Checks if file should be processed (by extension).
 */
function isSupportedFile(filePath) {
    return (
        SUPPORTED_EXTENSIONS.some((ext) => filePath.endsWith(ext)) &&
        !filePath.includes(DOCS_FILE)
    );
}

/**
 * Full documentation generation pipeline (in-memory, no disk I/O).
 *
 * @param {object} params
 * @param {string} params.repoFullName  - "owner/repo" string
 * @param {object} params.octokit       - Authenticated Octokit instance
 * @param {string} params.eventType     - "push" or "pull_request"
 * @param {Array} params.commits        - Commit array (for push events)
 * @param {number} params.prNumber      - PR number (for PR events)
 */
export async function triggerDocGeneration({
    repoFullName,
    octokit,
    eventType,
    commits,
    prNumber,
}) {
    console.log("\n[DocGen] Starting documentation generation...");
    console.log("[DocGen] Repo:", repoFullName);
    console.log("[DocGen] Event type:", eventType);

    const [owner, repo] = repoFullName.split("/");

    try {
        // ── STEP 1: Get list of changed files ────────────────────────────────
        let changedFiles;
        if (eventType === "push" && commits) {
            changedFiles = getChangedFilesFromPush(commits);
        } else if (eventType === "pull_request" && prNumber) {
            changedFiles = await getPRChangedFiles(owner, repo, prNumber, octokit);
        } else {
            throw new Error("Invalid event type or missing data");
        }

        console.log(`[DocGen] Found ${changedFiles.length} changed files`);

        // Filter to only supported files and exclude removals
        const filesToProcess = changedFiles.filter(
            (item) => isSupportedFile(item.file) && item.status !== "removed"
        );

        console.log(`[DocGen] Processing ${filesToProcess.length} supported files`);

        // ── STEP 2: Fetch file content in memory and chunk ────────────────────
        const allChunks = [];

        for (const item of filesToProcess) {
            try {
                const content = await fetchFileContent(
                    owner,
                    repo,
                    item.file,
                    octokit
                );
                const chunks = chunkFile(content, item.file);

                for (const chunk of chunks) {
                    const embedding = await generateEmbedding(chunk.text);
                    allChunks.push({
                        file: chunk.file,
                        text: chunk.text,
                        embedding,
                    });
                    console.log(`[DocGen] Embedded: ${chunk.file}`);
                }
            } catch (err) {
                console.error(
                    `[DocGen] Error processing ${item.file}:`,
                    err.message
                );
                // Continue processing other files
            }
        }

        if (allChunks.length === 0) {
            console.log("[DocGen] No chunks generated, skipping documentation");
            return;
        }

        // ── STEP 3: Build combined context ──────────────────────────────────
        const combinedContext = allChunks.map((item) => item.text).join("\n");

        // ── STEP 4: Generate documentation via Gemini ───────────────────────
        const docs = await generateDocumentation(combinedContext);
        console.log("[DocGen] Documentation generated successfully");

        // ── STEP 5: Push README.md back to the repo ────────────────────────
        await pushDocsToRepo({ repoFullName, octokit, docs });

        console.log("[DocGen] Done ✓");
    } catch (err) {
        console.error("[DocGen] Pipeline failed:", err.message);
        throw err;
    }
}

/**
 * Commits and pushes README.md to the default branch of the repo.
 *
 * @param {object} params
 * @param {string} params.repoFullName - "owner/repo" string
 * @param {object} params.octokit - Authenticated Octokit instance
 * @param {string} params.docs - Documentation content to push
 */
async function pushDocsToRepo({ repoFullName, octokit, docs }) {
    const [owner, repo] = repoFullName.split("/");
    const filePath = "README.md";
    const content = Buffer.from(docs).toString("base64");

    console.log(`[DocGen] Pushing ${filePath} to ${repoFullName}...`);

    // Check if README.md already exists (need its SHA to update it)
    let existingSha = null;
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
        });
        existingSha = data.sha;
        console.log("[DocGen] Existing README.md found — will update.");
    } catch (err) {
        if (err.status === 404) {
            console.log("[DocGen] No existing README.md — will create.");
        } else {
            throw err;
        }
    }

    // Create or update the file
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: "docs: auto-update README.md [skip ci]",
        content,
        ...(existingSha ? { sha: existingSha } : {}),
    });

    console.log("[DocGen] README.md pushed successfully ✓");
}