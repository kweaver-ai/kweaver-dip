import { describe, expect, it, vi } from "vitest";

import {
  createChatHistoryRequest,
  OpenClawSessionsGatewayAdapter,
  createSessionsDeleteRequest,
  createSessionsGetRequest,
  createSessionsListRequest,
  createSessionsPreviewRequest
} from "./openclaw-sessions-adapter";

describe("createSessionsListRequest", () => {
  it("builds the sessions.list JSON RPC frame", () => {
    expect(
      createSessionsListRequest("req-1", {
        limit: 20,
        includeDerivedTitles: true,
        includeLastMessage: true
      })
    ).toEqual({
      type: "req",
      id: "req-1",
      method: "sessions.list",
      params: {
        limit: 20,
        includeDerivedTitles: true,
        includeLastMessage: true
      }
    });
  });
});

describe("createSessionsGetRequest", () => {
  it("builds the sessions.get JSON RPC frame", () => {
    expect(
      createSessionsGetRequest("req-2", {
        key: "session_key_here",
        limit: 100
      })
    ).toEqual({
      type: "req",
      id: "req-2",
      method: "sessions.get",
      params: {
        key: "session_key_here",
        limit: 100
      }
    });
  });
});

describe("createChatHistoryRequest", () => {
  it("builds the chat.history JSON RPC frame", () => {
    expect(
      createChatHistoryRequest("req-chat-1", {
        sessionKey: "session_key_here",
        limit: 100
      })
    ).toEqual({
      type: "req",
      id: "req-chat-1",
      method: "chat.history",
      params: {
        sessionKey: "session_key_here",
        limit: 100
      }
    });
  });
});

describe("createSessionsDeleteRequest", () => {
  it("builds the sessions.delete JSON RPC frame", () => {
    expect(
      createSessionsDeleteRequest("req-4", {
        key: "session_key_here",
        deleteTranscript: true,
        emitLifecycleHooks: false
      })
    ).toEqual({
      type: "req",
      id: "req-4",
      method: "sessions.delete",
      params: {
        key: "session_key_here",
        deleteTranscript: true,
        emitLifecycleHooks: false
      }
    });
  });
});

describe("createSessionsPreviewRequest", () => {
  it("builds the sessions.preview JSON RPC frame", () => {
    expect(
      createSessionsPreviewRequest("req-3", {
        keys: ["key1", "key2"],
        limit: 5
      })
    ).toEqual({
      type: "req",
      id: "req-3",
      method: "sessions.preview",
      params: {
        keys: ["key1", "key2"],
        limit: 5
      }
    });
  });
});

describe("OpenClawSessionsGatewayAdapter", () => {
  it("delegates sessions.list to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        sessions: [
          {
            key: "key1"
          }
        ]
      })
    };
    const adapter = new OpenClawSessionsGatewayAdapter(gatewayPort);

    await expect(
      adapter.listSessions({
        limit: 20,
        includeDerivedTitles: true,
        includeLastMessage: true
      })
    ).resolves.toEqual({
      sessions: [
        {
          key: "key1"
        }
      ]
    });
  });

  it("delegates sessions.get to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        key: "key1",
        messages: []
      })
    };
    const adapter = new OpenClawSessionsGatewayAdapter(gatewayPort);

    await expect(
      adapter.getSession({
        key: "key1",
        limit: 100
      })
    ).resolves.toEqual({
      key: "key1",
      messages: []
    });
  });

  it("delegates chat.history to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        sessionKey: "key1",
        sessionId: "runtime-1",
        messages: []
      })
    };
    const adapter = new OpenClawSessionsGatewayAdapter(gatewayPort);

    await expect(
      adapter.getChatMessages({
        sessionKey: "key1",
        limit: 100
      })
    ).resolves.toEqual({
      sessionKey: "key1",
      sessionId: "runtime-1",
      messages: []
    });
  });

  it("delegates sessions.preview to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        items: [
          {
            key: "key1",
            messages: []
          }
        ]
      })
    };
    const adapter = new OpenClawSessionsGatewayAdapter(gatewayPort);

    await expect(
      adapter.previewSessions({
        keys: ["key1", "key2"],
        limit: 5
      })
    ).resolves.toEqual({
      items: [
        {
          key: "key1",
          messages: []
        }
      ]
    });
  });

  it("delegates sessions.delete to the gateway port", async () => {
    const gatewayPort = {
      invoke: vi.fn().mockResolvedValue({
        ok: true,
        key: "key1",
        deleted: true
      })
    };
    const adapter = new OpenClawSessionsGatewayAdapter(gatewayPort);

    await expect(
      adapter.deleteSession({
        key: "key1",
        deleteTranscript: true
      })
    ).resolves.toEqual({
      ok: true,
      key: "key1",
      deleted: true
    });
  });
});
