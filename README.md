```markdown
# Project Overview
This project focuses on managing and querying vector embeddings, enabling functionalities such as semantic search, data similarity analysis, or AI-powered data retrieval.

**Main technologies used:**
- **Backend:** JavaScript/TypeScript (Node.js)
- **Databases:** Vector Database (for embeddings), potentially a traditional database (for metadata)

# Core Features
- Ingestion and indexing of vector embeddings.
- Semantic search and similarity queries on stored vectors.
- Retrieval of vector data and associated metadata.

# Architecture
The system follows a client-server architecture:
- **Backend:** A Node.js application serves as the API layer, handling business logic, interacting with the vector database for embedding operations, and a traditional database for managing associated metadata.
- **Frontend (Assumed):** A client application (e.g., web or mobile) consumes the backend APIs to provide user interaction.

# Important Modules
- **Authentication:** Standard authentication mechanisms (e.g., JWT, OAuth 2.0) are typically used to secure API endpoints.
- **APIs:** Provides a RESTful interface for all vector-related operations and metadata management.
- **Database:**
    - A specialized **vector database** (e.g., Pinecone, Weaviate, Qdrant) is used for efficient storage, indexing, and similarity search of high-dimensional vector embeddings.
    - A **traditional database** (e.g., PostgreSQL, MongoDB) may be used in conjunction to store metadata associated with each vector.
- **Real-time systems:** Not explicitly a core component; interactions are primarily via request-response cycles.

# Setup
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment variables:** Create a `.env` file based on a provided template (e.g., `.env.example`) for database connections and other settings.
4.  **Start the application:**
    ```bash
    npm start
    ```

# Deployment
The application is typically containerized using Docker for portability and deployed to cloud platforms (e.g., AWS, GCP, Azure). This leverages managed services for compute (e.g., EC2, Cloud Run), databases, and API gateway for scalability and reliability.

# Major APIs
-   `POST /vectors`: Ingest a new vector embedding along with its metadata.
-   `GET /vectors/search`: Perform a similarity search against stored vectors using a query vector or text.
-   `GET /vectors/{id}`: Retrieve a specific vector and its associated metadata by ID.
```

<!-- AUTO-GENERATED DOCS START -->
### Automated Documentation & RAG System Enhancements

This update introduces significant enhancements to the automated documentation generation pipeline and integrates a robust Retrieval-Augmented Generation (RAG) system for improved codebase understanding and interaction.

#### Key Changes:

*   **Automated Documentation Lifecycle**:
    *   The system now automatically triggers documentation updates on `main`/`master` branch `push` events and `pull_request` `merge` events.
    *   It intelligently identifies `added`, `modified`, and `removed` files to manage documentation and associated data in the vector database.
*   **Qdrant Vector Database Integration**:
    *   A Qdrant vector database is now used to store code chunks and their embeddings, facilitating efficient search and context retrieval for both documentation generation and RAG.
    *   Stale documentation (for removed files or outdated code sections) is automatically purged from Qdrant.
    *   New and updated code chunks are vectorized and stored with extracted metadata (e.g., function names, language).
*   **Incremental README Updates**:
    *   The `README.md` is no longer fully regenerated. Instead, a dedicated section within the `README.md` (marked by `<!-- AUTO-GENERATED DOCS START -->` and `<!-- AUTO-GENERATED DOCS END -->`) is updated, preserving any existing manual content.
*   **Intelligent Documentation Generation**:
    *   The Gemini model (`gemini-2.5-flash`) is provided with a list of specific changed files, allowing it to generate more focused and relevant documentation updates.
*   **Retrieval-Augmented Generation (RAG) for Codebase Chat**:
    *   Introduces a Qdrant-backed RAG system for answering questions about the codebase.
    *   Supports ingestion of a wider range of file types (`.js`, `.jsx`, `.ts`, `.tsx`, `.md`, `.txt`, `.json`, `.html`, `.css`) into the vector database for comprehensive knowledge retrieval.
    *   Features robust chunk search capabilities, including Qdrant's native vector search with a brute-force cosine similarity fallback for enhanced reliability.
    *   Includes an `/api/chat` endpoint that can perform on-demand ingestion of the workspace root if no relevant chunks are found for a query.
*   **New API Endpoints**:
    *   `/api/status`: Check backend health and Qdrant connection status.
    *   `/api/ingest`: Manually trigger codebase ingestion into Qdrant.
    *   `/api/chat`: Query the codebase using RAG.
    *   `/api/chunks`: List stored chunks in Qdrant.

These updates provide a more dynamic, intelligent, and maintainable approach to project documentation and enable new ways to interact with the codebase through AI.
<!-- AUTO-GENERATED DOCS END -->
