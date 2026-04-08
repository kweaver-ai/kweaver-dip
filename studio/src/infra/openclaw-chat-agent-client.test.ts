import { EventEmitter } from "node:events";

import { describe, expect, it } from "vitest";

import {
  DefaultOpenClawChatAgentClient,
  createChatSendRequest,
  createFunctionCallItem,
  createFunctionCallItemId,
  createOutputItemId,
  createOutputMessageItem,
  createSessionPatchParams,
  createSessionsPatchRequest,
  createResponseResource,
  enqueueSseEvent,
  isTextAgentEventFrame,
  isToolAgentEventFrame,
  mergeOutputItems,
  readAssistantText,
  readChatEventPayload,
  readChatSendAckPayload,
  readTextAgentEventPayload,
  readToolAgentEventPayload
} from "./openclaw-chat-agent-client";
import {
  loadDeviceIdentityFromAssets,
  type OpenClawWebSocket
} from "./openclaw-gateway-client";

/**
 * Minimal fake WebSocket used for chat agent protocol tests.
 */
class FakeWebSocket extends EventEmitter implements OpenClawWebSocket {
  /**
   * Captures outbound messages.
   */
  public readonly sentMessages: string[] = [];

  /**
   * Indicates whether the socket has been closed.
   */
  public closed = false;

  /**
   * Sends one serialized frame.
   *
   * @param data The serialized payload.
   */
  public send(data: string): void {
    this.sentMessages.push(data);
  }

  /**
   * Closes the fake socket.
   */
  public close(): void {
    this.closed = true;
  }
}

describe("chat agent helpers", () => {
  it("creates chat agent request frames", () => {
    expect(
      createSessionsPatchRequest(
        "req-patch-1",
        createSessionPatchParams("main")
      )
    ).toEqual({
      type: "req",
      id: "req-patch-1",
      method: "sessions.patch",
      params: {
        key: "main",
        verboseLevel: "full"
      }
    });
    expect(
      createChatSendRequest("req-1", {
        sessionKey: "main",
        message: "hello",
        idempotencyKey: "run-1"
      })
    ).toEqual({
      type: "req",
      id: "req-1",
      method: "chat.send",
      params: {
        sessionKey: "main",
        message: "hello",
        idempotencyKey: "run-1"
      }
    });
  });

  it("normalizes acknowledgement and chat event payloads", () => {
    expect(
      readChatSendAckPayload({
        type: "res",
        id: "req-1",
        ok: true,
        payload: {
          runId: "run-1",
          status: "started"
        }
      })
    ).toEqual({
      runId: "run-1",
      status: "started"
    });
    expect(
      readChatEventPayload({
        type: "event",
        event: "chat",
        payload: {
          runId: "run-1",
          sessionKey: "main",
          seq: 1,
          state: "delta",
          message: {
            role: "assistant",
            content: [
              {
                type: "text",
                text: "hi"
              }
            ]
          }
        }
      })
    ).toMatchObject({
      runId: "run-1",
      sessionKey: "main",
      seq: 1,
      state: "delta"
    });
    expect(
      isToolAgentEventFrame({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          seq: 2,
          stream: "tool",
          ts: 1710000000100,
          data: {
            phase: "start",
            name: "web_search",
            toolCallId: "tool-1"
          }
        }
      })
    ).toBe(true);
    expect(
      readToolAgentEventPayload({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          seq: 2,
          stream: "tool",
          ts: 1710000000100,
          data: {
            phase: "result",
            name: "web_search",
            toolCallId: "tool-1",
            result: {
              content: [
                {
                  type: "text",
                  text: "搜索结果内容"
                }
              ]
            }
          }
        }
      })
    ).toMatchObject({
      runId: "run-1",
      stream: "tool",
      data: {
        phase: "result",
        name: "web_search",
        toolCallId: "tool-1"
      }
    });
    expect(
      readToolAgentEventPayload({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          seq: 3,
          stream: "tool",
          ts: 1710000000150,
          data: {
            phase: "update",
            name: "web_search",
            toolCallId: "tool-1",
            partialResult: {
              content: [
                {
                  type: "text",
                  text: "部分结果"
                }
              ]
            }
          }
        }
      })
    ).toMatchObject({
      runId: "run-1",
      stream: "tool",
      data: {
        phase: "update",
        name: "web_search",
        toolCallId: "tool-1"
      }
    });
    expect(
      isTextAgentEventFrame({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          seq: 4,
          stream: "assistant",
          ts: 1710000000300,
          data: {
            text: "Hello",
            delta: "lo"
          }
        }
      })
    ).toBe(true);
    expect(
      readTextAgentEventPayload({
        type: "event",
        event: "agent",
        payload: {
          runId: "run-1",
          seq: 4,
          stream: "assistant",
          ts: 1710000000300,
          data: {
            text: "Hello",
            delta: "lo"
          }
        }
      })
    ).toMatchObject({
      runId: "run-1",
      stream: "assistant",
      data: {
        text: "Hello",
        delta: "lo"
      }
    });
  });

  it("builds OpenResponse-style SSE payloads", () => {
    expect(readAssistantText({
      role: "assistant",
      content: [
        {
          type: "text",
          text: "Hel"
        },
        {
          type: "text",
          text: "lo"
        }
      ]
    })).toBe("Hello");
    expect(createOutputItemId("run-1")).toBe("msg_run-1");
    expect(createFunctionCallItemId("tool-1")).toBe("fc_tool-1");
    expect(createOutputMessageItem("msg_run-1", "hello", "completed")).toEqual({
      type: "message",
      id: "msg_run-1",
      role: "assistant",
      status: "completed",
      content: [
        {
          type: "output_text",
          text: "hello"
        }
      ]
    });
    expect(
      createFunctionCallItem("fc_tool-1", "tool-1", "web_search", "completed", {
        result: {
          ok: true
        }
      })
    ).toEqual({
      type: "function_call",
      id: "fc_tool-1",
      call_id: "tool-1",
      name: "web_search",
      arguments: "",
      status: "completed",
      result: {
        ok: true
      }
    });
    expect(
      createResponseResource({
        runId: "run-1",
        agentId: "agent-1",
        createdAtMs: 1_710_000_000_500,
        status: "completed",
        outputItems: [
          createOutputMessageItem("msg_run-1", "hello", "completed")
        ]
      })
    ).toMatchObject({
      id: "run-1",
      status: "completed",
      model: "agent:agent-1"
    });
    expect(
      mergeOutputItems(
        [
          createFunctionCallItem("fc_tool-1", "tool-1", "web_search", "completed")
        ],
        "hello",
        "run-1"
      )
    ).toHaveLength(2);

    const events: string[] = [];

    enqueueSseEvent((value) => {
      events.push(value);
    }, {
      type: "response.created",
      response: {
        id: "run-1"
      }
    });

    expect(events[0]).toContain("event: response.created");
  });
});

describe("DefaultOpenClawChatAgentClient", () => {
  it("maps chat frames to OpenResponse SSE events", async () => {
    const socket = new FakeWebSocket();
    const client = new DefaultOpenClawChatAgentClient(
      {
        url: "ws://127.0.0.1:18789",
        token: "secret-token",
        timeoutMs: 1_000,
        deviceIdentity: loadDeviceIdentityFromAssets(),
        now: () => 1_710_000_000_500
      },
      () => socket
    );

    const pending = client.createResponseStream(
      {
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        message: "hello",
        idempotencyKey: "run-1"
      },
      "agent-1"
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123"
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {}
    }));

    const patchFrame = JSON.parse(socket.sentMessages[1] ?? "{}") as { id: string };

    expect(patchFrame.method).toBe("sessions.patch");
    expect(patchFrame.params).toEqual({
      key: "agent:agent-1:user:user-1:direct:chat-1",
      verboseLevel: "full"
    });

    socket.emit("message", JSON.stringify({
      type: "res",
      id: patchFrame.id,
      ok: true,
      payload: {
        ok: true
      }
    }));

    const chatSendFrame = JSON.parse(socket.sentMessages[2] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: chatSendFrame.id,
      ok: true,
      payload: {
        runId: "run-1",
        status: "started"
      }
    }));

    const result = await pending;
    const reader = result.body.getReader();

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "agent",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 1,
        stream: "tool",
        ts: 1710000000100,
        data: {
          phase: "start",
          name: "web_search",
          toolCallId: "tool-1"
        }
      }
    }));

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "agent",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 2,
        stream: "tool",
        ts: 1710000000150,
        data: {
          phase: "update",
          name: "web_search",
          toolCallId: "tool-1",
          partialResult: {
            content: [
              {
                type: "text",
                text: "部分结果"
              }
            ]
          }
        }
      }
    }));

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "agent",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 3,
        stream: "tool",
        ts: 1710000000200,
        data: {
          phase: "result",
          name: "web_search",
          toolCallId: "tool-1",
          result: {
            content: [
              {
                type: "text",
                text: "搜索结果内容"
              }
            ]
          }
        }
      }
    }));

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "chat",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 1,
        state: "delta",
        message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Hel"
            }
          ],
          timestamp: 1710000000000
        }
      }
    }));

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "chat",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 2,
        state: "final",
        message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Hello"
            }
          ],
          timestamp: 1710000000500
        }
      }
    }));

    let body = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      body += new TextDecoder().decode(value);
    }

    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain("event: response.created");
    expect(body).toContain("\"type\":\"function_call\"");
    expect(body).toContain("\"tool-1\"");
    expect(body).toContain("\"partial\":true");
    expect(body).toContain("\"partialResult\"");
    expect(body).toContain("event: response.output_text.delta");
    expect(body).toContain("event: response.completed");
    expect(body).toContain("\"status\":\"completed\"");
  });

  it("maps assistant agent text frames to OpenResponse SSE events", async () => {
    const socket = new FakeWebSocket();
    const client = new DefaultOpenClawChatAgentClient(
      {
        url: "ws://127.0.0.1:18789",
        token: "secret-token",
        timeoutMs: 1_000,
        deviceIdentity: loadDeviceIdentityFromAssets(),
        now: () => 1_710_000_000_500
      },
      () => socket
    );

    const pending = client.createResponseStream(
      {
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        message: "hello",
        idempotencyKey: "run-1"
      },
      "agent-1"
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123"
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {}
    }));

    const patchFrame = JSON.parse(socket.sentMessages[1] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: patchFrame.id,
      ok: true,
      payload: {
        ok: true
      }
    }));

    const chatSendFrame = JSON.parse(socket.sentMessages[2] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: chatSendFrame.id,
      ok: true,
      payload: {
        runId: "run-1",
        status: "started"
      }
    }));

    const result = await pending;
    const reader = result.body.getReader();

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "agent",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 1,
        stream: "assistant",
        ts: 1710000000100,
        data: {
          text: "Hel",
          delta: "Hel"
        }
      }
    }));

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "agent",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 2,
        stream: "assistant",
        ts: 1710000000200,
        data: {
          text: "Hello",
          delta: "lo"
        }
      }
    }));

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "chat",
      payload: {
        runId: "run-1",
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        seq: 3,
        state: "final",
        message: {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "ignored final"
            }
          ],
          timestamp: 1710000000300
        }
      }
    }));

    let body = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      body += new TextDecoder().decode(value);
    }

    expect(body).toContain("event: response.output_text.delta");
    expect(body).toContain("\"delta\":\"Hel\"");
    expect(body).toContain("\"delta\":\"lo\"");
    expect(body).toContain("event: response.completed");
    expect(body).toContain("\"text\":\"Hello\"");
    expect(body).not.toContain("ignored final");
  });

  it("fails before streaming when chat.send acknowledgement is invalid", async () => {
    const socket = new FakeWebSocket();
    const client = new DefaultOpenClawChatAgentClient(
      {
        url: "ws://127.0.0.1:18789",
        timeoutMs: 1_000,
        deviceIdentity: loadDeviceIdentityFromAssets()
      },
      () => socket
    );

    const pending = client.createResponseStream(
      {
        sessionKey: "agent:agent-1:user:user-1:direct:chat-1",
        message: "hello"
      },
      "agent-1"
    );

    socket.emit("message", JSON.stringify({
      type: "event",
      event: "connect.challenge",
      payload: {
        nonce: "abc123"
      }
    }));

    const connectFrame = JSON.parse(socket.sentMessages[0] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: connectFrame.id,
      ok: true,
      payload: {}
    }));

    const patchFrame = JSON.parse(socket.sentMessages[1] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: patchFrame.id,
      ok: true,
      payload: {
        ok: true
      }
    }));

    const chatSendFrame = JSON.parse(socket.sentMessages[2] ?? "{}") as { id: string };

    socket.emit("message", JSON.stringify({
      type: "res",
      id: chatSendFrame.id,
      ok: false,
      error: {
        code: "MODEL_UNAVAILABLE",
        message: "model unavailable"
      }
    }));

    await expect(pending).rejects.toMatchObject({
      statusCode: 502,
      message: "model unavailable"
    });
  });
});
