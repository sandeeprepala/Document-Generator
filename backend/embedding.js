import { pipeline } from "@xenova/transformers";

let extractor;
//comment1
export async function loadModel() {
    if (!extractor) {
        extractor = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2"
        );
    }
    return extractor;
}

export async function generateEmbedding(text) {
    const extractor = await loadModel();

    const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data);
}