# Project Overview
-   Automates the generation of developer documentation for GitHub repositories using AI. It integrates directly with GitHub webhooks to detect code changes and automatically updates a `DOCUMENTATION.md` file in the repository.
-   **Main technologies used**: Node.js, Express.js, Octokit (GitHub API), Google Gemini API, HuggingFace Transformers.js.

# Core Features
-   Monitors GitHub `push` events (to `main`/`master` branches) and `pull_request` `merged` events.
-   Identifies new or modified JavaScript/TypeScript code files.
-   Fetches relevant file content from GitHub.
-   Chunks code and generates semantic embeddings for better context understanding.
-   Utilizes the Google Gemini AI model to generate concise developer documentation based on the code changes.
-   Automatically commits and pushes the generated `DOCUMENTATION.md` file back to the repository.

# Architecture
-   **Backend**: A Node.js Express server acts as a webhook listener for GitHub events. It orchestrates the entire documentation generation pipeline.
-   **AI/ML Components**: Integrates with the Google Gemini API for text generation and uses `@xenova/transformers` (running a local `all-MiniLM-L6-v2` model) for generating code embeddings.
-   **GitHub Integration**: Leverages the Octokit library to interact with the GitHub API for fetching file contents and creating/updating files (the `DOCUMENTATION.md`).
-   The system operates server-side, asynchronously processing webhook events.

# Important Modules
-   **Authentication**: Requires a GitHub Personal Access Token (`GITHUB_TOKEN`) with `repo` scope for Octokit operations and a Google Gemini API Key (`GEMINI_API_KEY` or `GOOGLE_API_KEY`) for AI model access.
-   **APIs**:
    -   **GitHub API**: Used for receiving webhooks, fetching repository content, and pushing generated documentation.
    -   **Google Gemini API**: Employed for large language model inference to generate documentation.
    -   **HuggingFace Transformers.js**: Used internally for generating text embeddings.
-   **Database**: No persistent database is used. Intermediate data (code chunks, embeddings) are processed in memory during the documentation generation pipeline.
-   **Real-time systems**: Utilizes GitHub webhooks to receive near real-time event notifications (pushes, PR merges), triggering the documentation pipeline asynchronously.

# Setup
1.  **Clone the repository.**
2.  **Install dependencies**: `npm install`
3.  **Environment Variables**: Create a `.env` file with:
    -   `GITHUB_TOKEN=<YOUR_GITHUB_PAT>` (with `repo` scope)
    -   `GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>`
4.  **Run the server**: `node server.js` (or use a process manager like `pm2`).
5.  **Configure GitHub Webhook**: In your GitHub repository settings, add a webhook pointing to `http://your-server-url:5000/github/webhook`. Subscribe to `Push` and `Pull Request` events.

# Deployment
-   The application is a stateless Node.js server.
-   It can be deployed to any cloud platform supporting Node.js applications (e.g., Vercel, Heroku, AWS EC2, Google Cloud Run) behind a public URL.
-   Requires secure configuration of environment variables for `GITHUB_TOKEN` and `GEMINI_API_KEY`.

# Major APIs
-   `POST /github/webhook`: Receives GitHub webhook events (push, pull_request) and initiates the documentation generation process.