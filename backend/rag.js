import fs from "fs";
import path from "path";
import crypto from "crypto";
import { chunkFile } from "./chunker.js";
import { generateEmbedding } from "./embedding.js";
import { getAllFiles } from "./repoReader.js";
//comment6
const VECTOR_COLLECTION = "chunks";
const SUPPORTED_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".md",
  ".txt", ".json", ".html", ".css",
]);
const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_TOP_K = 5;
const DEFAULT_DIMENSIONS = 384;

function hashChunkId(filePath, chunkIndex) {
  // Create a SHA-256 hex and convert the first 32 hex chars into UUID format
  const hex = crypto.createHash("sha256").update(`${filePath}:${chunkIndex}`).digest("hex");
  // Use first 32 chars (16 bytes) and format as 8-4-4-4-12 to satisfy UUID pattern
  const h = hex.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function isSupportedFile(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function sanitizeSourceRoot(sourceRoot) {
  return path.resolve(sourceRoot || path.resolve(process.cwd(), "../"));
}

export async function ingestDirectory({ db, sourceRoot, chunkSize = DEFAULT_CHUNK_SIZE }) {
  if (!db || !db.client || !db.collectionName) {
    throw new Error("Qdrant database connection is required for ingestion.");
  }

  const rootPath = sanitizeSourceRoot(sourceRoot);
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Source directory does not exist: ${rootPath}`);
  }

  const allFiles = getAllFiles(rootPath);
  const files = allFiles.filter(isSupportedFile);

  console.log(`[Ingest] Found ${files.length} supported files in ${rootPath}`);

  if (files.length === 0) {
    return { inserted: 0, files: 0, chunks: 0 };
  }

  const client = db.client;
  const collectionName = db.collectionName;
  await ensureQdrantCollection(db);

  let inserted = 0;
  const batch = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const chunks = chunkFile(content, path.relative(rootPath, filePath), chunkSize);

    console.log(`[Ingest] ${path.relative(rootPath, filePath)} → ${chunks.length} chunks`);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];

      let embedding;
      try {
        embedding = await generateEmbedding(chunk.text);
      } catch (err) {
        console.error(`[Ingest] Embedding failed for chunk ${index} of ${filePath}:`, err.message);
        continue;
      }

      if (!Array.isArray(embedding) || embedding.length === 0) {
        console.warn(`[Ingest] Empty embedding skipped for chunk ${index} of ${filePath}`);
        continue;
      }

      const chunkId = hashChunkId(chunk.file, index);
      const point = {
        id: chunkId,
        vector: embedding,
        payload: {
          filePath: chunk.file,
          sourcePath: filePath,
          text: chunk.text,
          metadata: {
            sourcePath: filePath,
            chunkIndex: index,
            fileExtension: path.extname(filePath).toLowerCase(),
          },
        },
      };

      batch.push(point);

      if (batch.length >= 50) {
        await client.upsert(collectionName, { wait: true, points: batch });
        inserted += batch.length;
        batch.length = 0;
      }
    }
  }

  if (batch.length > 0) {
    await client.upsert(collectionName, { wait: true, points: batch });
    inserted += batch.length;
  }

  console.log(`[Ingest] Done. Inserted/updated ${inserted} chunks from ${files.length} files.`);

  return {
    inserted,
    files: files.length,
    chunks: inserted,
    sourceRoot: rootPath,
  };
}

export async function searchChunks({ db, query, topK = DEFAULT_TOP_K }) {
  if (!db || !db.client || !db.collectionName) {
    throw new Error("Qdrant database connection is required for search.");
  }

  const queryEmbedding = await generateEmbedding(query);

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error("Failed to generate query embedding.");
  }

  const client = db.client;
  const collectionName = db.collectionName;
  await ensureQdrantCollection(db);

  const totalCountResult = await client.count(collectionName, { exact: true });
  const totalDocs = totalCountResult.count ?? 0;
  console.log(`[Search] Total chunks in Qdrant: ${totalDocs}`);

  if (totalDocs === 0) {
    console.warn("[Search] No chunks found — run ingestion first.");
    return [];
  }

  // ── Attempt 1: $vectorSearch (Atlas Vector Search index) ──────────────────
  try {
    const rawResults = await client.search(collectionName, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
      with_vector: false,
    });
    const results = rawResults
      .filter(
        (doc) =>
          doc &&
          doc.payload &&
          typeof doc.payload.filePath === "string" &&
          typeof doc.payload.text === "string" &&
          doc.payload.text.trim().length > 0
      )
      .map((doc) => ({
        filePath: doc.payload.filePath,
        text: doc.payload.text,
        score: doc.score,
      }));
    console.log(`[Search] Qdrant search returned ${rawResults.length} results, ${results.length} valid results after filtering empty text`);
    if (results.length > 0) return results;
  } catch (err) {
    console.warn("[Search] $vectorSearch failed:", err.message);
  }

  // ── Attempt 2: Brute-force cosine similarity ───────────────────────────────
  console.log("[Search] Falling back to Qdrant scroll listing... ");
  try {
    const scroll = await client.scroll(collectionName, {
      limit: 1000,
      with_payload: true,
      with_vector: true,
    });
    const allDocs = scroll.points || [];

    console.log(`[Search] Brute-force scanning ${allDocs.length} docs`);

    const scored = allDocs
      .filter(
        (doc) =>
          Array.isArray(doc.vector) &&
          doc.vector.length > 0 &&
          doc.payload &&
          typeof doc.payload.filePath === "string" &&
          typeof doc.payload.text === "string" &&
          doc.payload.text.trim().length > 0
      )
      .map((doc) => ({
        filePath: doc.payload.filePath,
        text: doc.payload.text,
        score: cosineSimilarity(queryEmbedding, doc.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[Search] Brute-force returning ${scored.length} valid results`);
    return scored;
  } catch (err) {
    console.error("[Search] Brute-force fallback failed:", err.message);
    return [];
  }
}

export async function listChunks({ db, limit = 20 }) {
  if (!db || !db.client || !db.collectionName) {
    throw new Error("Qdrant database connection is required for chunk listing.");
  }
  const { client, collectionName } = db;
  const scroll = await client.scroll(collectionName, {
    limit,
    with_payload: true,
    with_vector: false,
  });
  return (scroll.points || []).map((point) => ({
    filePath: point.payload?.filePath,
    text: point.payload?.text,
    updatedAt: point.payload?.updatedAt,
    score: point.score,
  }));
}

async function ensureQdrantCollection(db) {
  if (!db || !db.client || !db.collectionName) {
    throw new Error("Qdrant database connection is required to ensure collection.");
  }
  const { client, collectionName } = db;
  const existing = await client.getCollections();
  if (!existing.collections?.some((collection) => collection.name === collectionName)) {
    await client.createCollection(collectionName, {
      vectors: { size: DEFAULT_DIMENSIONS, distance: "Cosine" },
    });
    console.log(`[Qdrant] Created collection ${collectionName}`);
  }
}

export { ensureQdrantCollection };

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}