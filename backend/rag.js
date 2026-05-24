import fs from "fs";
import path from "path";
import crypto from "crypto";
import { chunkFile } from "./chunker.js";
import { generateEmbedding } from "./embedding.js";
import { getAllFiles } from "./repoReader.js";
//commant1
const VECTOR_COLLECTION = "chunks";
const SUPPORTED_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".md",
  ".txt", ".json", ".html", ".css",
]);
const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_TOP_K = 5;
const DEFAULT_DIMENSIONS = 384;

// Always normalize to forward slashes for consistent storage and matching
function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function hashChunkId(filePath, chunkIndex) {
  const hex = crypto.createHash("sha256").update(`${filePath}:${chunkIndex}`).digest("hex");
  const h = hex.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function isSupportedFile(filePath) {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function sanitizeSourceRoot(sourceRoot) {
  return path.resolve(sourceRoot || path.resolve(process.cwd(), "../"));
}

export async function deleteChunksForFile(db, relativePath) {
  if (!db || !db.client || !db.collectionName) {
    throw new Error("Qdrant database connection is required for chunk deletion.");
  }

  const { client, collectionName } = db;

  // Normalize to forward slashes — GitHub always sends forward slashes
  // but Windows stores backslashes, so we normalize both sides
  const normalizedTarget = normalizePath(relativePath);

  console.log(`[Qdrant] Deleting chunks for: ${normalizedTarget}`);

  try {
    let idsToDelete = [];
    let offset = null;

    while (true) {
      const scrollResult = await client.scroll(collectionName, {
        limit: 500,
        ...(offset !== null ? { offset } : {}),
        with_payload: true,
        with_vector: false,
      });

      const points = scrollResult.points || [];

      const matched = points
        .filter((point) => {
          const storedPath = normalizePath(point.payload?.filePath ?? "");
          const targetPath = normalizedTarget;

          return (
            storedPath === targetPath ||                          // exact match
            storedPath.endsWith(`/${targetPath}`) ||             // stored has prefix
            targetPath.endsWith(`/${storedPath}`)                // target has prefix
          );
        })
        .map((point) => point.id);

      idsToDelete.push(...matched);

      if (points.length < 500 || !scrollResult.next_page_offset) break;
      offset = scrollResult.next_page_offset;
    }

    if (idsToDelete.length === 0) {
      console.log(`[Qdrant] No stale chunks found for ${normalizedTarget}`);
      return;
    }

    await client.delete(collectionName, { wait: true, points: idsToDelete });
    console.log(`[Qdrant] Deleted ${idsToDelete.length} stale chunks for ${normalizedTarget}`);
  } catch (err) {
    console.error(`[Qdrant] Failed to delete chunks for ${normalizedTarget}:`, err.message);
    throw err;
  }
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

  const { client, collectionName } = db;
  await ensureQdrantCollection(db);

  let inserted = 0;
  const batch = [];

  for (const filePath of files) {
    // Always store with forward slashes so GitHub webhook paths match
    const relativeFilePath = normalizePath(path.relative(rootPath, filePath));

    await deleteChunksForFile(db, relativeFilePath);

    const content = fs.readFileSync(filePath, "utf8");
    const chunks = chunkFile(content, relativeFilePath, chunkSize);

    console.log(`[Ingest] ${relativeFilePath} → ${chunks.length} chunks`);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];

      let embedding;
      try {
        embedding = await generateEmbedding(chunk.text);
      } catch (err) {
        console.error(`[Ingest] Embedding failed for chunk ${index} of ${relativeFilePath}:`, err.message);
        continue;
      }

      if (!Array.isArray(embedding) || embedding.length === 0) {
        console.warn(`[Ingest] Empty embedding skipped for chunk ${index} of ${relativeFilePath}`);
        continue;
      }

      const chunkId = hashChunkId(chunk.file, index);
      const point = {
        id: chunkId,
        vector: embedding,
        payload: {
          filePath: chunk.file,      // already normalized via relativeFilePath
          text: chunk.text,
          metadata: {
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

  const { client, collectionName } = db;
  await ensureQdrantCollection(db);

  const totalCountResult = await client.count(collectionName, { exact: true });
  const totalDocs = totalCountResult.count ?? 0;
  console.log(`[Search] Total chunks in Qdrant: ${totalDocs}`);

  if (totalDocs === 0) {
    console.warn("[Search] No chunks found — run ingestion first.");
    return [];
  }

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
          doc?.payload &&
          typeof doc.payload.filePath === "string" &&
          typeof doc.payload.text === "string" &&
          doc.payload.text.trim().length > 0
      )
      .map((doc) => ({
        filePath: doc.payload.filePath,
        text: doc.payload.text,
        score: doc.score,
      }));

    console.log(`[Search] Qdrant search returned ${rawResults.length} results, ${results.length} valid`);
    if (results.length > 0) return results;
  } catch (err) {
    console.warn("[Search] Qdrant search failed:", err.message);
  }

  // Brute-force fallback
  console.log("[Search] Falling back to brute-force cosine similarity...");
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
          doc.payload?.filePath &&
          doc.payload?.text?.trim().length > 0
      )
      .map((doc) => ({
        filePath: doc.payload.filePath,
        text: doc.payload.text,
        score: cosineSimilarity(queryEmbedding, doc.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[Search] Brute-force returning ${scored.length} results`);
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
  }));
}

export async function ensureQdrantCollection(db) {
  if (!db || !db.client || !db.collectionName) {
    throw new Error("Qdrant database connection is required to ensure collection.");
  }
  const { client, collectionName } = db;
  const existing = await client.getCollections();
  if (!existing.collections?.some((c) => c.name === collectionName)) {
    await client.createCollection(collectionName, {
      vectors: { size: DEFAULT_DIMENSIONS, distance: "Cosine" },
    });
    console.log(`[Qdrant] Created collection ${collectionName}`);
  }
}

function cosineSimilarity(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;

  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}