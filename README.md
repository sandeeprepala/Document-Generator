# Project Overview
This project is a Node.js service designed to automate documentation generation for code repositories. It triggers documentation updates in response to code changes (pushes or pull requests), leveraging AI to generate `README.md` content and a vector database for code context.

**Main technologies used:**
- **Node.js:** Runtime environment.
- **GitHub API (Octokit):** For repository interaction (fetching code, pushing updates).
- **Google Gemini API:** For AI-powered documentation generation.
- **Qdrant:** Vector database for storing code embeddings.

# Core Features
- **Automated Documentation:** Generates and updates `README.md` files automatically on GitHub `push` or `pull_request` events.
- **Code Analysis:** Parses supported code files (JS/TS/JSX/TSX), chunks them, and extracts basic metadata.
- **Semantic Contextualization:** Creates vector embeddings for code chunks and stores them in Qdrant for Retrieval-Augmented Generation (RAG).
- **AI-Powered Content Generation:** Utilizes the Gemini LLM to create comprehensive documentation from processed code.
- **Repository Integration:** Fetches relevant code changes and commits the generated `README.md` back to the repository.

# Architecture
The system operates as a backend service, likely triggered by webhooks or a scheduled process. It integrates with GitHub via Octokit to monitor and modify repositories. Code content is processed locally (chunking, embedding generation) before interacting with external services: Google Gemini for AI generation and Qdrant for persistent storage of code embeddings. There is no explicit frontend in this codebase.

# Important Modules
- **Authentication:**
    - **GitHub API:** Relies on an authenticated Octokit instance, typically using a GitHub App installation token or a Personal Access Token.
    - **External APIs:** Implies API keys for Google Gemini and connection details for Qdrant.
- **APIs:**
    - **GitHub API:** Used for `pulls.listFiles`, `repos.getContent`, `repos.createOrUpdateFileContents`.
    - **Google Gemini API:** Used for `generateDocumentation`.
    - **Qdrant Client:** Used for `client.upsert` to manage vector points.
- **Database:**
    - **Qdrant (Vector Database):** Stores code chunks, their vector embeddings, and associated metadata (e.g., file path, function name). This forms a semantic index of the codebase.
- **Real-time systems:** The system processes GitHub events (push, pull_request) in a near real-time fashion, acting as an event-driven automation pipeline.

# Setup
1.  **Clone the repository:** `git clone <repo-url>`
2.  **Install dependencies:** `npm install`
3.  **Configure environment variables:**
    *   `GITHUB_TOKEN`: A Personal Access Token or a GitHub App installation token with appropriate permissions (repo content read/write).
    *   `GEMINI_API_KEY`: Your API key for Google Gemini.
    *   `QDRANT_URL`, `QDRANT_API_KEY`: Connection details for your Qdrant instance.

# Deployment
This service is designed to run in an environment capable of receiving GitHub webhook events or being triggered periodically. Common deployment options include serverless functions (e.g., AWS Lambda, Google Cloud Functions) or containerized services (e.g., Docker, Kubernetes). It requires network access to GitHub, the Google Gemini API, and a Qdrant instance.

# Major APIs
-   **GitHub:**
    -   `GET /repos/{owner}/{repo}/pulls/{pull_number}/files`: Retrieve files changed in a Pull Request.
    -   `GET /repos/{owner}/{repo}/contents/{path}`: Fetch the content of a file.
    -   `PUT /repos/{owner}/{repo}/contents/{path}`: Create or update a file (used for `README.md`).
-   **Google Gemini:**
    -   `POST /v1beta/models/gemini-pro:generateContent`: Used by `generateDocumentation` for text generation.
-   **Qdrant:**
    -   `PUT /collections/{collection_name}/points`: Used by `db.client.upsert` to add or update vector points.