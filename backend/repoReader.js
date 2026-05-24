import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
//comment834
const CLONE_DIR = "./cloned-repo";

export async function cloneRepo(repoUrl) {
    if (fs.existsSync(CLONE_DIR)) {
        fs.rmSync(CLONE_DIR, { recursive: true, force: true });
    }

    const git = simpleGit();
    console.log("[DocGen] Cloning repo:", repoUrl);
    await git.clone(repoUrl, CLONE_DIR);
    console.log("[DocGen] Repo cloned ✓");
}

export function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    const ignoredFolders = ["node_modules", ".git", "dist", "build"];

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);

        if (
            fs.statSync(fullPath).isDirectory() &&
            !ignoredFolders.includes(file)
        ) {
            getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (
                file.endsWith(".js") ||
                file.endsWith(".jsx") ||
                file.endsWith(".ts") ||
                file.endsWith(".tsx") ||
                file.endsWith(".md") ||
                file.endsWith(".txt") ||
                file.endsWith(".json") ||
                file.endsWith(".html") ||
                file.endsWith(".css")
            ) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}