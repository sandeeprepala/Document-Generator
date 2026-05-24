import { pipeline } from "@xenova/transformers";

let extractor;
//comment81234
export async function loadModel() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export async function generateEmbedding(text) {
  const model = await loadModel();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}