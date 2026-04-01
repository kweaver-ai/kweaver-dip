import { describe, expect, it, vi } from "vitest";

import {
  buildOpenClawWorkspaceTempUploadUrl,
  createOpenClawWorkspaceTempUploadFormData,
  createOpenClawWorkspaceTempUploadHeaders,
  DefaultOpenClawWorkspaceTempHttpClient,
  normalizeOpenClawWorkspaceTempUploadError
} from "./openclaw-workspace-temp-http-client";

describe("buildOpenClawWorkspaceTempUploadUrl", () => {
  it("builds upload URL with required query parameters", () => {
    expect(
      buildOpenClawWorkspaceTempUploadUrl(
        "ws://127.0.0.1:19001/ws",
        "agent-1",
        "agent:agent-1:user:u:direct:chat-1"
      )
    ).toBe(
      "http://127.0.0.1:19001/v1/workspace/tmp/upload?agent=agent-1&session=agent%3Aagent-1%3Auser%3Au%3Adirect%3Achat-1"
    );
  });
});

describe("createOpenClawWorkspaceTempUploadHeaders", () => {
  it("creates authorization header", () => {
    const headers = createOpenClawWorkspaceTempUploadHeaders("t");

    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("x-file-name")).toBeNull();
    expect(headers.get("content-type")).toBeNull();
    expect(headers.get("accept")).toBe("application/json");
  });
});

describe("createOpenClawWorkspaceTempUploadFormData", () => {
  it("creates form-data file part with original filename", () => {
    const formData = createOpenClawWorkspaceTempUploadFormData(
      Buffer.from("hello"),
      "流程支持并行执行.md"
    );
    const file = formData.get("file");

    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("流程支持并行执行.md");
  });
});

describe("DefaultOpenClawWorkspaceTempHttpClient", () => {
  it("uploads one temp file", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          name: "stored.txt",
          path: "tmp/chat-1/stored.txt",
          absolutePath: "/tmp/chat-1/stored.txt",
          bytes: 5
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      )
    );

    const client = new DefaultOpenClawWorkspaceTempHttpClient(
      {
        gatewayUrl: "http://127.0.0.1:19001",
        token: "token",
        timeoutMs: 5_000
      },
      fetchImpl
    );

    const result = await client.uploadTempFile({
      agentId: "agent-1",
      sessionKey: "agent:agent-1:user:u:direct:chat-1",
      filename: "x.txt",
      body: Buffer.from("hello", "utf8")
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result.path).toBe("tmp/chat-1/stored.txt");
  });

  it("normalizes transport failures", () => {
    const normalized = normalizeOpenClawWorkspaceTempUploadError(
      new Error("network down")
    );
    expect(normalized.message).toBe(
      "Failed to communicate with OpenClaw /v1/workspace/tmp/upload: network down"
    );
  });
});
