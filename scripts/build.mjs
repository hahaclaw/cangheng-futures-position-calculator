import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(src, dist, { recursive: true });

const buildInfo = {
  builtAt: new Date().toISOString(),
  source: "cangheng-futures-position-calculator",
};
await writeFile(path.join(dist, "build-info.json"), `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");

console.log(`Built ${path.relative(root, dist)} at ${buildInfo.builtAt}`);
