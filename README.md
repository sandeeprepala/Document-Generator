# AI-Powered Documentation & RAG System

An intelligent documentation generation and Retrieval-Augmented Generation (RAG) system built using Node.js and Qdrant Vector Database.

This project automatically analyzes codebases, generates documentation, stores embeddings in a vector database, and enables semantic search and AI-powered codebase querying.

---

# Features

## Core Features

- Automated documentation generation
- Semantic code search using vector embeddings
- AI-powered Retrieval-Augmented Generation (RAG)
- Incremental README updates
- Intelligent code chunking and embedding
- Metadata extraction from source files
- Real-time codebase ingestion and querying

---

# Tech Stack

## Backend
- Node.js
- JavaScript / TypeScript
- Express.js

## AI & Embeddings
- Gemini 2.5 Flash
- Vector Embeddings

## Databases
- Qdrant Vector Database
- MongoDB / PostgreSQL (optional for metadata storage)

---

# Architecture

The system follows a client-server architecture.

## Backend Responsibilities

The backend service:

- Handles API requests
- Processes and chunks source code
- Generates embeddings
- Stores vectors in Qdrant
- Performs semantic similarity search
- Generates AI-powered documentation updates

## Vector Database

Qdrant is used for:

- High-dimensional vector storage
- Similarity search
- Fast retrieval of relevant code chunks
- Context generation for RAG workflows

## Frontend (Optional)

A frontend client can consume the APIs to:

- Chat with the codebase
- Trigger ingestion
- View generated documentation
- Monitor indexing status

---

# Project Workflow

1. Source code is ingested
2. Files are chunked intelligently
3. Embeddings are generated
4. Chunks are stored in Qdrant
5. Semantic search retrieves relevant chunks
6. Gemini generates contextual responses and documentation

---

# API Endpoints

## Health & Status

### `GET /api/status`
Checks backend and Qdrant connection health.

---

## Ingestion

### `POST /api/ingest`
Triggers codebase ingestion into Qdrant.

---

## Chat / RAG

### `POST /api/chat`
Queries the codebase using Retrieval-Augmented Generation (RAG).

---

## Chunks

### `GET /api/chunks`
Lists stored chunks in Qdrant.

---

# Supported File Types

The ingestion pipeline currently supports:

- `.js`
- `.jsx`
- `.ts`
- `.tsx`
- `.json`
- `.md`
- `.txt`
- `.html`
- `.css`

---

# Automated Documentation System

The documentation system automatically updates project documentation based on repository changes.

## Supported Events

Documentation updates are triggered on:

- `push` events to `main` or `master`
- merged pull requests

## Incremental README Updates

Instead of regenerating the entire README, only the section between:

```md
<!-- AUTO-GENERATED DOCS START -->
```markdown
## Frontend API & Configuration Updates

The frontend application's API communication and configuration have been updated to enhance maintainability and support flexible environment deployment.

### API Configuration

*   **Centralized Endpoints:** All backend API endpoints are now defined in `frontend/src/config.js`. This centralizes API paths, making them easier to manage and update.
*   **Environment Variable Support:** The base URL for API calls (`API_BASE_URL`) is now dynamically determined using Vite environment variables (`import.meta.env.VITE_API_URL`), falling back to `http://localhost:5000` for local development if not specified.

### Frontend API Interactions

The `App.jsx` component has been updated to utilize these centralized API endpoints for core features:

*   **`/api/status`**: Used on initial load to check the backend's status, including Qdrant connectivity.
*   **`/api/ingest`**: Triggers the ingestion of documents into the vector store.
*   **`/api/chunks`**: Retrieves a list of ingested document chunks. The application now specifically requests a limit of 10 chunks for display.
*   **`/api/chat`**: Sends user queries to the RAG pipeline and receives AI-generated answers.

These changes streamline API endpoint management and make the application more robust for different deployment scenarios.
```

## Change Summary
The following files were changed or updated in the codebase:
- backend/.env.example (added)
- frontend/.env (added)
- frontend/src/config.js (added)
- backend/package.json (modified)
- frontend/package.json (modified)
- frontend/src/App.css (modified)
- frontend/src/App.jsx (modified)
<!-- AUTO-GENERATED DOCS END -->`) to identify and replace only the auto-generated section of the `README.md`.
    *   This ensures that any custom content outside these markers is preserved, allowing users to maintain additional, manually written information in their `README.md` files without it being overwritten by the automated generation process.
    *   If markers are not found, the generated documentation is appended, and if `README.md` doesn't exist, a new one is created with a default heading.

## Change Summary
The following files were changed or updated in the codebase:
- backend/docTrigger.js (modified)
<!-- AUTO-GENERATED DOCS END -->
