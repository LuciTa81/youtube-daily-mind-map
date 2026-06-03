import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_ROOT = "out";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"]
]);

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getContentType(filePath) {
  return contentTypes.get(extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

function resolveSafePath(rootDir, pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const normalizedPath = normalize(decodedPath).replace(/^([/\\])+/, "");
  const requestedPath = resolve(rootDir, normalizedPath);

  if (requestedPath !== rootDir && !requestedPath.startsWith(`${rootDir}${sep}`)) {
    return undefined;
  }

  return requestedPath;
}

function getRequestFile(rootDir, url) {
  const parsedUrl = new URL(url, "http://localhost");
  const requestedPath = resolveSafePath(rootDir, parsedUrl.pathname);

  if (!requestedPath) {
    return undefined;
  }

  if (!existsSync(requestedPath)) {
    return join(rootDir, "index.html");
  }

  const stats = statSync(requestedPath);
  return stats.isDirectory() ? join(requestedPath, "index.html") : requestedPath;
}

const rootDir = resolve(process.env.STATIC_ROOT ?? DEFAULT_ROOT);
const host = process.env.STATIC_HOST ?? DEFAULT_HOST;
const port = parseInteger(process.env.STATIC_PORT, DEFAULT_PORT);

if (!existsSync(rootDir)) {
  console.error(`Static root does not exist: ${rootDir}`);
  process.exit(1);
}

const server = createServer((request, response) => {
  try {
    const filePath = getRequestFile(rootDir, request.url ?? "/");

    if (!filePath || !existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": getContentType(filePath) });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(400);
    response.end("Bad request");
  }
});

server.listen(port, host, () => {
  console.log(`Serving ${rootDir} at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
