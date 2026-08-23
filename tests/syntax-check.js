const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");

const root = path.resolve(__dirname, "..");
const files = fs.readdirSync(root);

files.filter((file) => file.endsWith(".gs")).forEach((file) => {
  childProcess.execFileSync(process.execPath, ["--check"], {
    input: fs.readFileSync(path.join(root, file)),
    stdio: ["pipe", "pipe", "pipe"]
  });
});

files.filter((file) => file.endsWith(".html")).forEach((file) => {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const scripts = Array.from(html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi), (match) => match[1]);
  if (!scripts.length) return;
  const temporary = path.join(os.tmpdir(), `coachiq-${path.basename(file)}-${process.pid}.js`);
  try {
    fs.writeFileSync(temporary, scripts.join("\n"));
    childProcess.execFileSync(process.execPath, ["--check", temporary], {stdio: "pipe"});
  } finally {
    fs.rmSync(temporary, {force: true});
  }
});

console.log("CoachIQ Apps Script and browser JavaScript syntax OK");
