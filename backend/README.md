# Project Overview
- This project is a backend service designed to automatically generate and update developer documentation (e.g., `README.md`) for GitHub repositories. It integrates with GitHub webhooks to trigger documentation updates on code changes and provides an API for RAG (Retrieval Augmented Generation) based chat with the codebase.
- **Main technologies used**: Node.js, Express.js, Octokit (GitHub API), Qdrant (Vector Database), Google Gemini API, Hugging Face Transformers.js (for embeddings).

# Core Features
- **Automated Documentation**: Generates and updates `README.md` files in GitHub repositories based on code changes.
- **Webhook-driven Updates**: Automatically triggers documentation generation on `push` to main/master branches or on `pull_request` merges.
- **Code Ingestion & Embedding**: Chunks source code files, generates vector embeddings, and stores them in a vector database.
- **RAG-powered Chat**: Allows users to ask questions about the ingested codebase, leveraging the vector database for context retrieval.

# Architecture
- **Backend**: A Node.js Express server acts as the central hub. It listens for GitHub webhooks, interacts with the GitHub API to fetch file content, processes code using local embedding models (Transformers.js), stores and retrieves code chunks from Qdrant, and uses the Google Gemini API for natural language understanding and text generation (documentation and chat responses).

# Important Modules
- **Authentication**:
    - **GitHub**: Uses a GitHub Personal Access Token (`GITHUB_TOKEN`) for Octokit to read repository content and push `README.md` updates.
    - **Google Gemini**: Uses a Google API Key (`GEMINI_API_KEY`) to access the Gemini language model.
    - **Qdrant**: Connects to Qdrant using `QDRANT_URL` and `QDRANT_API_KEY`.
- **APIs**: The system exposes a RESTful API via Express.js for managing ingestion and chat interactions.
- **Database**: Qdrant serves as the vector database, storing code chunks and their corresponding embeddings for efficient semantic search.
- **Real-time systems**: GitHub webhooks are used to enable real-time event-driven documentation generation upon specified repository activities (e.g., code pushes or PR merges).

# Setup
1.  **Clone the repository**: `git clone <repo-url>`
2.  **Install dependencies**: `npm install`
3.  **Configure environment variables**: Create a `.env` file with:
    ```
    GITHUB_TOKEN=<Your_GitHub_Personal_Access_Token>
    GEMINI_API_KEY=<Your_Google_Gemini_API_Key>
    QDRANT_URL=<Your_Qdrant_Cloud_URL_or_local_endpoint>
    QDRANT_API_KEY=<Your_Qdrant_API_Key>
    PORT=5000
    ```
4.  **Run the application**: `node app.js`

# Deployment
The application is a Node.js server. It requires hosting on a platform that can run Node.js applications and can be publicly exposed to receive GitHub webhook events. A persistent Qdrant instance (cloud-hosted or self-managed) is necessary for vector storage. GitHub webhooks must be configured in the target repositories to point to the deployed server's `/github/webhook` endpoint.

# Major APIs
-   `POST /github/webhook`: Receives GitHub `push` and `pull_request` events to trigger automated documentation generation.
-   `POST /api/ingest`: Manually ingests code from a specified directory into the Qdrant vector database.
-   `POST /api/chat`: Accepts a natural language question and returns an answer based on the semantically retrieved code chunks.
-   `GET /api/chunks`: Lists a limited number of ingested code chunks.
-   `GET /api/status`: Provides a health check and indicates if Qdrant is connected.