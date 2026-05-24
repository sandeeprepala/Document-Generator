import "dotenv/config";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
//comment8123
export async function generateDocumentation(context, changedFiles = []) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const fileList = changedFiles.length
    ? `\nChanged files:\n- ${changedFiles.join("\n- ")}`
    : "";

  const prompt = `
You are a senior software engineer.

Update existing project documentation based only on the changed code below.
Do not regenerate the full README. Produce a concise markdown section suitable for insertion into the current README.
Keep the output focused on what changed and why the code was updated.

IMPORTANT RULES:
- Keep documentation concise
- Keep output clean and readable
- Do NOT explain every file in the repo
- Do NOT generate huge tables
- Do NOT rewrite the entire README
- Only include changed code context and a short summary
- Use markdown headings and bullet points

${fileList}

CHANGED CODE CONTEXT:
${context}
`;

  const result = await model.generateContent(prompt);
  const documentation = result.response.text();
  return documentation;
}

export async function generateAnswer(question, chunks) {
  if (!chunks || chunks.length === 0) {
    throw new Error("No ingested document chunks available. Please ingest files first.");
  }

  const validChunks = chunks.filter(
    (chunk) =>
      chunk &&
      typeof chunk.filePath === "string" &&
      typeof chunk.text === "string" &&
      chunk.text.trim().length > 0
  );

  if (validChunks.length === 0) {
    throw new Error("No valid document chunks available. Please ingest files first.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const chunkContext = validChunks
    .map((chunk, index) => `Source ${index + 1}: ${chunk.filePath}\n${chunk.text}`)
    .join("\n\n---\n\n");

  console.log(`[Gemini] Sending ${validChunks.length} chunks as context to Gemini.`);

  const prompt = `You are an expert assistant that answers developer questions using the provided document content.
Use only the provided information from the document chunks. If the answer cannot be found in the provided content, say that you do not have enough information.
Do not use bold text. Give response in plain points.

DOCUMENT CHUNKS:
${chunkContext}

USER QUESTION:
${question}

Provide a concise answer and reference the source chunks when helpful.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}