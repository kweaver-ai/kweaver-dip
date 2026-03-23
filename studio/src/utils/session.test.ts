import { describe, expect, it } from "vitest";

import { parseSession } from "./session";

describe("parseSession", () => {
  it("parses user direct sessions", () => {
    expect(
      parseSession("agent:main:user:user-1:direct:chat-1")
    ).toEqual({
      agent: "main",
      userId: "user-1",
      chatId: "chat-1"
    });
  });

  it("parses the main session shape", () => {
    expect(parseSession("agent:main:main")).toEqual({
      agent: "main"
    });
  });

  it("parses private chat session variants and keeps the agent only", () => {
    expect(parseSession("agent:main:direct:peer-1")).toEqual({
      agent: "main"
    });
    expect(parseSession("agent:main:slack:direct:peer-1")).toEqual({
      agent: "main"
    });
    expect(parseSession("agent:main:slack:account-1:direct:peer-1")).toEqual({
      agent: "main"
    });
  });

  it("parses group, channel, and thread session variants", () => {
    expect(parseSession("agent:main:telegram:group:123")).toEqual({
      agent: "main"
    });
    expect(parseSession("agent:main:feishu:channel:456")).toEqual({
      agent: "main"
    });
    expect(
      parseSession("agent:main:telegram:group:123:thread:42")
    ).toEqual({
      agent: "main"
    });
  });

  it("parses subagent, cron, and acp session variants", () => {
    expect(parseSession("agent:main:subagent:test")).toEqual({
      agent: "main"
    });
    expect(parseSession("agent:main:subagent:test:nested")).toEqual({
      agent: "main"
    });
    expect(parseSession("agent:main:cron:job-1:run:run-1")).toEqual({
      agent: "main"
    });
    expect(parseSession("agent:main:acp:acp-1")).toEqual({
      agent: "main"
    });
  });

  it("parses the documented user session example", () => {
    expect(
      parseSession(
        "agent:main:user:2a664704-5e18-11e3-a957-dcd2fc061e41:direct:4d1905d7-1f7b-4f0d-b9bf-6b6b7a5b2f29"
      )
    ).toEqual({
      agent: "main",
      userId: "2a664704-5e18-11e3-a957-dcd2fc061e41",
      chatId: "4d1905d7-1f7b-4f0d-b9bf-6b6b7a5b2f29"
    });
  });

  it("rejects malformed session keys", () => {
    expect(() => parseSession("user:user-1:direct:chat-1")).toThrow(
      "Invalid session key"
    );
    expect(() => parseSession("agent")).toThrow("Invalid session key");
    expect(() => parseSession("agent:main:user:user-1:direct")).toThrow(
      "Invalid session key"
    );
  });
});
