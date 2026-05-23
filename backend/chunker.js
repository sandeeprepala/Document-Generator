import fs from "fs";

export function chunkFile(filePath, chunkSize = 1000) {
    const content = fs.readFileSync(filePath, "utf-8");
    const chunks = [];

    for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push({
            file: filePath,
            text: content.slice(i, i + chunkSize),
        });
    }

    return chunks;
}