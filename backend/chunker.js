/**
 * Chunks raw text content into smaller pieces.
 *
 * @param {string} text - The raw text content to chunk
 * @param {string} fileName - The name/path of the file this text came from
 * @param {number} chunkSize - Size of each chunk in characters
 * @returns {Array} Array of {file, text} objects
 */
//comment1
export function chunkFile(text, fileName, chunkSize = 1000) {
    const chunks = [];

    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push({
            file: fileName,
            text: text.slice(i, i + chunkSize),
        });
    }

    return chunks;
}