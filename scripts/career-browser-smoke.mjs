import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const output = path.join(tmpdir(), "world256-career-qa");
mkdirSync(output, { recursive: true });

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
]);

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/api/challenge") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ account: null, auth: { googleEnabled: false } }));
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Log in to use cloud saves." }));
    return;
  }
  const requested = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const relative = requested && path.extname(requested) ? requested : "index.html";
  const absolute = path.resolve(dist, relative);
  if (!absolute.startsWith(`${dist}${path.sep}`) && absolute !== path.join(dist, "index.html")) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = readFileSync(absolute);
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(absolute).toLowerCase()) || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const serverPort = server.address().port;
const chromePath = [
  process.env.CHROME_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => candidate && existsSync(candidate));
assert.ok(chromePath, "Chrome or Edge is required for the Career browser smoke test");

const profile = mkdtempSync(path.join(tmpdir(), "world256-career-browser-"));
const debugPort = await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => {
    const port = probe.address().port;
    probe.close((error) => error ? reject(error) : resolve(port));
  });
});
const browser = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-background-networking",
  "--disable-default-apps",
  "--disable-extensions",
  "--disable-sync",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
let browserDiagnostics = "";
browser.stderr.on("data", (chunk) => {
  browserDiagnostics = `${browserDiagnostics}${chunk}`.slice(-4000);
});

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForDevtools() {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (response.ok) return debugPort;
    } catch {
      // Browser is still starting.
    }
    if (browser.exitCode !== null) throw new Error(`Browser exited before DevTools started.\n${browserDiagnostics}`);
    await wait(50);
  }
  throw new Error(`Browser DevTools endpoint did not start.\n${browserDiagnostics}`);
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      (this.listeners.get(message.method) || []).forEach((listener) => listener(message.params || {}));
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }

  close() {
    this.socket.close();
  }
}

const devtoolsPort = await waitForDevtools();
const targetResponse = await fetch(`http://127.0.0.1:${devtoolsPort}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
const target = await targetResponse.json();
const cdp = new CdpClient(target.webSocketDebuggerUrl);
await cdp.open();
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Network.enable");
await cdp.send("Network.setBlockedURLs", {
  urls: ["https://pagead2.googlesyndication.com/*", "https://fonts.googleapis.com/*", "https://fonts.gstatic.com/*", "https://va.vercel-scripts.com/*"],
});
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});

const runtimeErrors = [];
cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
  runtimeErrors.push(exceptionDetails?.exception?.description || exceptionDetails?.text || "Unknown runtime error");
});

async function evaluate(expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result?.value;
}

async function waitFor(expression, label, timeout = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await wait(80);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function screenshot(name) {
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const destination = path.join(output, name);
  writeFileSync(destination, Buffer.from(data, "base64"));
  return destination;
}

const screenshots = [];
try {
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/player-career` });
  await waitFor("document.readyState === 'complete' && !!document.querySelector('#careerCreationForm')", "career creation form");
  const creationContract = await evaluate(`(() => ({
    screenVisible: !document.querySelector('#playerCareerScreen').hidden,
    shellHidden: document.querySelector('#appShell').hidden || getComputedStyle(document.querySelector('#appShell')).display === 'none',
    academies: document.querySelectorAll('.career-academy-card').length,
    nations: document.querySelector('[name="nationality"]').options.length,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: innerWidth
  }))()`);
  assert.equal(creationContract.screenVisible, true);
  assert.equal(creationContract.shellHidden, true);
  assert.equal(creationContract.academies, 3);
  assert.equal(creationContract.nations, 256);
  assert.ok(creationContract.bodyWidth <= creationContract.viewportWidth + 1, "creation UI must not overflow a 390px viewport");
  screenshots.push(await screenshot("career-creation-mobile.png"));

  await evaluate(`(() => {
    const form = document.querySelector('#careerCreationForm');
    form.elements.fullName.value = 'Samira Morgan';
    form.elements.nationality.value = 'team-50';
    form.elements.position.value = 'CAM';
    form.elements.preferredFoot.value = 'Both';
    form.requestSubmit();
    return true;
  })()`);
  await waitFor("!!document.querySelector('.career-hub')", "career hub");
  const hubContract = await evaluate(`(() => ({
    card: !!document.querySelector('.career-player-card'),
    next: !!document.querySelector('[data-career-action="play-match"]'),
    news: document.querySelectorAll('.career-news-item').length,
    saved: !!localStorage.getItem('world-256-player-career-v1'),
    bodyWidth: document.body.scrollWidth,
    viewportWidth: innerWidth
  }))()`);
  assert.deepEqual({ card: hubContract.card, next: hubContract.next, saved: hubContract.saved }, { card: true, next: true, saved: true });
  assert.ok(hubContract.news >= 2);
  assert.ok(hubContract.bodyWidth <= hubContract.viewportWidth + 1, "career hub must not overflow a 390px viewport");
  screenshots.push(await screenshot("career-hub-mobile.png"));

  await evaluate("document.querySelector('[data-career-action=\"hub-tab\"][data-tab=\"development\"]').click()");
  await waitFor("!!document.querySelector('#careerTrainingFocus')", "development panel");
  const pointsBefore = await evaluate("JSON.parse(localStorage.getItem('world-256-player-career-v1')).training.points");
  await evaluate("document.querySelector('[data-career-action=\"train\"]').click()");
  await waitFor(`JSON.parse(localStorage.getItem('world-256-player-career-v1')).training.points > ${pointsBefore}`, "weekly training result");
  screenshots.push(await screenshot("career-development-mobile.png"));

  await evaluate("document.querySelector('[data-career-action=\"play-match\"]').click()");
  await waitFor("!!document.querySelector('.career-match-shell')", "live match view");
  screenshots.push(await screenshot("career-match-mobile.png"));
  await evaluate("document.querySelector('[data-career-action=\"match-skip\"]').click()");
  await waitFor("!document.querySelector('#careerMatchFinish').hidden", "full-time result");
  screenshots.push(await screenshot("career-full-time-mobile.png"));
  await evaluate("document.querySelector('[data-career-action=\"match-finish\"]').click()");
  await waitFor("!!document.querySelector('.career-hub')", "career hub after match");

  for (let index = 0; index < 16; index += 1) {
    const status = await evaluate("JSON.parse(localStorage.getItem('world-256-player-career-v1')).season.status");
    if (status === "transfer") break;
    const actionIndex = await evaluate("JSON.parse(localStorage.getItem('world-256-player-career-v1')).actionIndex");
    const clicked = await evaluate(`(() => {
      const button = document.querySelector('[data-career-action="simulate-month"]');
      if (!button) return false;
      button.click();
      return true;
    })()`);
    assert.equal(clicked, true, "active season always exposes a month simulation action");
    await waitFor(`JSON.parse(localStorage.getItem('world-256-player-career-v1')).actionIndex > ${actionIndex}`, "month simulation");
    await wait(80);
  }
  await waitFor("!!document.querySelector('.career-transfer-shell')", "season-end transfer screen");
  const transferContract = await evaluate(`(() => ({
    offers: document.querySelectorAll('.career-offer-card').length,
    locked: document.querySelectorAll('.career-offer-card.is-locked').length,
    stay: !!document.querySelector('[data-offer-id="stay"]'),
    bodyWidth: document.body.scrollWidth,
    viewportWidth: innerWidth
  }))()`);
  assert.deepEqual({ offers: transferContract.offers, locked: transferContract.locked, stay: transferContract.stay }, { offers: 3, locked: 1, stay: true });
  assert.ok(transferContract.bodyWidth <= transferContract.viewportWidth + 1, "transfer UI must not overflow a 390px viewport");
  screenshots.push(await screenshot("career-transfers-mobile.png"));

  assert.deepEqual(runtimeErrors, [], `browser runtime errors:\n${runtimeErrors.join("\n")}`);
  console.log(`Career browser flow verified at 390x844. Screenshots:\n${screenshots.join("\n")}`);
} finally {
  cdp.close();
  browser.kill();
  await new Promise((resolve) => server.close(resolve));
  await wait(120);
  if (profile.startsWith(tmpdir())) rmSync(profile, { recursive: true, force: true });
}
