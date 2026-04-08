import { describe, expect, it } from "vitest";

import { parseSession } from "./session";

describe("parseSession", () => {
  it("parses the main session shape", () => {
    expect(parseSession("agent:main:main")).toEqual({
      agent: "main",
      kind: "main",
      rest: "main"
    });
  });

  it("parses documented user direct sessions", () => {
    expect(
      parseSession("agent:main:user:user-1:direct:chat-1")
    ).toEqual({
      agent: "main",
      kind: "user-direct",
      rest: "user:user-1:direct:chat-1",
      userId: "user-1",
      chatId: "chat-1"
    });
    expect(
      parseSession(
        "agent:main:user:2a664704-5e18-11e3-a957-dcd2fc061e41:direct:4d1905d7-1f7b-4f0d-b9bf-6b6b7a5b2f29"
      )
    ).toEqual({
      agent: "main",
      kind: "user-direct",
      rest: "user:2a664704-5e18-11e3-a957-dcd2fc061e41:direct:4d1905d7-1f7b-4f0d-b9bf-6b6b7a5b2f29",
      userId: "2a664704-5e18-11e3-a957-dcd2fc061e41",
      chatId: "4d1905d7-1f7b-4f0d-b9bf-6b6b7a5b2f29"
    });
    expect(parseSession("user:user-1:direct:chat-1")).toEqual({
      kind: "user-direct",
      rest: "user:user-1:direct:chat-1",
      userId: "user-1",
      chatId: "chat-1"
    });
  });

  it("parses private chat session variants", () => {
    expect(parseSession("agent:main:direct:peer-1")).toEqual({
      agent: "main",
      kind: "direct",
      rest: "direct:peer-1",
      peerId: "peer-1"
    });
    expect(parseSession("agent:main:slack:direct:peer-1")).toEqual({
      agent: "main",
      kind: "direct",
      rest: "slack:direct:peer-1",
      channel: "slack",
      peerId: "peer-1"
    });
    expect(parseSession("agent:main:slack:account-1:direct:peer-1")).toEqual({
      agent: "main",
      kind: "direct",
      rest: "slack:account-1:direct:peer-1",
      channel: "slack",
      accountId: "account-1",
      peerId: "peer-1"
    });
    expect(parseSession("slack:account-1:direct:peer-1")).toEqual({
      kind: "direct",
      rest: "slack:account-1:direct:peer-1",
      channel: "slack",
      accountId: "account-1",
      peerId: "peer-1"
    });
  });

  it("parses group and channel session variants", () => {
    expect(parseSession("agent:main:telegram:group:123")).toEqual({
      agent: "main",
      kind: "group",
      rest: "telegram:group:123",
      channel: "telegram",
      peerId: "123"
    });
    expect(parseSession("agent:main:feishu:channel:456")).toEqual({
      agent: "main",
      kind: "channel",
      rest: "feishu:channel:456",
      channel: "feishu",
      peerId: "456"
    });
    expect(parseSession("telegram:group:123")).toEqual({
      kind: "group",
      rest: "telegram:group:123",
      channel: "telegram",
      peerId: "123"
    });
  });

  it("parses threaded group and channel sessions", () => {
    expect(
      parseSession("agent:main:telegram:group:123:thread:42")
    ).toEqual({
      agent: "main",
      kind: "group",
      rest: "telegram:group:123:thread:42",
      channel: "telegram",
      peerId: "123",
      threadId: "42"
    });
    expect(
      parseSession("agent:main:discord:channel:456:thread:99")
    ).toEqual({
      agent: "main",
      kind: "channel",
      rest: "discord:channel:456:thread:99",
      channel: "discord",
      peerId: "456",
      threadId: "99"
    });
  });

  it("parses subagent sessions", () => {
    expect(parseSession("agent:main:subagent:test")).toEqual({
      agent: "main",
      kind: "subagent",
      rest: "subagent:test",
      subagentId: "test",
      subagentPath: ["test"]
    });
    expect(parseSession("agent:main:subagent:test:nested")).toEqual({
      agent: "main",
      kind: "subagent",
      rest: "subagent:test:nested",
      subagentId: "test",
      subagentPath: ["test", "nested"]
    });
    expect(parseSession("subagent:test")).toEqual({
      kind: "subagent",
      rest: "subagent:test",
      subagentId: "test",
      subagentPath: ["test"]
    });
  });

  it("parses cron and acp sessions", () => {
    expect(parseSession("agent:main:cron:job-1:run:run-1")).toEqual({
      agent: "main",
      kind: "cron",
      rest: "cron:job-1:run:run-1",
      jobId: "job-1",
      runId: "run-1"
    });
    expect(parseSession("agent:main:acp:acp-1")).toEqual({
      agent: "main",
      kind: "acp",
      rest: "acp:acp-1",
      acpId: "acp-1"
    });
    expect(parseSession("cron:job-1:run:run-1")).toEqual({
      kind: "cron",
      rest: "cron:job-1:run:run-1",
      jobId: "job-1",
      runId: "run-1"
    });
  });

  it("rejects malformed session keys", () => {
    expect(() => parseSession("agent")).toThrow("Invalid session key");
    expect(() => parseSession("agent:main")).toThrow("Invalid session key");
    expect(() => parseSession("agent:main:user:user-1:direct")).toThrow(
      "Invalid session key"
    );
    expect(() => parseSession("user:user-1:direct")).toThrow("Invalid session key");
    expect(() => parseSession("agent:main:direct")).toThrow("Invalid session key");
    expect(() => parseSession("agent:main:telegram:thread:42")).toThrow(
      "Invalid session key"
    );
    expect(() => parseSession("agent:main:subagent")).toThrow("Invalid session key");
    expect(() => parseSession("agent:main:cron:job-1:run")).toThrow(
      "Invalid session key"
    );
    expect(() => parseSession("agent:main:acp")).toThrow("Invalid session key");
  });
});
