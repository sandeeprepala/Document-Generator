# Project Overview
This project provides an automated system for generating developer documentation and enabling Retrieval Augmented Generation (RAG) capabilities for codebases. It listens for GitHub webhook events to trigger documentation updates for repositories and offers an API for querying ingested code using a conversational AI.

**Main technologies used:**
- **Backend:** Node.js (Express.js)
- **GitHub Integration:** Octokit
- **Vector Database:** Qdrant
- **Large Language Model (LLM):** Google Gemini API
- **Embedding Model:** Hugging Face Transformers.js (local via Xenova)

# Core Features
- **Automated Documentation Generation:** Automatically generates and updates `README.md` files in GitHub repositories upon `push` to `main`/`master` or `pull_request` `merged` events.
- **Codebase Q&A (RAG):** Allows users to ask natural language questions about a codebase and receive AI-generated answers with references to relevant code chunks.
- **Code Ingestion:** Processes source code files by chunking them, generating vector embeddings, and storing them in a vector database for efficient semantic search.
- **File Processing:** Supports various code and documentation file types (`.js`, `.jsx`, `.ts`, `.tsx`, `.md`, `.txt`, `.json`, `.html`, `.css`).

# Architecture
The system follows a backend-centric architecture.

-   **Backend:** A Node.js Express server acts as the primary orchestrator. It handles incoming GitHub webhooks, manages interactions with the GitHub API (Octokit), the Qdrant vector database, and the Google Gemini LLM. It also exposes several API endpoints for manual ingestion and conversational AI features.
-   **Data Flow:**
    1.  GitHub webhooks trigger the backend.
    2.  Files are fetched from GitHub, chunked, and embedded.
    3.  Embedded chunks are stored in Qdrant.
    4.  For documentation, all relevant chunks are combined and sent to Gemini.
    5.  For Q&A, a user query is embedded, relevant chunks are retrieved from Qdrant, and these chunks are sent to Gemini for an answer.

# Important Modules
-   **Authentication:**
    -   **GitHub:** Uses a `GITHUB_TOKEN` for Octokit to interact with GitHub repositories (fetching code, committing `README.md`).
    -   **Gemini:** Utilizes `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) for accessing the Google Gemini LLM.
    -   **Qdrant:** Connects to Qdrant using `QDRANT_URL` and `QDRANT_API_KEY`.
-   **APIs:**
    -   **GitHub API:** Used for repository interaction (fetching files, managing pull requests, creating/updating files).
    -   **Google Gemini API:** Provides the Large Language Model for generating documentation and conversational responses.
    -   **Qdrant Client API:** Manages the vector database, including collection creation, upserting data points (chunks with embeddings and metadata), and performing vector similarity searches.
-   **Database:**
    -   **Qdrant:** Serves as the vector database, storing high-dimensional vector embeddings of code chunks along with their original text and metadata. This enables fast and accurate semantic retrieval for the RAG system.
-   **Real-time systems:**
    -   **GitHub Webhooks:** The server integrates with GitHub's webhook system to receive event notifications (e.g., code pushes, pull request merges) in real-time, enabling immediate processing and documentation updates.

# Setup
1.  **Prerequisites:** Ensure Node.js (v18+) and npm/yarn are installed.
2.  **Clone Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Environment Configuration:** Create a `.env` file in the project root with the following variables:
    ```env
    GITHUB_TOKEN="YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    QDRANT_URL="YOUR_QDRANT_CLUSTER_URL"
    QDRANT_API_KEY="YOUR_QDRANT_API_KEY"
    PORT=5000 # Optional, default is 5000
    ```
    *   The `GITHUB_TOKEN` needs `repo` scope (or `public_repo` if only for public repos).
5.  **Start the Server:**
    ```bash
    npm start
    ```

# Deployment
The application is a Node.js Express server that can be deployed to any platform supporting Node.js applications (e.g., Vercel, Render, AWS, Azure, Google Cloud).
-   Ensure all required environment variables (`GITHUB_TOKEN`, `GEMINI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`) are configured in the deployment environment.
-   Configure GitHub webhooks to point to the deployed server's `/github/webhook` endpoint with `push` and `pull_request` events enabled.

# Major APIs
-   `POST /github/webhook`
    -   **Description:** Receives GitHub webhook payloads for `push` and `pull_request` events. Triggers automated documentation generation for relevant events (e.g., pushes to `main`/`master`, merged pull requests).
    -   **Payload:** GitHub webhook event payload (JSON).
-   `POST /api/ingest`
    -   **Description:** Manually triggers the ingestion process for a specified local directory (defaults to the workspace root if not provided). Chunks files, generates embeddings, and stores them in Qdrant.
    -   **Request Body:** `{ "rootDir": "path/to/directory" }` (Optional)
-   `POST /api/chat`
    -   **Description:** Processes a natural language question using RAG. It searches Qdrant for relevant code chunks and uses Gemini to generate an answer based on those chunks.
    -   **Request Body:** `{ "question": "What does the `chunkFile` function do?" }`
    -   **Response:** `{ "answer": "...", "chunks": [...] }`
-   `GET /api/chunks`
    -   **Description:** Retrieves a list of ingested chunks from the Qdrant database.
    -   **Query Parameters:** `limit` (Optional, default 20)
    -   **Response:** `{ "chunks": [{ filePath: "...", text: "...", score: "..." }] }`
-   `GET /api/status`
    -   **Description:** Provides a health check for the backend server and indicates if Qdrant is configured.
    -   **Response:** `{ "status": "ok", "qdrant": true/false }`