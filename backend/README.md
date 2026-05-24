# Project Overview
- This project is an automated documentation generator that listens to GitHub events (pushes to `main`/`master` or merged Pull Requests). It processes changed code, generates embeddings, optionally stores chunks in a vector database, and uses an LLM to synthesize project documentation. The generated documentation is then committed back to the repository as `README.md`.
- **Main technologies used**: Node.js, Express.js, GitHub API (Octokit), HuggingFace Transformers (Xenova.js), Google Gemini API, MongoDB (optional).

# Core Features
- **Automated Documentation Updates**: Automatically generates and updates the `README.md` file in response to code changes on designated branches or merged pull requests.
- **Code Processing Pipeline**: Fetches changed file content, chunks it into manageable pieces, and generates vector embeddings for each chunk.
- **Vector Storage (Optional)**: Persists code chunks, their embeddings, and extracted metadata in MongoDB, enabling vector search capabilities.
- **LLM-Powered Documentation Generation**: Leverages the Google Gemini API to analyze processed code context and generate comprehensive developer documentation.
- **GitHub Integration**: Seamlessly interacts with GitHub to retrieve code, monitor events, and push updated documentation.

# Architecture
The system is a **monolithic backend service** implemented in Node.js with Express.js, acting as a GitHub webhook listener.
- **Frontend**: Not present in this codebase.
- **Backend**: An Express.js server receives GitHub webhooks. It orchestrates a pipeline that uses GitHub's API to fetch code, a local machine learning model for embeddings, an external LLM (Gemini) for text generation, and optionally MongoDB for persistent storage of code chunks and embeddings. The final output (documentation) is committed back to the GitHub repository.

# Important Modules
- **Authentication**:
    - **GitHub**: Utilizes a `GITHUB_TOKEN` (Personal Access Token) for `Octokit` to authenticate and perform operations like fetching file content and committing `README.md`.
    - **Google Gemini**: Authenticates with the Google Generative AI API using `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) to generate documentation.
- **APIs**:
    - **GitHub API (via Octokit)**: Used for repository interaction (getting file content, listing PR changes, creating/updating files).
    - **Google Generative AI API (Gemini)**: Provides the large language model capabilities for synthesizing documentation.
    - **HuggingFace Transformers (Xenova.js)**: Used locally to run the `all-MiniLM-L6-v2` model for generating text embeddings.
- **Database**:
    - **MongoDB**: An optional component. If `MONGO_URI` is configured, it serves as a persistent store for code chunks, their embeddings, and basic metadata in a `chunks` collection.
- **Real-time systems**:
    - **GitHub Webhooks**: The core real-time integration, triggering the documentation generation pipeline upon `push` events to `main`/`master` branches or `pull_request` `merged` events. The pipeline is designed to run asynchronously to ensure prompt webhook responses.

# Setup
1.  **Clone the repository**: `git clone <repo-url>`
2.  **Install dependencies**: `npm install`
3.  **Environment Variables**: Create a `.env` file with the following:
    ```env
    GITHUB_TOKEN=<YOUR_GITHUB_PAT_WITH_REPO_SCOPE>
    GEMINI_API_KEY=<YOUR_GOOGLE_GEMINI_API_KEY>
    PORT=5000 # Optional, default 5000
    MONGO_URI=mongodb://localhost:27017/ # Optional, for MongoDB connection
    MONGO_DB_NAME=docgen # Optional, default db name
    ```
4.  **Start the server**: `node server.js`

# Deployment
The application is deployed as a continuously running Node.js service. It needs to be publicly accessible for GitHub to send webhook events. Configure a GitHub webhook in your repository settings pointing to `https://your-app-url/github/webhook` for `push` and `pull_request` events. Ensure environment variables (`GITHUB_TOKEN`, `GEMINI_API_KEY`, `MONGO_URI`) are securely managed in production environments.

# Major APIs
-   **`POST /github/webhook`**:
    -   **Purpose**: Receives and processes GitHub webhook events.
    -   **Triggers**:
        -   Automatic documentation update upon `push` events to the `main` or `master` branch.
        -   Automatic documentation update upon `pull_request` events when a PR is `closed` and `merged`.