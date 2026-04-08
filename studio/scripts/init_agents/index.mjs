import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parses one `.env` line into `{ key, value }`, or `null` if skip (comment / empty / invalid).
 * Supports optional `export ` prefix and single- or double-quoted values. No dependency on `dotenv`.
 *
 * @param line Raw line from file.
 * @returns Parsed entry or null.
 */
function parseDotenvLine(line) {
  const trimmed = line.trim();
  if (trimmed === "" || trimmed.startsWith("#")) {
    return null;
  }
  let body = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
  const eq = body.indexOf("=");
  if (eq <= 0) {
    return null;
  }
  const key = body.slice(0, eq).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return null;
  }
  let value = body.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

/**
 * Loads a dotenv-style file into `process.env` without overriding keys that already exist
 * (same idea as the `dotenv` package). Uses only Node built-ins.
 *
 * @param filePath Absolute path to `.env`.
 * @returns Number of variables applied.
 */
function loadDotenvFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseDotenvLine(line);
    if (!parsed) continue;
    if (Object.prototype.hasOwnProperty.call(process.env, parsed.key)) {
      continue;
    }
    process.env[parsed.key] = parsed.value;
    applied += 1;
  }
  return applied;
}

const STUDIO_ROOT = path.join(__dirname, "..", "..");
const dotenvFilePath =
  process.env.INIT_AGENTS_DOTENV_PATH?.trim() || path.join(STUDIO_ROOT, ".env");

if (fs.existsSync(dotenvFilePath)) {
  loadDotenvFile(dotenvFilePath);
  console.log(`[配置] 已从 .env 加载: ${dotenvFilePath}`);
}

const STATE_DIR = process.env.OPENCLAW_ROOT_DIR || path.join(os.homedir(), ".openclaw");
const BUILT_IN_DIR = process.env.OPENCLAW_BUILT_IN_DIR || path.join(__dirname, "../..", "built-in");
const WORKSPACE_ROOT = path.resolve(
  process.env.OPENCLAW_WORKSPACE_DIR || STATE_DIR
);

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalTextFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return fs.readFileSync(filePath, "utf8");
}

function assertBuiltInAgentMetadata(metadata, metadataPath) {
  if (metadata.is_builtin !== true) {
    throw new Error(`built-in metadata.is_builtin 必须为 true: ${metadataPath}`);
  }

  if (typeof metadata.id !== "string" || metadata.id.trim() === "") {
    throw new Error(`built-in metadata.id 必须为非空字符串: ${metadataPath}`);
  }

  if (typeof metadata.name !== "string" || metadata.name.trim() === "") {
    throw new Error(`built-in metadata.name 必须为非空字符串: ${metadataPath}`);
  }
}

function loadBuiltInAgents() {
  if (!fs.existsSync(BUILT_IN_DIR) || !fs.statSync(BUILT_IN_DIR).isDirectory()) {
    throw new Error(`未找到 built-in 目录: ${BUILT_IN_DIR}`);
  }

  const builtInAgents = fs.readdirSync(BUILT_IN_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const builtInPath = path.join(BUILT_IN_DIR, entry.name);
      const metadataPath = path.join(builtInPath, "metadata.json");
      if (!fs.existsSync(metadataPath)) {
        return undefined;
      }

      const metadata = readJsonFile(metadataPath);
      if (metadata.type !== "agent") {
        console.log(`[跳过] ${builtInPath} metadata.json type=${metadata.type || "<empty>"}`);
        return undefined;
      }
      assertBuiltInAgentMetadata(metadata, metadataPath);

      return {
        id: metadata.id,
        name: metadata.name,
        workspace: path.join(WORKSPACE_ROOT, metadata.id),
        sandbox: metadata.sandbox,
        tools: metadata.tools,
        builtInPath,
        soul: readOptionalTextFile(path.join(builtInPath, "SOUL.md")),
        identity: readOptionalTextFile(path.join(builtInPath, "IDENTITY.md"))
      };
    })
    .filter(Boolean);

  if (builtInAgents.length === 0) {
    throw new Error(`built-in 目录中没有可用的内置 agent 定义: ${BUILT_IN_DIR}`);
  }

  return builtInAgents;
}

function upsertAgentConfig(agentConfigs, newAgent) {
  const existingIndex = agentConfigs.findIndex((agent) => agent.id === newAgent.id);
  if (existingIndex >= 0) {
    agentConfigs[existingIndex] = {
      ...agentConfigs[existingIndex],
      name: newAgent.name,
      workspace: newAgent.workspace,
      sandbox: newAgent.sandbox,
      tools: newAgent.tools
    };
    console.log(`[覆盖] 更新现有的 ${newAgent.id} 配置参数`);
    return;
  }

  agentConfigs.push(newAgent);
  console.log(`[新增] 在配置文件中注册 ${newAgent.id}`);
}

async function initOpenClawConfig(builtInAgents) {
  console.log("🛠️ 开始校准 openclaw.json 中的 Agent 配置...");
  const configPath = path.join(STATE_DIR, "openclaw.json");
  if (!fs.existsSync(configPath)) {
    console.warn("⚠️ 未找到 openclaw.json，跳过配置修改。");
    return;
  }

  let cfg;
  try {
    cfg = readJsonFile(configPath);
  } catch (err) {
    console.error("❌ openclaw.json 格式损坏，无法解析:", err);
    return;
  }

  cfg.agents = cfg.agents || {};
  cfg.agents.list = cfg.agents.list || [];

  for (const agent of builtInAgents) {
    upsertAgentConfig(cfg.agents.list, {
      id: agent.id,
      name: agent.name,
      workspace: agent.workspace,
      sandbox: agent.sandbox,
      tools: agent.tools
    });
  }

  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), "utf8");
  console.log(`✅ openclaw.json 成功写入 ${builtInAgents.length} 个内置 Agent 的配置保障！\n`);
}

function syncBuiltInFile(workspacePath, fileName, content, agentId) {
  if (content === undefined) {
    return;
  }

  const targetPath = path.join(workspacePath, fileName);
  fs.writeFileSync(targetPath, content, "utf8");
  console.log(`[写入] ${agentId} 同步 ${fileName} -> ${targetPath}`);
}

async function initPersonas(builtInAgents) {
  console.log("🦞 初始化 OpenClaw 内置 Agent 工作区...");
  console.log("根状态目录: " + STATE_DIR);
  console.log("工作区目录: " + WORKSPACE_ROOT + "\n");

  for (const agent of builtInAgents) {
    try {
      if (!fs.existsSync(agent.workspace)) {
        fs.mkdirSync(agent.workspace, { recursive: true });
        console.log("[创建] " + agent.id + " 专属工作区目录 -> " + agent.workspace);
      }

      syncBuiltInFile(agent.workspace, "SOUL.md", agent.soul, agent.id);
      syncBuiltInFile(agent.workspace, "IDENTITY.md", agent.identity, agent.id);
    } catch (err) {
      console.error(`[失败] ${agent.id} 初始化报错:`, err.message);
    }
  }

  console.log("\n✅ 所有内置 Agent 的工作区素材及 openclaw.json 权限注入均已完毕！");
  console.log("请确保您的 Gateway 后台监控已经重新加载配置！");
}

async function syncAuthProfiles(builtInAgents) {
  console.log("🔐 从 main agent 提取鉴权并同步到隔离 Agent 账户中...");
  const mainAuthPath = path.join(STATE_DIR, "agents", "main", "agent", "auth-profiles.json");
  if (!fs.existsSync(mainAuthPath)) {
    console.warn("⚠️ 未找到 main agent 的 auth-profiles.json，尝试 fallback 到 openclaw.json...");
    const configPath = path.join(STATE_DIR, "openclaw.json");
    if (!fs.existsSync(configPath)) {
      console.warn("⚠️ 未找到 openclaw.json，无法提取鉴权。");
      return;
    }
  }

  for (const agent of builtInAgents) {
    if (agent.id === "main") {
      continue;
    }

    const agentDir = path.join(STATE_DIR, "agents", agent.id, "agent");
    const agentAuthPath = path.join(agentDir, "auth-profiles.json");

    try {
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }
      fs.copyFileSync(mainAuthPath, agentAuthPath);
      console.log(`[同步] 已将 main 鉴权复制给 ${agent.id} -> ${agentAuthPath}`);
    } catch (err) {
      console.error(`[失败] ${agent.id} 鉴权同步失败:`, err.message);
    }
  }
}

async function main() {
  const builtInAgents = loadBuiltInAgents();
  await initOpenClawConfig(builtInAgents);
  await syncAuthProfiles(builtInAgents);
  await initPersonas(builtInAgents);
}

main().catch((err) => {
  console.error("致命错误:", err);
  process.exit(1);
});
