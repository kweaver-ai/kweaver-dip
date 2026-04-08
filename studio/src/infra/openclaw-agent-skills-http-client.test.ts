import { describe, expect, it, vi } from "vitest";

import {
  buildOpenClawAgentSkillsUrl,
  buildOpenClawSkillInstallUrl,
  buildOpenClawSkillContentUrl,
  buildOpenClawSkillDownloadUrl,
  buildOpenClawSkillTreeUrl,
  buildOpenClawSkillUninstallUrl,
  createOpenClawAgentSkillsHeaders,
  createOpenClawSkillInstallFormData,
  createOpenClawAgentSkillsStatusError,
  createOpenClawSkillInstallStatusError,
  createOpenClawSkillContentStatusError,
  createOpenClawSkillDownloadStatusError,
  createOpenClawSkillTreeStatusError,
  DefaultOpenClawAgentSkillsHttpClient,
  normalizeOpenClawAgentSkillsError,
  normalizeOpenClawSkillContentError,
  normalizeOpenClawSkillDownloadError,
  normalizeOpenClawSkillInstallError,
  normalizeOpenClawSkillTreeError
} from "./openclaw-agent-skills-http-client";

describe("buildOpenClawSkillInstallUrl", () => {
  it("converts gateway URL and optional overwrite query", () => {
    expect(buildOpenClawSkillInstallUrl("ws://127.0.0.1:19001/ws")).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/install"
    );
    expect(
      buildOpenClawSkillInstallUrl("http://127.0.0.1:19001", { overwrite: true })
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills/install?overwrite=true");
    expect(
      buildOpenClawSkillInstallUrl("http://127.0.0.1:19001", {
        name: "my-skill"
      })
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills/install?name=my-skill");
    expect(
      buildOpenClawSkillInstallUrl("http://127.0.0.1:19001", {
        overwrite: true,
        name: "x"
      })
    ).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/install?overwrite=true&name=x"
    );
  });
});

describe("buildOpenClawSkillUninstallUrl", () => {
  it("converts gateway URL and encodes path parameter", () => {
    expect(
      buildOpenClawSkillUninstallUrl("ws://127.0.0.1:19001/ws", "weather")
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills/weather");
    expect(
      buildOpenClawSkillUninstallUrl("http://127.0.0.1:19001", "a.b")
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills/a.b");
  });
});

describe("buildOpenClawSkillTreeUrl", () => {
  it("converts gateway URL and encodes path parameter", () => {
    expect(
      buildOpenClawSkillTreeUrl("ws://127.0.0.1:19001/ws", "weather")
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills/weather/tree");
    expect(
      buildOpenClawSkillTreeUrl("http://127.0.0.1:19001", "a.b")
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills/a.b/tree");
    expect(
      buildOpenClawSkillTreeUrl("http://127.0.0.1:19001", "a.b", "/repo/skills/a.b")
    ).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/a.b/tree?resolvedSkillPath=%2Frepo%2Fskills%2Fa.b"
    );
  });
});

describe("buildOpenClawSkillContentUrl", () => {
  it("converts gateway URL and appends preview path query", () => {
    expect(
      buildOpenClawSkillContentUrl("ws://127.0.0.1:19001/ws", "weather", "docs/guide.md")
    ).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/content?path=docs%2Fguide.md"
    );
    expect(
      buildOpenClawSkillContentUrl(
        "http://127.0.0.1:19001",
        "weather",
        "docs/guide.md",
        "/repo/skills/weather"
      )
    ).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/content?path=docs%2Fguide.md&resolvedSkillPath=%2Frepo%2Fskills%2Fweather"
    );
  });
});

describe("buildOpenClawSkillDownloadUrl", () => {
  it("converts gateway URL and appends download path query", () => {
    expect(
      buildOpenClawSkillDownloadUrl("ws://127.0.0.1:19001/ws", "weather", "docs/guide.md")
    ).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/download?path=docs%2Fguide.md"
    );
    expect(
      buildOpenClawSkillDownloadUrl(
        "http://127.0.0.1:19001",
        "weather",
        "docs/guide.md",
        "/repo/skills/weather"
      )
    ).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/download?path=docs%2Fguide.md&resolvedSkillPath=%2Frepo%2Fskills%2Fweather"
    );
  });
});

describe("buildOpenClawAgentSkillsUrl", () => {
  it("converts ws/wss to http/https and appends agentId when present", () => {
    expect(
      buildOpenClawAgentSkillsUrl("ws://127.0.0.1:19001/ws?x=1")
    ).toBe("http://127.0.0.1:19001/v1/config/agents/skills");

    expect(
      buildOpenClawAgentSkillsUrl("wss://gateway.example.com/socket", "agent-2")
    ).toBe("https://gateway.example.com/v1/config/agents/skills?agentId=agent-2");
  });
});

describe("createOpenClawAgentSkillsHeaders", () => {
  it("creates headers with optional authorization and json content type", () => {
    const headers = createOpenClawAgentSkillsHeaders("secret-token", true);

    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Bearer secret-token");
    expect(headers.get("content-type")).toBe("application/json");

    const withoutToken = createOpenClawAgentSkillsHeaders();
    expect(withoutToken.get("authorization")).toBeNull();
    expect(withoutToken.get("content-type")).toBeNull();
  });
});

describe("createOpenClawSkillInstallFormData", () => {
  it("creates multipart form data with a file field", async () => {
    const body = createOpenClawSkillInstallFormData(Buffer.from([0x50, 0x4b]), "weather");
    const file = body.get("file");

    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("weather.skill");
    expect(Buffer.from(await (file as File).arrayBuffer())).toEqual(Buffer.from([0x50, 0x4b]));
  });
});

describe("createOpenClawSkillInstallStatusError", () => {
  it("returns a 502 error with upstream details", async () => {
    const response = new Response("bad", { status: 400 });

    await expect(createOpenClawSkillInstallStatusError(response)).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/config/agents/skills/install returned HTTP 400: bad"
    });
  });
});

describe("normalizeOpenClawSkillInstallError", () => {
  it("wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    expect(normalizeOpenClawSkillInstallError(new HttpError(502, "x"))).toMatchObject({
      statusCode: 502
    });
    expect(normalizeOpenClawSkillInstallError(new Error("down"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/config/agents/skills/install: down"
    });
  });
});

describe("createOpenClawSkillTreeStatusError", () => {
  it("returns a 502 error with upstream details", async () => {
    const response = new Response("missing", { status: 404 });

    await expect(createOpenClawSkillTreeStatusError(response)).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/config/agents/skills/{name}/tree returned HTTP 404: missing"
    });
  });
});

describe("createOpenClawSkillContentStatusError", () => {
  it("returns a 502 error with upstream details", async () => {
    const response = new Response("bad path", { status: 400 });

    await expect(createOpenClawSkillContentStatusError(response)).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/config/agents/skills/{name}/content returned HTTP 400: bad path"
    });
  });
});

describe("createOpenClawSkillDownloadStatusError", () => {
  it("returns a 502 error with upstream details", async () => {
    const response = new Response("bad path", { status: 400 });

    await expect(createOpenClawSkillDownloadStatusError(response)).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/config/agents/skills/{name}/download returned HTTP 400: bad path"
    });
  });
});

describe("normalizeOpenClawSkillTreeError", () => {
  it("wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    expect(normalizeOpenClawSkillTreeError(new HttpError(502, "x"))).toMatchObject({
      statusCode: 502
    });
    expect(normalizeOpenClawSkillTreeError(new Error("down"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/config/agents/skills/{name}/tree: down"
    });
  });
});

describe("normalizeOpenClawSkillContentError", () => {
  it("wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    expect(normalizeOpenClawSkillContentError(new HttpError(502, "x"))).toMatchObject({
      statusCode: 502
    });
    expect(normalizeOpenClawSkillContentError(new Error("down"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/config/agents/skills/{name}/content: down"
    });
  });
});

describe("normalizeOpenClawSkillDownloadError", () => {
  it("wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    expect(normalizeOpenClawSkillDownloadError(new HttpError(502, "x"))).toMatchObject({
      statusCode: 502
    });
    expect(normalizeOpenClawSkillDownloadError(new Error("down"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/config/agents/skills/{name}/download: down"
    });
  });
});

describe("createOpenClawAgentSkillsStatusError", () => {
  it("returns a 502 error with upstream details", async () => {
    const response = new Response("denied", {
      status: 403
    });

    await expect(createOpenClawAgentSkillsStatusError(response)).resolves.toMatchObject({
      statusCode: 502,
      message: "OpenClaw /v1/config/agents/skills returned HTTP 403: denied"
    });
  });
});

describe("normalizeOpenClawAgentSkillsError", () => {
  it("keeps HttpError instances and wraps unknown errors", async () => {
    const { HttpError } = await import("../errors/http-error");
    const httpError = new HttpError(502, "bad gateway");

    expect(normalizeOpenClawAgentSkillsError(httpError)).toBe(httpError);
    expect(normalizeOpenClawAgentSkillsError(new Error("offline"))).toMatchObject({
      statusCode: 502,
      message: "Failed to communicate with OpenClaw /v1/config/agents/skills: offline"
    });
  });
});

describe("DefaultOpenClawAgentSkillsHttpClient", () => {
  it("lists available skills", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ skills: ["weather", "search"] }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "ws://127.0.0.1:19001/ws",
        token: "secret",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(client.listAvailableSkills()).resolves.toEqual({
      skills: ["weather", "search"]
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills"
    );
  });

  it("reads one agent's skill bindings", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ agentId: "a1", skills: ["weather"] }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(client.getAgentSkills("a1")).resolves.toEqual({
      agentId: "a1",
      skills: ["weather"]
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills?agentId=a1"
    );
  });

  it("updates one agent's skill bindings", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        agentId: "a1",
        skills: ["weather", "search"]
      }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      })
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(
      client.updateAgentSkills("a1", ["weather", "search"])
    ).resolves.toEqual({
      success: true,
      agentId: "a1",
      skills: ["weather", "search"]
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ agentId: "a1", skills: ["weather", "search"] })
    });
  });

  it("installs a skill zip via POST", async () => {
    const zipBody = Buffer.from([0x50, 0x4b]);
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "weather",
          skillPath: "/data/skills/weather"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        token: "t",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(client.installSkill(zipBody, { overwrite: true })).resolves.toEqual({
      name: "weather",
      skillPath: "/data/skills/weather"
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/install?overwrite=true"
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.method).toBe("POST");
    expect(fetchImpl.mock.calls[0]?.[1]?.body).toBeInstanceOf(FormData);
    const file = (fetchImpl.mock.calls[0]?.[1]?.body as FormData).get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("skill.skill");
  });

  it("uninstalls a skill via DELETE", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ name: "weather" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        token: "t",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(client.uninstallSkill("weather")).resolves.toEqual({
      name: "weather"
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "DELETE"
    });
  });

  it("reads a skill tree via GET", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "weather",
          entries: [{ name: "SKILL.md", path: "SKILL.md", type: "file" }]
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        token: "t",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(client.getSkillTree("weather", "/repo/skills/weather")).resolves.toEqual({
      name: "weather",
      entries: [{ name: "SKILL.md", path: "SKILL.md", type: "file" }]
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/tree?resolvedSkillPath=%2Frepo%2Fskills%2Fweather"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "GET"
    });
  });

  it("reads skill content via GET", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "weather",
          path: "SKILL.md",
          content: "# Weather",
          bytes: 9,
          truncated: false
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        token: "t",
        timeoutMs: 5000
      },
      fetchImpl
    );

    await expect(
      client.getSkillContent("weather", "SKILL.md", "/repo/skills/weather")
    ).resolves.toEqual({
      name: "weather",
      path: "SKILL.md",
      content: "# Weather",
      bytes: 9,
      truncated: false
    });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/content?path=SKILL.md&resolvedSkillPath=%2Frepo%2Fskills%2Fweather"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "GET"
    });
  });

  it("downloads skill file via GET", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(Buffer.from("hello"), {
        status: 200,
        headers: {
          "content-type": "text/plain",
          "content-disposition": 'attachment; filename="a.txt"'
        }
      })
    );

    const client = new DefaultOpenClawAgentSkillsHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        token: "t",
        timeoutMs: 5000
      },
      fetchImpl
    );

    const result = await client.downloadSkillFile(
      "weather",
      "docs/a.txt",
      "/repo/skills/weather"
    );
    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toBe("text/plain");
    expect(result.headers.get("content-disposition")).toBe(
      'attachment; filename="a.txt"'
    );
    expect(Buffer.from(result.body)).toEqual(Buffer.from("hello"));

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      "http://127.0.0.1:19001/v1/config/agents/skills/weather/download?path=docs%2Fa.txt&resolvedSkillPath=%2Frepo%2Fskills%2Fweather"
    );
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({
      method: "GET"
    });
  });
});
