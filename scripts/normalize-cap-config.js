import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import config from "../capacitor.config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const target = path.join(root, "android", "app", "src", "main", "assets", "capacitor.config.json");
await writeFile(target, `${JSON.stringify(config, null, 2)}\n`);
console.log("Wrote the native Capacitor config.");
