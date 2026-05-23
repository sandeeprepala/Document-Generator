# Project Overview
This project is a GitHub webhook listener that automatically generates and updates developer documentation (README.md) for a repository. It triggers documentation updates on `push` events to `main`/`master` branches or `merged` `pull_request` events, using AI to analyze code changes and write documentation.

**Main technologies used:**
*   **Backend:** Node.js, Express
*   **GitHub Integration:** Octokit, GitHub Webhooks
*   **AI/ML:** Google Gemini API, Transformers.js (for embeddings)
*   **Utilities:** `dotenv`

# Core Features
*   **Automated Documentation:** Generates and updates `README.md` based on code changes in a repository.
*   **GitHub Webhook Integration:** Listens for `push` and `pull_request` events to initiate documentation workflows.
*   **Contextual AI Generation:** Chunks changed code files, generates text embeddings, and uses a Large Language Model (LLM) to synthesize documentation.
*   **Direct Repository Updates:** Commits the generated `README.md` directly back to the GitHub repository.

# Architecture
*   **Frontend:** The project is a headless backend service; there is no frontend.
*   **Backend:** A Node.js Express server acts as the primary application. It exposes a webhook endpoint to receive events from GitHub. Upon receiving a relevant event, it orchestrates a pipeline: fetching source code via GitHub API, processing it, and interacting with external AI services.
*   **External Integrations:**
    *   **GitHub API:** Used for authentication, fetching repository content, getting commit/PR details, and committing new files.
    *   **Google Gemini API:** Utilized for generating the actual documentation text based on the extracted code context.
    *   **Transformers.js (Xenova):** Used locally within the Node.js service to generate semantic embeddings for code chunks.

# Important Modules
*   **Authentication:**
    *   **GitHub Token:** Used by Octokit for interacting with the GitHub API (fetching code, committing `README.md`).
    *   **Google Gemini API Key:** Used to authenticate requests to the Google Generative AI service for documentation generation.
*   **APIs:**
    *   **GitHub API:** Accessed via Octokit for repository operations.
    *   **Google Gemini API:** Accessed via the `@google/generative-ai` SDK for LLM interactions.
    *   **Transformers.js (Xenova):** Used internally to run a local embedding model.
*   **Database:**
    *   No persistent database is used. Embeddings are generated in-memory from code chunks and immediately used to construct the LLM prompt. There is an unused `vectorDatabase` array in the codebase.
*   **Real-time systems:**
    *   **GitHub Webhooks:** Act as the real-time trigger mechanism, notifying the Express server about code changes (pushes or merged pull requests) instantly.

# Setup
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment variables:** Create a `.env` file in the root directory with:
    ```
    GITHUB_TOKEN=your_github_personal_access_token
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
    (Ensure `GITHUB_TOKEN` has repo write permissions).
4.  **Run the server:**
    ```bash
    node server.js
    ```
    The server will listen on `http://localhost:5000`.

# Deployment
The service is designed to run continuously on a server (e.g., VPS, cloud instance, Docker container).
1.  Deploy the Node.js application.
2.  Configure a GitHub webhook in your repository settings:
    *   **Payload URL:** Point to your deployed server's `/github/webhook` endpoint (e.g., `https://your-domain.com/github/webhook`).
    *   **Content type:** `application/json`.
    *   **Events:** Select "Pushes" and "Pull requests".
3.  Ensure `GITHUB_TOKEN` and `GEMINI_API_KEY` are securely set as environment variables in the deployment environment.

# Major APIs
*   `POST /github/webhook`:
    *   **Purpose:** Receives webhook events from GitHub for `push` and `pull_request` actions.
    *   **Triggers:** The documentation generation pipeline when a push occurs on `main`/`master` or a pull request is merged.