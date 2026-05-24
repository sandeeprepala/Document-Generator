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
### Documentation Generation & Vector Database Enhancements

This update significantly enhances the project's automated documentation generation pipeline and its integration with the Qdrant vector database. The primary goals are to provide more intelligent, incremental, and robust documentation updates, alongside improved data management for code knowledge.

#### Key Changes:

*   **Intelligent README Update Mechanism:**
    *   The system now performs **incremental updates** to the `README.md` by identifying specific `<!-- AUTO-GENERATED DOCS START -->` and `<!-- AUTO-GENERATED DOCS END -->` markers. If these markers are present, only the content between them is updated.
    *   If no `README.md` or markers are found, the system can now gracefully create a new README or append the generated documentation.
    *   Auto-generated README updates now include `[skip ci]` in the commit message to prevent infinite CI loops.
*   **Contextual Change Summaries:**
    *   A new feature appends a concise summary of all files that were added, modified, or removed in a commit or pull request directly to the generated documentation, providing immediate context for the changes.
*   **Enhanced Vector Database (Qdrant) Management:**
    *   **Robust Chunk Deletion:** Improved logic for deleting stale chunks in Qdrant. The system now accurately identifies and removes all associated vector chunks for removed or updated files using a scroll-based approach, ensuring data consistency and preventing orphaned data. This includes a fallback for individual chunk deletion if batch operations fail.
    *   **Pre-Ingestion Cleanup:** When new files are ingested or existing ones are updated, the system now explicitly deletes their old chunks from Qdrant before adding new ones, guaranteeing data freshness.
    *   **Enriched Chunk Metadata:** Chunks stored in Qdrant now include additional metadata such as detected programming language, potential function names (for JavaScript/TypeScript files), `chunkIndex`, and `fileExtension`. This enrichment allows for more precise semantic search and retrieval.
    *   **Consistent Chunk IDs:** New utilities (`toUUID`, `hashChunkId`) have been introduced to generate unique and consistent IDs for code chunks, improving data integrity and management within Qdrant.
*   **Expanded File Type Support:**
    *   The range of supported file extensions for code ingestion and documentation generation has been broadened to include common documentation and configuration files like `.md`, `.txt`, `.json`, `.html`, and `.css`.
*   **Gemini Model Update and Prompt Refinement:**
    *   The `gemini-2.5-flash` model is now utilized for both documentation and question-answering tasks, potentially offering improved performance and response quality.
    *   Documentation generation prompts have been refined to emphasize conciseness, clean markdown output, and strict adherence to rules against regenerating full READMEs or extensive tables.
*   **Pipeline Resilience:**
    *   Explicit checks have been added to prevent the documentation pipeline from attempting to process `README.md` itself as a source file, avoiding potential infinite loops during documentation generation.

## Change Summary
The following files were changed or updated in the codebase:
- backend/chunker.js (modified)
- backend/docTrigger.js (modified)
- backend/embedding.js (modified)
- backend/gemini.js (modified)
- backend/rag.js (modified)
- backend/repoReader.js (modified)
<!-- AUTO-GENERATED DOCS END -->`) to identify and replace only the auto-generated section of the `README.md`.
    *   This ensures that any custom content outside these markers is preserved, allowing users to maintain additional, manually written information in their `README.md` files without it being overwritten by the automated generation process.
    *   If markers are not found, the generated documentation is appended, and if `README.md` doesn't exist, a new one is created with a default heading.

## Change Summary
The following files were changed or updated in the codebase:
- backend/docTrigger.js (modified)
<!-- AUTO-GENERATED DOCS END -->
