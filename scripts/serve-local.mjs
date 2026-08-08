import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicRoot = join(projectRoot, "dist");
const port = Number(process.env.PORT) || 8787;
const mimeTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
});

function publicFile(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, "");
  const candidate = resolve(publicRoot, normalize(decoded));
  if (candidate !== publicRoot && !candidate.startsWith(`${publicRoot}${sep}`)) return null;
  if (!existsSync(candidate) || !statSync(candidate).isFile()) return null;
  return candidate;
}

function sendFile(request, response, file) {
  response.writeHead(200, {
    "Cache-Control": "no-cache",
    "Content-Type": mimeTypes[extname(file).toLowerCase()] || "application/octet-stream",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
}

createServer((request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405).end("Method not allowed");
    return;
  }
  const pathname = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`).pathname;
  const requested = pathname === "/" ? publicFile("index.html") : publicFile(pathname);
  if (requested) {
    sendFile(request, response, requested);
    return;
  }
  // Browser routes are handled by the client app. Returning the shell here is
  // what makes refreshing /retro-euro-2020 (and every other clean route) work.
  if (!extname(pathname)) {
    sendFile(request, response, join(publicRoot, "index.html"));
    return;
  }
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("File not found");
}).listen(port, "127.0.0.1", () => {
  console.log(`Local app server: http://127.0.0.1:${port}`);
});
