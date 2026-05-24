/**
 * Chunks raw text content into smaller pieces.
 *
 * @param {string} text - The raw text content to chunk
 * @param {string} fileName - The name/path of the file this text came from
 * @param {number} chunkSize - Size of each chunk in characters
 * @returns {Array} Array of {file, text} objects
 */
//comment8123412233
export function chunkFile(text = "", fileName, chunkSize = 1000) {
  const chunks = [];
  const normalizedText = String(text);

  for (let i = 0; i < normalizedText.length; i += chunkSize) {
    const chunkText = normalizedText.slice(i, i + chunkSize).trim();
    if (chunkText.length === 0) continue;

    chunks.push({
      file: fileName,
      text: chunkText,
    });
  }

  return chunks;
}