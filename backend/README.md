# Project Overview
- This project automates the generation and updating of `README.md` documentation in GitHub repositories. It integrates with GitHub webhooks to react to code changes (pushes and pull requests), extracts relevant code, generates embeddings, and uses a Large Language Model (LLM) to create or update the documentation. Additionally, it provides a Retrieval Augmented Generation (RAG) system for querying the codebase.
- Main technologies used: Node.js (Express.js), Octokit (GitHub API), Google Gemini AI, Hugging Face Transformers.js (for embeddings), Qdrant (vector database).

# Core Features
- **Automated Documentation**: Automatically generates or updates `README.md` in a GitHub repository upon `push` or `pull_request` merge events.
- **Code Chunking & Embedding**: Splits source code files into manageable chunks and generates vector embeddings for each chunk.
- **Vector Database Integration**: Stores code chunks and their embeddings in Qdrant for efficient semantic search.
- **RAG-based Chat**: Allows users to ask questions about the codebase, retrieving relevant code chunks from Qdrant and using an LLM to formulate answers.
- **Codebase Ingestion**: Supports manual ingestion of local directories into the vector database.
- **Supported Languages**: Processes JavaScript, TypeScript, and Markdown files, among others, for documentation generation.

# Architecture
- **Frontend**: Not provided in the codebase. This is a backend service.
- **Backend**: A Node.js (Express.js) application acts as the central server. It exposes a webhook endpoint for GitHub events and an API for RAG-based interaction. It orchestrates interactions with GitHub (via Octokit), the LLM (Google Gemini), and the vector database (Qdrant). The core logic involves a pipeline for fetching code, chunking, embedding, storing, and generating documentation.

# Important Modules
- **Authentication**:
    - **GitHub**: Requires a `GITHUB_TOKEN` for `Octokit` to access repository content and push updates.
    - **Google Gemini**: Uses `GEMINI_API_KEY` for calls to the Google Generative AI service.
    - **Qdrant**: Connects to a Qdrant instance using `QDRANT_URL` and `QDRANT_API_KEY`.
- **APIs**:
    - `docTrigger.js`: Handles the main documentation generation pipeline in response to GitHub events.
    - `rag.js`: Manages interactions with Qdrant, including ingestion, chunking, embedding, and semantic search.
    - `gemini.js`: Provides functions to interface with the Google Gemini LLM for documentation generation and answering user questions.
    - `embedding.js`: Uses Hugging Face Transformers.js to generate vector embeddings for text.
- **Database**:
    - **Qdrant**: A vector database used to store code chunks and their corresponding embeddings. It facilitates fast and relevant retrieval of code snippets for the RAG system.
- **Real-time systems**:
    - **GitHub Webhooks**: Serves as the real-time trigger for the documentation generation process, reacting to `push` and `pull_request` events on specified branches.

# Setup
1.  **Clone the repository**: `git clone <repo-url>`
2.  **Install dependencies**: `npm install` or `yarn install`
3.  **Configure environment variables**: Create a `.env` file with:
    ```
    PORT=5000
    GITHUB_TOKEN=your_github_personal_access_token
    GEMINI_API_KEY=your_google_gemini_api_key
    QDRANT_URL=your_qdrant_instance_url
    QDRANT_API_KEY=your_qdrant_api_key
    ```
4.  **Start the server**: `npm start` or `node server.js`
5.  **Configure GitHub Webhook**: Point a GitHub webhook to `http://your-server-url/github/webhook` with `push` and `pull_request` events enabled.

# Deployment
The application is a Node.js server designed for cloud deployment. It can be containerized (e.g., Docker) or deployed directly to platforms like Vercel, Heroku, AWS, or GCP. It requires public internet access for the GitHub webhook endpoint and secure handling of environment variables for API keys.

# Major APIs
-   `POST /github/webhook`: Receives GitHub `push` and `pull_request` events to trigger automated documentation updates.
-   `POST /api/ingest`: Initiates ingestion of a local codebase directory into the Qdrant vector database.
-   `POST /api/chat`: Processes a natural language question and returns an LLM-generated answer based on semantically retrieved code chunks.
-   `GET /api/chunks`: Retrieves a list of ingested code chunks from Qdrant, primarily for debugging or overview.
-   `GET /api/status`: Provides a simple health check and indicates Qdrant connection status.