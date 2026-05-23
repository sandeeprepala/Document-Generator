import "dotenv/config";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateDocumentation(context) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a senior software engineer.

Analyze this repository and generate concise
developer documentation.

IMPORTANT RULES:
- Keep documentation concise
- Keep output clean and readable
- Do NOT explain every file
- Do NOT generate huge tables
- Do NOT go too deep into implementation
- Focus only on important architecture
- Return proper markdown format

Generate ONLY these sections:

# Project Overview
- What the project does
- Main technologies used

# Core Features
- Main functionalities only

# Architecture
- Short frontend/backend explanation

# Important Modules
- Authentication
- APIs
- Database
- Real-time systems

# Setup
- Minimal installation steps

# Deployment
- Short deployment summary

# Major APIs
- Mention only important endpoints

CODEBASE:
${context}
`;

    const result = await model.generateContent(prompt);
    const documentation = result.response.text();

    // Save locally as well (optional local copy)
    fs.writeFileSync("DOCUMENTATION.md", documentation);
    console.log("[DocGen] DOCUMENTATION.md saved locally ✓");

    return documentation;
}