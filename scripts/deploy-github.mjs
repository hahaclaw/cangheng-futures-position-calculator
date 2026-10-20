import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const envText = await readFile(path.join(ROOT, ".secrets", "deploy.env"), "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const token = env.GITHUB_TOKEN;
const repoName = env.GITHUB_REPO || "cangheng-futures-position-calculator";
if (!token) throw new Error("GITHUB_TOKEN is missing");

const API = "https://api.github.com";
const headers = {
  authorization: `Bearer ${token}`,
  accept: "application/vnd.github+json",
  "user-agent": "cangheng-deploy",
  "x-github-api-version": "2022-11-28",
};

async function request(endpoint, { method = "GET", body, allow = [] } = {}) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${API}${endpoint}`, {
        method,
        headers: { ...headers, ...(body ? { "content-type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      if (response.ok || allow.includes(response.status)) {
        return { status: response.status, data, headers: response.headers };
      }
      const message = data?.message || text || response.statusText;
      if (response.status >= 500 && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        continue;
      }
      throw new Error(`${method} ${endpoint} → ${response.status}: ${message}`);
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

const user = (await request("/user")).data;
const owner = user.login;
const repo = repoName;
console.log(`GitHub account: ${owner}`);

let repoInfo = (await request(`/repos/${owner}/${repo}`, { allow: [404] })).data;
if (repoInfo?.message === "Not Found" || !repoInfo) {
  console.log(`Creating repository ${owner}/${repo} ...`);
  repoInfo = (
    await request("/user/repos", {
      method: "POST",
      body: {
        name: repo,
        description: "期货仓位计算器：交易单位、一手保证金与风险预算手数",
        private: false,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        auto_init: false,
      },
    })
  ).data;
  console.log(`Created ${repoInfo.html_url}`);
} else {
  const commits = (
    await request(`/repos/${owner}/${repo}/commits?per_page=1`, { allow: [409] })
  ).data;
  console.log(
    Array.isArray(commits) && commits.length > 0
      ? `Using existing repository ${owner}/${repo}; files will be updated idempotently`
      : `Using existing empty repository ${owner}/${repo}`,
  );
}

const tracked = (await readFile(path.join(ROOT, ".secrets", "tracked-files.txt"), "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

// Upload the workflow last so the final push is the one that triggers deployment.
tracked.sort((a, b) => {
  const aw = a.startsWith(".github/workflows/") ? 1 : 0;
  const bw = b.startsWith(".github/workflows/") ? 1 : 0;
  return aw - bw || a.localeCompare(b);
});

console.log(`Uploading ${tracked.length} files via Contents API ...`);
let lastCommit = null;
for (const file of tracked) {
  const content = await readFile(path.join(ROOT, file));
  const apiPath = file.split("/").map(encodeURIComponent).join("/");
  const existing = await request(`/repos/${owner}/${repo}/contents/${apiPath}`, { allow: [404] });
  const body = {
    message: `feat: add ${file}`,
    content: content.toString("base64"),
    branch: "main",
  };
  if (existing.data?.sha) body.sha = existing.data.sha;
  try {
    lastCommit = (
      await request(`/repos/${owner}/${repo}/contents/${apiPath}`, {
        method: "PUT",
        body,
      })
    ).data.commit;
  } catch (error) {
    // The very first upload to an empty repository can create the default branch.
    if (String(error.message).includes("Branch main not found")) {
      delete body.branch;
      lastCommit = (
        await request(`/repos/${owner}/${repo}/contents/${apiPath}`, {
          method: "PUT",
          body,
        })
      ).data.commit;
    } else {
      throw error;
    }
  }
  process.stdout.write(".");
}
process.stdout.write("\n");
console.log(`Latest upload commit: ${lastCommit?.sha?.slice(0, 7) || "unknown"}`);

await request(`/repos/${owner}/${repo}`, {
  method: "PATCH",
  body: { homepage: `https://${owner}.github.io/${repo}/`, default_branch: "main" },
});
await request(`/repos/${owner}/${repo}/topics`, {
  method: "PUT",
  body: { names: ["futures", "position-sizing", "risk-management", "china", "github-pages"] },
});

let pagesStatus = null;
const pagesResponse = await request(`/repos/${owner}/${repo}/pages`, { allow: [404] });
if (pagesResponse.status === 404) {
  try {
    pagesStatus = (
      await request(`/repos/${owner}/${repo}/pages`, {
        method: "POST",
        body: { build_type: "workflow" },
      })
    ).data;
  } catch (error) {
    console.warn(`Pages enable warning: ${error.message}`);
  }
} else {
  pagesStatus = pagesResponse.data;
  if (pagesStatus.build_type !== "workflow") {
    try {
      pagesStatus = (
        await request(`/repos/${owner}/${repo}/pages`, {
          method: "PUT",
          body: { build_type: "workflow" },
        })
      ).data;
    } catch (error) {
      console.warn(`Pages update warning: ${error.message}`);
    }
  }
}

// Wait for the push-triggered workflow run, then dispatch manually if necessary.
let run = null;
for (let attempt = 0; attempt < 24; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const runs = (
    await request(`/repos/${owner}/${repo}/actions/runs?per_page=10`, { allow: [404] })
  ).data;
  const candidates = runs?.workflow_runs || [];
  run =
    candidates.find((item) => item.head_sha === lastCommit?.sha) ||
    candidates.find((item) => item.path === ".github/workflows/deploy.yml") ||
    null;
  if (run) break;
}

if (!run) {
  console.log("No push run yet; dispatching workflow manually ...");
  await request(`/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`, {
    method: "POST",
    body: { ref: "main" },
  });
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const runs = (
      await request(`/repos/${owner}/${repo}/actions/runs?per_page=10`, { allow: [404] })
    ).data;
    run =
      (runs?.workflow_runs || []).find((item) => item.path === ".github/workflows/deploy.yml") ||
      null;
    if (run) break;
  }
}

if (!run) throw new Error("没有找到 GitHub Actions 运行记录");

console.log(`Workflow: ${run.html_url}`);
let conclusion = run.conclusion;
for (let attempt = 0; attempt < 100; attempt += 1) {
  if (conclusion) break;
  await new Promise((resolve) => setTimeout(resolve, 4000));
  const current = (await request(`/repos/${owner}/${repo}/actions/runs/${run.id}`)).data;
  conclusion = current.conclusion;
  process.stdout.write(".");
}
process.stdout.write("\n");
console.log(`Workflow conclusion: ${conclusion}`);

if (conclusion !== "success") {
  const jobs = (await request(`/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`)).data;
  for (const job of jobs?.jobs || []) {
    console.log(`Job ${job.name}: ${job.conclusion}`);
    for (const step of job.steps || []) {
      if (step.conclusion === "failure") console.log(`  failed step: ${step.name}`);
    }
  }
  throw new Error(`GitHub Actions failed: ${run.html_url}`);
}

let siteUrl = `https://${owner}.github.io/${repo}/`;
for (let attempt = 0; attempt < 20; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const pages = (await request(`/repos/${owner}/${repo}/pages`, { allow: [404] })).data;
  if (pages?.html_url) {
    siteUrl = pages.html_url.endsWith("/") ? pages.html_url : `${pages.html_url}/`;
    if (pages.status === "built" || pages.status === null) break;
  }
}
console.log(`Pages URL: ${siteUrl}`);

let httpStatus = null;
for (let attempt = 0; attempt < 20; attempt += 1) {
  try {
    const response = await fetch(siteUrl, { redirect: "follow" });
    httpStatus = response.status;
    if (response.ok) break;
  } catch {
    // Deployment can lag a few seconds behind the Pages API.
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
}
console.log(`HTTP status: ${httpStatus}`);

await writeFile(
  path.join(ROOT, ".secrets", "deploy-result.json"),
  `${JSON.stringify(
    {
      owner,
      repo,
      commit: lastCommit?.sha,
      workflow: run.html_url,
      siteUrl,
      httpStatus,
      pagesStatus,
      deployedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);
