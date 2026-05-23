import dotenv from 'dotenv';
dotenv.config();

import {
    cloneRepo,
    getAllFiles
} from './repoReader.js';

import { chunkFile } from './chunker.js';

import { generateEmbedding } from './embedding.js';

import { generateDocumentation } from './gemini.js';

const REPO_URL =
'https://github.com/Varshith-092006/RESQ';

async function main() {

    // STEP 1
    await cloneRepo(REPO_URL);

    // STEP 2
    const files = getAllFiles('./cloned-repo');

    console.log(`Found ${files.length} files`);

    const allChunks = [];

    // STEP 3
    for (const file of files) {

        const chunks = chunkFile(file);

        for (const chunk of chunks) {

            const embedding =
                await generateEmbedding(chunk.text);

            allChunks.push({
                file: chunk.file,
                text: chunk.text,
                embedding
            });

            console.log(`Embedded: ${chunk.file}`);
        }
    }

    // STEP 4
    // IMPORTANT:
    // Here you can add:
    // - semantic grouping
    // - architecture extraction
    // - duplicate filtering

    // STEP 5
    const combinedContext = allChunks
        .map(item => item.text)
        .join('\n');

    // STEP 6
    const docs = await generateDocumentation(
        combinedContext
    );

    console.log('\n\nDOCUMENTATION:\n');

    console.log(docs);
}

main();