import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { discoverSkillNames } from "./skills-discovery";

/**
 * Registers skills CLI command and `/v1/config/agents/skills` HTTP routes.
 *
 * @param api OpenClaw plugin API.
 * @param repoRoot Repository / studio root (parent of `skills/`).
 * @param bundledSkillsDir Plugin-relative bundled skills directory.
 */
export function registerSkillsControl(
  api: OpenClawPluginApi,
  repoRoot: string,
  bundledSkillsDir: string
): void {
  const repoSkillsDir = path.join(repoRoot, "skills");

  api.registerCommand({
    name: "skills-manage",
    description: "Manage agent skills (list, enable, disable)",
    acceptsArgs: true,
    handler: async (ctx: any): Promise<any> => {
      const args = (ctx.args || "").trim().split(/\s+/);
      const sub = args[0]?.toLowerCase();

      if (sub === "list") {
        const allSkillNames = discoverSkillNames(repoSkillsDir, bundledSkillsDir, ctx.config);
        const configSkills = ctx.config.skills?.entries || {};
        if (allSkillNames.length === 0) return { text: "No skills discovered." };

        const lines = allSkillNames.map(name => {
          const enabled = (configSkills as any)[name]?.enabled !== false;
          return `- ${name}: ${enabled ? "✅ enabled" : "❌ disabled"}`;
        });
        return { text: "Available skills:\n" + lines.join("\n") };
      }

      if (sub === "enable" || sub === "disable") {
        const skillName = args[1];
        if (!skillName) return { text: `Usage: /skills-manage ${sub} <name>` };

        const currentConfig = await api.runtime.config.loadConfig();
        const nextCfg = JSON.parse(JSON.stringify(currentConfig));

        if (!nextCfg.skills) nextCfg.skills = {};
        if (!nextCfg.skills.entries) nextCfg.skills.entries = {};
        if (!nextCfg.skills.entries[skillName]) nextCfg.skills.entries[skillName] = {};

        const enabled = sub === "enable";
        nextCfg.skills.entries[skillName].enabled = enabled;

        await api.runtime.config.writeConfigFile(nextCfg);
        return { text: `Global skill "${skillName}" is now ${enabled ? "enabled" : "disabled"}.` };
      }

      return { text: "Usage: /skills-manage [list | enable <name> | disable <name>]" };
    }
  });

  api.registerHttpRoute({
    path: "/v1/config/agents/skills",
    match: "prefix",
    auth: "gateway",
    handler: async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || "", "http://localhost");

      if (req.method === "GET") {
        const agentId = url.searchParams.get("agentId");
        const config = await api.runtime.config.loadConfig();

        if (!agentId) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          const responseSkills = discoverSkillNames(repoSkillsDir, bundledSkillsDir, config);
          res.end(JSON.stringify({ skills: responseSkills }));
          return true;
        }

        const agent = (config.agents?.list as any[])?.find((a: any) => a.id === agentId);
        if (!agent) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: `Agent "${agentId}" not found` }));
          return true;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        const agentSkills = agent.skills;
        let responseSkills = agentSkills;
        if (agentSkills === undefined) {
          responseSkills = discoverSkillNames(repoSkillsDir, bundledSkillsDir, config, [agentId]);
        }
        res.end(JSON.stringify({ agentId, skills: responseSkills }));
        return true;
      }

      if (req.method === "POST" || req.method === "PUT") {
        try {
          const body = await new Promise<any>((resolve, reject) => {
            let data = "";
            req.on("data", (chunk: any) => (data += chunk));
            req.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch {
                reject(new Error("Invalid JSON body"));
              }
            });
            req.on("error", reject);
          });

          const { agentId, skills } = body;
          if (!agentId || !Array.isArray(skills)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "agentId (string) and skills (array) are required" }));
            return true;
          }

          const currentConfig = await api.runtime.config.loadConfig();
          const nextCfg = JSON.parse(JSON.stringify(currentConfig));

          if (!nextCfg.agents) nextCfg.agents = {};
          if (!nextCfg.agents.list) nextCfg.agents.list = [];

          const agentIndex = (nextCfg.agents.list as any[]).findIndex((a: any) => a.id === agentId);
          if (agentIndex === -1) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: `Agent "${agentId}" not found in list` }));
            return true;
          }

          nextCfg.agents.list[agentIndex].skills = skills;

          await api.runtime.config.writeConfigFile(nextCfg);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, agentId, skills }));
          return true;
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message }));
          return true;
        }
      }

      res.statusCode = 405;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Method not allowed. Use GET to read or POST/PUT to update." }));
      return true;
    }
  });
}
