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
### Documentation & RAG System Enhancements

This update brings significant improvements to how project documentation is generated and managed, alongside a more robust Retrieval-Augmented Generation (RAG) backend.

#### Key Changes:

*   **Intelligent `README.md` Updates**
    *   The documentation generation pipeline (`backend/docTrigger.js`) now intelligently updates the project's `README.md` by merging new auto-generated content into existing files. It uses special markers (`<!-- AUTO-GENERATED DOCS START -->` and `<!-- AUTO-GENERATED DOCS END -->`) to update only the designated section, preserving any manual edits outside this block.
    *   Includes a fallback to create a new `README.md` if one doesn't exist.
    *   A concise **"Change Summary"** section listing all added, modified, or removed files is now automatically appended to the generated documentation, providing immediate context for updates.
*   **Enhanced Code Analysis**
    *   The `extractMetadata` function in `docTrigger.js` has been improved to more accurately detect JavaScript/TypeScript function declarations, including arrow functions, providing richer context for documentation generation.
*   **Robust Qdrant Chunk Management**
    *   **Reliable Deletion:** The `deleteChunksForFile` function (`backend/rag.js`) has been refactored for greater resilience. It now uses a scroll-based approach to identify and delete all chunks associated with a specific file, with a robust fallback mechanism for individual point deletion if batch operations fail. This ensures stale or removed code is accurately purged from the vector database.
    *   **Pre-Ingestion Deletion:** During `ingestDirectory` operations, existing chunks for a file are now explicitly deleted *before* new chunks are ingested. This guarantees that the vector database always contains the freshest representation of the codebase.
*   **Updated AI Model & Prompting**
    *   Both documentation generation and RAG-based question answering now utilize the `gemini-2.5-flash` model (`backend/gemini.js`).
    *   Prompts have been refined for both tasks to encourage more concise, relevant, and structured outputs, including explicit source referencing for RAG answers.

## Change Summary
The following files were changed or updated in the codebase:
- backend/chunker.js (modified)
- backend/docTrigger.js (modified)
- backend/gemini.js (modified)
- backend/rag.js (modified)
<!-- AUTO-GENERATED DOCS END -->` markers, preserving any manually written sections.
    *   A "Change Summary" section is automatically appended to the generated documentation, listing the files that triggered the update.
*   **Enhanced Triggering for Documentation Generation:**
    *   Documentation updates are now triggered on both `push` events to `main`/`master` branches and when `pull_requests` are *merged*.
    *   The system intelligently filters changed files, processing only supported source code files (`.js`, `.jsx`, `.ts`, `.tsx`) and removing chunks for deleted files.
*   **Improved Vector Database (Qdrant) Integration:**
    *   Qdrant connection and configuration in `backend/index.js` is more flexible, supporting multiple environment variable names for URL and API keys.
    *   The system now actively manages source code chunks in Qdrant: old chunks are deleted for modified files before new ones are upserted. Chunks for removed files are also purged.
    *   The `/api/chat` endpoint includes a fallback mechanism to automatically re-ingest the repository if a query yields no relevant document chunks.
*   **AI Model Upgrade:**
    *   The generative AI model used for documentation generation and chat responses has been updated from `gemini-pro` to **`gemini-2.5-flash`** (in `backend/gemini.js`) for potentially faster and more efficient processing.
*   **Code Metadata Extraction:**
    *   The system now attempts to extract basic metadata (like language, function type, and function name) from code chunks (in `backend/docTrigger.js`). This metadata is stored with the chunks in the vector database, enabling potentially richer search and retrieval in the future.
*   **Robust Chunk Identification:**
    *   A `toUUID` helper function (in `backend/docTrigger.js`) ensures stable, unique identifiers for each code chunk stored in the vector database, improving chunk management and deduplication.

## Change Summary
The following files were changed or updated in the codebase:
- backend/chunker.js (modified)
- backend/docTrigger.js (modified)
- backend/embedding.js (modified)
- backend/gemini.js (modified)
- backend/index.js (modified)
- backend/repoReader.js (modified)
- backend/vector.js (modified)
<!-- AUTO-GENERATED DOCS END -->` markers. If these markers are present, only the content between them is updated.
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
