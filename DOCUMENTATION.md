# Project Overview
This project is an automated documentation generator that monitors GitHub repositories for code changes. Upon specific events (e.g., pushes to `main`/`master`, merged pull requests), it fetches code, processes it with AI, generates developer documentation, and commits the updated `DOCUMENTATION.md` back to the repository.

**Main technologies used:** Node.js, Express.js, GitHub API (Octokit), Google Gemini API, HuggingFace Transformers (via Xenova/transformers.js).

# Core Features
- **GitHub Webhook Integration**: Listens for `push` and `pull_request` events.
- **Automated Documentation Generation**: Triggers documentation updates for changes on `main`/`master` branches or merged pull requests.
- **Code Content Fetching**: Retrieves source code from GitHub repositories.
- **Text Chunking & Embedding**: Chunks code files and generates vector embeddings for context processing.
- **AI-Powered Documentation**: Utilizes Google Gemini to generate comprehensive documentation based on code context.
- **Repository Update**: Automatically commits and pushes the generated `DOCUMENTATION.md` file back to the respective GitHub repository.

# Architecture
- **Backend**: A Node.js Express server acts as the primary listener for GitHub webhooks. It orchestrates the entire documentation generation pipeline.
- **AI/ML Integration**: The system integrates with two main AI components:
    - **Embeddings**: Uses HuggingFace Transformers (specifically `Xenova/all-MiniLM-L6-v2` via `transformers.js`) to generate contextual embeddings from code chunks. This runs locally (in-process).
    - **Generative AI**: Leverages the Google Gemini API (`gemini-2.5-flash` model) for generating human-readable documentation from the combined code context.

# Important Modules
- **Authentication**:
    - **GitHub**: Requires a GitHub Personal Access Token (`GITHUB_TOKEN`) for Octokit to interact with repositories (fetch content, create/update files).
    - **Google Gemini**: Requires a `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) for accessing the Gemini generative AI model.
- **APIs**:
    - **GitHub REST API (via Octokit)**: Used for event-driven file change detection, fetching file contents, and pushing the generated `DOCUMENTATION.md`.
    - **Google Gemini API**: Utilized for generating the actual documentation text from processed code.
    - **HuggingFace Transformers (local)**: Provides the embedding generation capabilities without external API calls for this specific task.
- **Database**: There is no traditional persistent database. Embeddings and code chunks are processed in-memory during the documentation pipeline. A `vectorDatabase` array exists but is not actively used for storage or retrieval in the current core documentation generation flow.
- **Real-time systems**: GitHub webhooks provide the "real-time" trigger for the system to react to code changes.

# Setup
1.  **Clone the repository**: `git clone <repo-url>`
2.  **Install dependencies**: `npm install`
3.  **Configure environment variables**: Create a `.env` file in the root directory with:
    ```
    GITHUB_TOKEN=your_github_personal_access_token
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
4.  **Start the server**: `npm start` (or `node server.js`)
5.  **Configure GitHub Webhook**: Set up a webhook in your GitHub repository pointing to your server's `/github/webhook` endpoint, subscribing to `push` and `pull_request` events.

# Deployment
The application is deployed as a Node.js server, accessible via a public URL, to receive GitHub webhook payloads. It can be run on various cloud platforms or self-hosted environments.

# Major APIs
-   `POST /github/webhook`: The main endpoint configured as a GitHub webhook to receive push and pull request events, triggering the documentation generation pipeline.