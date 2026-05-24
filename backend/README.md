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
<!-- AUTO-GENERATED DOCS END -->
