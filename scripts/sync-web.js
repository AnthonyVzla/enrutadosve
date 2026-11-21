import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const webDirectory = path.join(root, "www");
const appShellFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
  "enruta2-logo.png",
  "enruta2-icon-192.png",
  "enruta2-icon-512.png",
  "email-notification-message-ring.wav",
];

await mkdir(webDirectory, { recursive: true });
await Promise.all(appShellFiles.map((file) => copyFile(
  path.join(root, file),
  path.join(webDirectory, file),
)));
console.log(`Copied ${appShellFiles.length} EnRuta2 web assets into www/.`);
