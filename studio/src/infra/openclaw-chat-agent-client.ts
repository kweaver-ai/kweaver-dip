import {
  randomUUID
} from "node:crypto";

import { HttpError } from "../errors/http-error";
import {
  asTransportError,
  createConnectRequest,
  createDefaultWebSocket,
  createGatewayError,
  isConnectChallenge,
  isGatewayResponse,
  loadDeviceIdentityFromAssets,
  parseGatewayFrame,
  type OpenClawDeviceIdentity,
  type OpenClawEventFrame,
  type OpenClawResponseFrame,
  type OpenClawWebSocket,
  type OpenClawWebSocketFactory
} from "./openclaw-gateway-client";
import { ChatAgentAttachment } from "../types/chat-agent";

const DEFAULT_TIMEOUT_MS = 5_000;
const SSE_HEADERS = new Headers({
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive"
});

/**
 * Payload sent to OpenClaw `chat.send`.
 */
export interface OpenClawChatSendParams {
  /**
   * Target OpenClaw session key.
   */
  sessionKey: string;

  /**
   * User message text.
   */
  message: string;

  /**
   * Optional idempotency key.
   */
  idempotencyKey?: string;

  /**
   * Attachments sent by the client.
   */
  attachments?: ChatAgentAttachment[];
}

/**
 * Payload sent to OpenClaw `sessions.patch`.
 */
export interface OpenClawSessionPatchParams {
  /**
   * Target OpenClaw session key.
   */
  key: string;

  /**
   * Session-level verbosity used to expose tool events.
   */
  verboseLevel: "full";
}

/**
 * Runtime options required to open a dedicated chat agent socket.
 */
export interface OpenClawChatAgentClientOptions {
  /**
   * OpenClaw gateway WebSocket URL.
   */
  url: string;

  /**
   * Optional bearer token used during connect.
   */
  token?: string;

  /**
   * Handshake and ack timeout in milliseconds.
   */
  timeoutMs?: number;

  /**
   * Preloaded device identity used during connect.
   */
  deviceIdentity?: OpenClawDeviceIdentity;

  /**
   * Supplies the current time in milliseconds.
   */
  now?: () => number;
}

/**
 * Streaming response returned to the HTTP route layer.
 */
export interface OpenClawChatAgentStreamResult {
  /**
   * Downstream HTTP status code.
   */
  status: number;

  /**
   * Downstream SSE headers.
   */
  headers: Headers;

  /**
   * Downstream SSE body.
   */
  body: ReadableStream<Uint8Array>;
}

/**
 * Client capable of bridging OpenClaw `chat.send` frames into SSE.
 */
export interface OpenClawChatAgentClient {
  /**
   * Opens a dedicated chat agent stream and returns an SSE-compatible stream.
   *
   * @param request The normalized chat request sent to OpenClaw.
   * @param agentId The target agent id used to populate the OpenResponse model field.
   * @param signal Optional abort signal tied to the downstream HTTP connection.
   * @returns The downstream SSE result.
   */
  createResponseStream(
    request: OpenClawChatSendParams,
    agentId: string,
    signal?: AbortSignal
  ): Promise<OpenClawChatAgentStreamResult>;
}

/**
 * Acknowledgement payload returned by `chat.send`.
 */
export interface OpenClawChatSendAckPayload {
  /**
   * Stable run id.
   */
  runId: string;

  /**
   * Initial run state.
   */
  status: "started" | "in_flight" | "ok" | "error";
}

/**
 * Assistant message content block emitted by OpenClaw.
 */
export interface OpenClawChatTextContentBlock {
  /**
   * Content block type.
   */
  type: string;

  /**
   * Text content when present.
   */
  text?: string;
}

/**
 * Assistant message emitted by OpenClaw chat events.
 */
export interface OpenClawChatAssistantMessage {
  /**
   * Message role.
   */
  role: "assistant";

  /**
   * Assistant content blocks.
   */
  content?: OpenClawChatTextContentBlock[];

  /**
   * Event timestamp in milliseconds.
   */
  timestamp?: number;
}

/**
 * Streaming chat payload emitted by OpenClaw.
 */
export interface OpenClawChatEventPayload {
  /**
   * Stable run id.
   */
  runId: string;

  /**
   * Session key carried by the event.
   */
  sessionKey: string;

  /**
   * Event sequence number.
   */
  seq: number;

  /**
   * Stream state.
   */
  state: "delta" | "final" | "error" | "aborted";

  /**
   * Assistant message payload when present.
   */
  message?: OpenClawChatAssistantMessage;

  /**
   * Terminal stop reason.
   */
  stopReason?: string;

  /**
   * Error message emitted by OpenClaw.
   */
  errorMessage?: string;
}

/**
 * Tool event phase emitted by OpenClaw `agent` frames.
 */
export type OpenClawToolPhase = "start" | "update" | "result" | "error" | "progress";

/**
 * Tool event payload emitted by OpenClaw `agent` frames.
 */
export interface OpenClawToolAgentEventPayload {
  /**
   * Stable run id.
   */
  runId: string;

  /**
   * Session key carried by the event when present.
   */
  sessionKey?: string;

  /**
   * Event sequence number.
   */
  seq: number;

  /**
   * Stream discriminator.
   */
  stream: "tool";

  /**
   * Event timestamp in milliseconds.
   */
  ts: number;

  /**
   * Tool event data.
   */
  data: {
    /**
     * Tool phase.
     */
    phase: OpenClawToolPhase;

    /**
     * Tool name when present.
     */
    name?: string;

    /**
     * Stable tool call id when present.
     */
    toolCallId?: string;

    /**
     * Tool result payload.
     */
    result?: unknown;

    /**
     * Partial tool result payload.
     */
    partialResult?: unknown;

    /**
     * Tool error payload.
     */
    error?: unknown;
  };
}

/**
 * Text event payload emitted by OpenClaw `agent` frames.
 */
export interface OpenClawTextAgentEventPayload {
  /**
   * Stable run id.
   */
  runId: string;

  /**
   * Session key carried by the event when present.
   */
  sessionKey?: string;

  /**
   * Event sequence number.
   */
  seq: number;

  /**
   * Stream discriminator.
   */
  stream: "assistant";

  /**
   * Event timestamp in milliseconds.
   */
  ts: number;

  /**
   * Assistant text event data.
   */
  data: {
    /**
     * Full text snapshot carried by the event.
     */
    text: string;

    /**
     * Optional incremental text fragment.
     */
    delta?: string;
  };
}

/**
 * Default dedicated chat agent client backed by one WebSocket per request.
 */
export class DefaultOpenClawChatAgentClient implements OpenClawChatAgentClient {
  private readonly timeoutMs: number;
  private readonly deviceIdentity: OpenClawDeviceIdentity;
  private readonly now: () => number;

  /**
   * Creates the chat agent client.
   *
   * @param options Static OpenClaw connection options.
   * @param createWebSocket Optional WebSocket factory used by tests.
   */
  public constructor(
    private readonly options: OpenClawChatAgentClientOptions,
    private readonly createWebSocket: OpenClawWebSocketFactory = createDefaultWebSocket
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.deviceIdentity = options.deviceIdentity ?? loadDeviceIdentityFromAssets();
    this.now = options.now ?? Date.now;
  }

  /**
   * Opens the upstream chat agent stream and exposes it as an SSE stream.
   *
   * @param request The normalized chat request sent to OpenClaw.
   * @param agentId The target agent id used to populate the response model field.
   * @param signal Optional abort signal tied to the downstream HTTP connection.
   * @returns The downstream SSE result.
   */
  public async createResponseStream(
    request: OpenClawChatSendParams,
    agentId: string,
    signal?: AbortSignal
  ): Promise<OpenClawChatAgentStreamResult> {
    return new Promise<OpenClawChatAgentStreamResult>((resolve, reject) => {
      const socket = this.createWebSocket(this.options.url);
      const encoder = new TextEncoder();
      const queue: Uint8Array[] = [];
      let controller:
        | ReadableStreamDefaultController<Uint8Array>
        | undefined;
      let connectRequestId: string | undefined = randomUUID();
      let sessionPatchRequestId: string | undefined = randomUUID();
      const chatRequestId = randomUUID();
      let ackPayload: OpenClawChatSendAckPayload | undefined;
      let terminal = false;
      let streamResolved = false;
      let messageStarted = false;
      let finalText = "";
      let finalTimestampMs = this.now();
      let textEventSource: "chat" | "assistant" | undefined;
      const outputItems: Record<string, unknown>[] = [];
      const outputIndexByItemId = new Map<string, number>();

      const stream = new ReadableStream<Uint8Array>({
        start(streamController) {
          controller = streamController;

          for (const chunk of queue) {
            streamController.enqueue(chunk);
          }

          queue.length = 0;
        },
        cancel() {
          socket.close();
        }
      });

      const cleanupAbortListener = attachAbortSignal(signal, () => {
        if (!terminal) {
          terminal = true;
          socket.close();
          if (!streamResolved) {
            reject(new HttpError(499, "Chat agent request was aborted"));
          } else {
            controller?.close();
          }
        }
      });

      const enqueue = (value: string): void => {
        const chunk = encoder.encode(value);

        if (controller === undefined) {
          queue.push(chunk);
          return;
        }

        controller.enqueue(chunk);
      };

      const completeStream = (): void => {
        if (terminal) {
          return;
        }

        terminal = true;
        cleanupAbortListener();
        controller?.close();
        socket.close();
      };

      const failBeforeResolve = (error: HttpError): void => {
        if (terminal) {
          return;
        }

        terminal = true;
        cleanupAbortListener();
        socket.close();
        reject(error);
      };

      const failAfterResolve = (message: string): void => {
        if (terminal || ackPayload === undefined) {
          return;
        }

        const response = createResponseResource({
          runId: ackPayload.runId,
          agentId,
          createdAtMs: finalTimestampMs,
          status: "failed",
          outputItems: mergeOutputItems(
            outputItems,
            finalText,
            ackPayload.runId
          ),
          error: {
            code: "openclaw_error",
            message
          }
        });

        enqueueSseEvent(enqueue, {
          type: "response.failed",
          response
        });

        completeStream();
      };

      const resolveStream = (): void => {
        if (streamResolved || ackPayload === undefined) {
          return;
        }

        streamResolved = true;
        resolve({
          status: 200,
          headers: new Headers(SSE_HEADERS),
          body: stream
        });

        const response = createResponseResource({
          runId: ackPayload.runId,
          agentId,
          createdAtMs: this.now(),
          status: "in_progress",
          outputItems
        });

        enqueueSseEvent(enqueue, {
          type: "response.created",
          response
        });
        enqueueSseEvent(enqueue, {
          type: "response.in_progress",
          response
        });
      };

      const ensureMessageStarted = (): {
        itemId: string;
        outputIndex: number;
      } => {
        if (ackPayload === undefined) {
          throw new HttpError(502, "OpenClaw chat agent started without an acknowledgement");
        }

        const itemId = createOutputItemId(ackPayload.runId);
        const existingIndex = outputIndexByItemId.get(itemId);

        if (existingIndex !== undefined) {
          return {
            itemId,
            outputIndex: existingIndex
          };
        }

        if (!messageStarted) {
          messageStarted = true;
          const outputIndex = outputItems.length;
          const item = createOutputMessageItem(itemId, "");

          outputItems.push(item);
          outputIndexByItemId.set(itemId, outputIndex);
          enqueueSseEvent(enqueue, {
            type: "response.output_item.added",
            output_index: outputIndex,
            item
          });
          enqueueSseEvent(enqueue, {
            type: "response.content_part.added",
            item_id: itemId,
            output_index: outputIndex,
            content_index: 0,
            part: {
              type: "output_text",
              text: ""
            }
          });

          return {
            itemId,
            outputIndex
          };
        }

        throw new HttpError(502, "OpenClaw chat message item could not be initialized");
      };

      const ensureToolStarted = (payload: OpenClawToolAgentEventPayload): {
        itemId: string;
        outputIndex: number;
      } => {
        const toolCallId = payload.data.toolCallId?.trim();
        const toolName = payload.data.name?.trim();

        if (toolCallId === undefined || toolCallId === "") {
          throw new HttpError(502, "OpenClaw tool event is missing toolCallId");
        }

        if (toolName === undefined || toolName === "") {
          throw new HttpError(502, "OpenClaw tool event is missing name");
        }

        const itemId = createFunctionCallItemId(toolCallId);
        const existingIndex = outputIndexByItemId.get(itemId);

        if (existingIndex !== undefined) {
          return {
            itemId,
            outputIndex: existingIndex
          };
        }

        const item = createFunctionCallItem(itemId, toolCallId, toolName);
        const outputIndex = outputItems.length;

        outputItems.push(item);
        outputIndexByItemId.set(itemId, outputIndex);
        enqueueSseEvent(enqueue, {
          type: "response.output_item.added",
          output_index: outputIndex,
          item
        });

        return {
          itemId,
          outputIndex
        };
      };

      socket.on("message", (rawMessage: unknown) => {
        if (terminal) {
          return;
        }

        try {
          const frame = parseGatewayFrame(rawMessage);

          if (isConnectChallenge(frame)) {
            const requestFrame = createConnectRequest(
              connectRequestId ?? randomUUID(),
              frame,
              this.options.token,
              this.deviceIdentity,
              this.now
            );
            socket.send(JSON.stringify(requestFrame));
            return;
          }

          if (
            connectRequestId !== undefined &&
            isGatewayResponse(frame, connectRequestId)
          ) {
            if (frame.ok !== true) {
              failBeforeResolve(createGatewayError(frame, "OpenClaw connect failed"));
              return;
            }

            connectRequestId = undefined;
            socket.send(
              JSON.stringify(
                createSessionsPatchRequest(
                  sessionPatchRequestId,
                  createSessionPatchParams(request.sessionKey)
                )
              )
            );
            return;
          }

          if (
            sessionPatchRequestId !== undefined &&
            isGatewayResponse(frame, sessionPatchRequestId)
          ) {
            if (frame.ok !== true) {
              failBeforeResolve(createGatewayError(frame, "OpenClaw sessions.patch failed"));
              return;
            }

            sessionPatchRequestId = undefined;
            socket.send(JSON.stringify(createChatSendRequest(chatRequestId, request)));
            return;
          }

          if (isGatewayResponse(frame, chatRequestId)) {
            if (frame.ok !== true) {
              failBeforeResolve(createGatewayError(frame, "OpenClaw chat.send failed"));
              return;
            }

            ackPayload = readChatSendAckPayload(frame);
            resolveStream();
            return;
          }

          if (isChatEventFrame(frame)) {
            if (ackPayload === undefined) {
              return;
            }

            const payload = readChatEventPayload(frame);

            if (payload.runId !== ackPayload.runId) {
              return;
            }

            finalTimestampMs = payload.message?.timestamp ?? this.now();

            if (payload.state === "delta") {
              if (textEventSource === "assistant") {
                return;
              }

              textEventSource = "chat";

              const deltaText = readAssistantText(payload.message);

              if (deltaText.length === 0) {
                return;
              }

              finalText += deltaText;

              const { itemId, outputIndex } = ensureMessageStarted();

              enqueueSseEvent(enqueue, {
                type: "response.output_text.delta",
                item_id: itemId,
                output_index: outputIndex,
                content_index: 0,
                delta: deltaText
              });
              return;
            }

            if (payload.state === "error") {
              failAfterResolve(payload.errorMessage ?? "OpenClaw chat agent failed");
              return;
            }

            if (textEventSource !== "assistant") {
              textEventSource = "chat";
            }

            const terminalText = readAssistantText(payload.message);

            if (textEventSource !== "assistant" && terminalText.length > 0) {
              finalText = terminalText;
            }

            const { itemId, outputIndex } = ensureMessageStarted();
            const completedItem = createOutputMessageItem(itemId, finalText, "completed");

            outputItems[outputIndex] = completedItem;

            enqueueSseEvent(enqueue, {
              type: "response.output_text.done",
              item_id: itemId,
              output_index: outputIndex,
              content_index: 0,
              text: finalText
            });
            enqueueSseEvent(enqueue, {
              type: "response.content_part.done",
              item_id: itemId,
              output_index: outputIndex,
              content_index: 0,
              part: {
                type: "output_text",
                text: finalText
              }
            });
            enqueueSseEvent(enqueue, {
              type: "response.output_item.done",
              output_index: outputIndex,
              item: completedItem
            });
            enqueueSseEvent(enqueue, {
              type: "response.completed",
              response: createResponseResource({
                runId: ackPayload.runId,
                agentId,
                createdAtMs: finalTimestampMs,
                status: payload.state === "aborted" ? "cancelled" : "completed",
                outputItems
              })
            });

            completeStream();
            return;
          }

          if (isTextAgentEventFrame(frame)) {
            if (ackPayload === undefined) {
              return;
            }

            const payload = readTextAgentEventPayload(frame);

            if (payload.runId !== ackPayload.runId) {
              return;
            }

            if (textEventSource === "chat") {
              return;
            }

            textEventSource = "assistant";
            finalTimestampMs = payload.ts;

            const nextText = payload.data.text;
            const deltaText = payload.data.delta ?? nextText;

            if (deltaText.length > 0) {
              finalText = nextText;

              const { itemId, outputIndex } = ensureMessageStarted();

              enqueueSseEvent(enqueue, {
                type: "response.output_text.delta",
                item_id: itemId,
                output_index: outputIndex,
                content_index: 0,
                delta: deltaText
              });
            } else if (nextText.length > 0) {
              finalText = nextText;
            }

            return;
          }

          if (isToolAgentEventFrame(frame)) {
            if (ackPayload === undefined) {
              return;
            }

            const payload = readToolAgentEventPayload(frame);

            if (payload.runId !== ackPayload.runId) {
              return;
            }

            finalTimestampMs = payload.ts;

            if (payload.data.phase === "progress") {
              return;
            }

            const { itemId, outputIndex } = ensureToolStarted(payload);

            if (payload.data.phase === "start") {
              return;
            }

            if (payload.data.phase === "update") {
              const toolCallId = payload.data.toolCallId ?? itemId;
              const toolName = payload.data.name ?? "tool";
              const updatedItem = createFunctionCallItem(
                itemId,
                toolCallId,
                toolName,
                "in_progress",
                {
                  partial: true,
                  partialResult: payload.data.partialResult
                }
              );

              outputItems[outputIndex] = updatedItem;
              enqueueSseEvent(enqueue, {
                type: "response.output_item.done",
                output_index: outputIndex,
                item: updatedItem
              });
              return;
            }

            const toolCallId = payload.data.toolCallId ?? itemId;
            const toolName = payload.data.name ?? "tool";
            const completedItem = createFunctionCallItem(
              itemId,
              toolCallId,
              toolName,
              "completed",
              payload.data.phase === "result"
                ? { result: payload.data.result }
                : { error: payload.data.error }
            );

            outputItems[outputIndex] = completedItem;
            enqueueSseEvent(enqueue, {
              type: "response.output_item.done",
              output_index: outputIndex,
              item: completedItem
            });
          }
        } catch (error) {
          const normalizedError = asTransportError(error);

          if (!streamResolved) {
            failBeforeResolve(normalizedError);
            return;
          }

          failAfterResolve(normalizedError.message);
        }
      });

      socket.on("error", (error: unknown) => {
        const normalizedError = asTransportError(error);

        if (!streamResolved) {
          failBeforeResolve(normalizedError);
          return;
        }

        failAfterResolve(normalizedError.message);
      });

      socket.on("close", () => {
        if (terminal) {
          return;
        }

        if (!streamResolved) {
          failBeforeResolve(
            new HttpError(502, "OpenClaw gateway closed the connection unexpectedly")
          );
          return;
        }

        failAfterResolve("OpenClaw gateway closed the connection unexpectedly");
      });
    });
  }
}

/**
 * Builds a `chat.send` RPC request.
 *
 * @param requestId The request correlation id.
 * @param request The normalized chat request.
 * @returns The outbound request frame.
 */
export function createChatSendRequest(
  requestId: string,
  request: OpenClawChatSendParams
): {
  type: "req";
  id: string;
  method: "chat.send";
  params: OpenClawChatSendParams;
} {
  return {
    type: "req",
    id: requestId,
    method: "chat.send",
    params: request
  };
}

/**
 * Creates the `sessions.patch` parameters required by chat agent.
 *
 * @param sessionKey The target session key.
 * @returns The normalized `sessions.patch` payload.
 */
export function createSessionPatchParams(
  sessionKey: string
): OpenClawSessionPatchParams {
  return {
    key: sessionKey,
    verboseLevel: "full"
  };
}

/**
 * Builds a `sessions.patch` RPC request.
 *
 * @param requestId The request correlation id.
 * @param params The session patch parameters.
 * @returns The outbound request frame.
 */
export function createSessionsPatchRequest(
  requestId: string | undefined,
  params: OpenClawSessionPatchParams
): {
  type: "req";
  id: string | undefined;
  method: "sessions.patch";
  params: OpenClawSessionPatchParams;
} {
  return {
    type: "req",
    id: requestId,
    method: "sessions.patch",
    params
  };
}

/**
 * Reads and validates the `chat.send` acknowledgement payload.
 *
 * @param frame The successful response frame.
 * @returns The normalized acknowledgement payload.
 */
export function readChatSendAckPayload(
  frame: OpenClawResponseFrame
): OpenClawChatSendAckPayload {
  const payload =
    typeof frame.payload === "object" && frame.payload !== null
      ? (frame.payload as Record<string, unknown>)
      : undefined;
  const runId = payload?.runId;
  const status = payload?.status;

  if (typeof runId !== "string" || runId.trim() === "") {
    throw new HttpError(502, "OpenClaw chat.send acknowledgement is missing runId");
  }

  if (
    status !== "started" &&
    status !== "in_flight" &&
    status !== "ok" &&
    status !== "error"
  ) {
    throw new HttpError(502, "OpenClaw chat.send acknowledgement is missing status");
  }

  return {
    runId,
    status
  };
}

/**
 * Reads and validates one OpenClaw `chat` event payload.
 *
 * @param frame The gateway event frame.
 * @returns The normalized chat event payload.
 */
export function readChatEventPayload(
  frame: OpenClawEventFrame
): OpenClawChatEventPayload {
  const payload =
    typeof frame.payload === "object" && frame.payload !== null
      ? (frame.payload as Record<string, unknown>)
      : undefined;
  const runId = payload?.runId;
  const sessionKey = payload?.sessionKey;
  const seq = payload?.seq;
  const state = payload?.state;

  if (typeof runId !== "string" || runId.trim() === "") {
    throw new HttpError(502, "OpenClaw chat event is missing runId");
  }

  if (typeof sessionKey !== "string" || sessionKey.trim() === "") {
    throw new HttpError(502, "OpenClaw chat event is missing sessionKey");
  }

  if (!Number.isInteger(seq) || (seq as number) < 0) {
    throw new HttpError(502, "OpenClaw chat event is missing seq");
  }

  if (
    state !== "delta" &&
    state !== "final" &&
    state !== "error" &&
    state !== "aborted"
  ) {
    throw new HttpError(502, "OpenClaw chat event is missing state");
  }

  return {
    runId,
    sessionKey,
    seq: seq as number,
    state,
    message:
      typeof payload?.message === "object" && payload.message !== null
        ? (payload.message as OpenClawChatAssistantMessage)
        : undefined,
    stopReason:
      typeof payload?.stopReason === "string" ? payload.stopReason : undefined,
    errorMessage:
      typeof payload?.errorMessage === "string" ? payload.errorMessage : undefined
  };
}

/**
 * Reads assistant text from an OpenClaw chat message.
 *
 * @param message The optional assistant message payload.
 * @returns The concatenated text content.
 */
export function readAssistantText(
  message?: OpenClawChatAssistantMessage
): string {
  if (message?.role !== "assistant" || !Array.isArray(message.content)) {
    return "";
  }

  return message.content
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
}

/**
 * Checks whether one gateway frame is a `chat` event frame.
 *
 * @param frame The parsed gateway frame.
 * @returns Whether the frame is a `chat` event.
 */
export function isChatEventFrame(frame: unknown): frame is OpenClawEventFrame {
  if (typeof frame !== "object" || frame === null) {
    return false;
  }

  const record = frame as Record<string, unknown>;

  return record.type === "event" && record.event === "chat";
}

/**
 * Creates a stable output message item id from the run id.
 *
 * @param runId The OpenClaw run id.
 * @returns The derived output item id.
 */
export function createOutputItemId(runId: string): string {
  return `msg_${runId}`;
}

/**
 * Creates a stable function call item id from the tool call id.
 *
 * @param toolCallId The OpenClaw tool call id.
 * @returns The derived function call item id.
 */
export function createFunctionCallItemId(toolCallId: string): string {
  return `fc_${toolCallId}`;
}

/**
 * Creates one assistant output item following the OpenResponse schema.
 *
 * @param itemId The stable output item id.
 * @param text The assistant text content.
 * @param status The item status.
 * @returns The normalized output item.
 */
export function createOutputMessageItem(
  itemId: string,
  text: string,
  status: "in_progress" | "completed" = "in_progress"
): Record<string, unknown> {
  return {
    type: "message",
    id: itemId,
    role: "assistant",
    status,
    content: [
      {
        type: "output_text",
        text
      }
    ]
  };
}

/**
 * Creates one function call output item following the OpenResponse shape.
 *
 * @param itemId The stable output item id.
 * @param toolCallId The stable tool call id.
 * @param name The tool name.
 * @param status The item status.
 * @param extra Optional additional fields kept for compatibility with OpenClaw tool events.
 * @returns The normalized function call item.
 */
export function createFunctionCallItem(
  itemId: string,
  toolCallId: string,
  name: string,
  status: "in_progress" | "completed" = "in_progress",
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    type: "function_call",
    id: itemId,
    call_id: toolCallId,
    name,
    arguments: "",
    status,
    ...extra
  };
}

/**
 * Creates one OpenResponse-style response resource.
 *
 * @param input The response fields to populate.
 * @returns The normalized response resource.
 */
export function createResponseResource(input: {
  runId: string;
  agentId: string;
  createdAtMs: number;
  status: "in_progress" | "completed" | "failed" | "cancelled";
  outputItems: Record<string, unknown>[];
  error?: {
    code: string;
    message: string;
  };
}): Record<string, unknown> {
  return {
    id: input.runId,
    object: "response",
    created_at: Math.floor(input.createdAtMs / 1_000),
    status: input.status,
    model: `agent:${input.agentId}`,
    output: input.outputItems,
    usage: {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    },
    ...(input.error === undefined ? {} : { error: input.error })
  };
}

/**
 * Serializes one OpenResponse event as SSE.
 *
 * @param enqueue Callback used to write the serialized event.
 * @param event The event payload to serialize.
 */
export function enqueueSseEvent(
  enqueue: (value: string) => void,
  event: Record<string, unknown>
): void {
  const type = typeof event.type === "string" ? event.type : "message";

  enqueue(`event: ${type}\ndata: ${JSON.stringify(event)}\n\n`);
}

/**
 * Checks whether one gateway frame is a tool `agent` event frame.
 *
 * @param frame The parsed gateway frame.
 * @returns Whether the frame is a tool `agent` event.
 */
export function isToolAgentEventFrame(frame: unknown): frame is OpenClawEventFrame {
  if (typeof frame !== "object" || frame === null) {
    return false;
  }

  const record = frame as Record<string, unknown>;
  const payload =
    typeof record.payload === "object" && record.payload !== null
      ? (record.payload as Record<string, unknown>)
      : undefined;

  return record.type === "event" && record.event === "agent" && payload?.stream === "tool";
}

/**
 * Checks whether one gateway frame is a text `agent` event frame.
 *
 * @param frame The parsed gateway frame.
 * @returns Whether the frame is an assistant text `agent` event.
 */
export function isTextAgentEventFrame(frame: unknown): frame is OpenClawEventFrame {
  if (typeof frame !== "object" || frame === null) {
    return false;
  }

  const record = frame as Record<string, unknown>;
  const payload =
    typeof record.payload === "object" && record.payload !== null
      ? (record.payload as Record<string, unknown>)
      : undefined;

  return record.type === "event" && record.event === "agent" && payload?.stream === "assistant";
}

/**
 * Reads and validates one OpenClaw text `agent` event payload.
 *
 * @param frame The gateway event frame.
 * @returns The normalized text event payload.
 */
export function readTextAgentEventPayload(
  frame: OpenClawEventFrame
): OpenClawTextAgentEventPayload {
  const payload =
    typeof frame.payload === "object" && frame.payload !== null
      ? (frame.payload as Record<string, unknown>)
      : undefined;
  const runId = payload?.runId;
  const seq = payload?.seq;
  const stream = payload?.stream;
  const ts = payload?.ts;
  const data =
    typeof payload?.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const text = data?.text;
  const delta = data?.delta;

  if (typeof runId !== "string" || runId.trim() === "") {
    throw new HttpError(502, "OpenClaw assistant text event is missing runId");
  }

  if (!Number.isInteger(seq) || (seq as number) < 0) {
    throw new HttpError(502, "OpenClaw assistant text event is missing seq");
  }

  if (stream !== "assistant") {
    throw new HttpError(502, "OpenClaw assistant text event is missing stream");
  }

  if (!Number.isInteger(ts) || (ts as number) < 0) {
    throw new HttpError(502, "OpenClaw assistant text event is missing ts");
  }

  if (typeof text !== "string") {
    throw new HttpError(502, "OpenClaw assistant text event is missing text");
  }

  if (delta !== undefined && typeof delta !== "string") {
    throw new HttpError(502, "OpenClaw assistant text event delta must be a string");
  }

  return {
    runId,
    sessionKey:
      typeof payload?.sessionKey === "string" ? payload.sessionKey : undefined,
    seq: seq as number,
    stream,
    ts: ts as number,
    data: {
      text,
      delta: typeof delta === "string" ? delta : undefined
    }
  };
}

/**
 * Reads and validates one OpenClaw tool `agent` event payload.
 *
 * @param frame The gateway event frame.
 * @returns The normalized tool event payload.
 */
export function readToolAgentEventPayload(
  frame: OpenClawEventFrame
): OpenClawToolAgentEventPayload {
  const payload =
    typeof frame.payload === "object" && frame.payload !== null
      ? (frame.payload as Record<string, unknown>)
      : undefined;
  const runId = payload?.runId;
  const seq = payload?.seq;
  const stream = payload?.stream;
  const ts = payload?.ts;
  const data =
    typeof payload?.data === "object" && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : undefined;
  const phase = data?.phase;

  if (typeof runId !== "string" || runId.trim() === "") {
    throw new HttpError(502, "OpenClaw tool event is missing runId");
  }

  if (!Number.isInteger(seq) || (seq as number) < 0) {
    throw new HttpError(502, "OpenClaw tool event is missing seq");
  }

  if (stream !== "tool") {
    throw new HttpError(502, "OpenClaw tool event is missing stream");
  }

  if (!Number.isInteger(ts) || (ts as number) < 0) {
    throw new HttpError(502, "OpenClaw tool event is missing ts");
  }

  if (
    phase !== "start" &&
    phase !== "update" &&
    phase !== "result" &&
    phase !== "error" &&
    phase !== "progress"
  ) {
    throw new HttpError(502, "OpenClaw tool event is missing phase");
  }

  return {
    runId,
    sessionKey:
      typeof payload?.sessionKey === "string" ? payload.sessionKey : undefined,
    seq: seq as number,
    stream,
    ts: ts as number,
    data: {
      phase,
      name: typeof data?.name === "string" ? data.name : undefined,
      toolCallId: typeof data?.toolCallId === "string" ? data.toolCallId : undefined,
      result: data?.result,
      partialResult: data?.partialResult,
      error: data?.error
    }
  };
}

/**
 * Adds the final assistant message to the current output items when needed.
 *
 * @param outputItems Current output items.
 * @param finalText Final assistant text.
 * @param runId Stable run id.
 * @returns The merged output items.
 */
export function mergeOutputItems(
  outputItems: Record<string, unknown>[],
  finalText: string,
  runId: string
): Record<string, unknown>[] {
  if (finalText.length === 0) {
    return [...outputItems];
  }

  const messageItemId = createOutputItemId(runId);
  const existingIndex = outputItems.findIndex((item) => item.id === messageItemId);
  const nextItems = [...outputItems];
  const messageItem = createOutputMessageItem(messageItemId, finalText, "completed");

  if (existingIndex === -1) {
    nextItems.push(messageItem);
    return nextItems;
  }

  nextItems[existingIndex] = messageItem;
  return nextItems;
}

/**
 * Attaches a best-effort abort handler to an optional signal.
 *
 * @param signal Optional abort signal.
 * @param listener Callback invoked when the signal aborts.
 * @returns Cleanup callback that removes the listener.
 */
export function attachAbortSignal(
  signal: AbortSignal | undefined,
  listener: () => void
): () => void {
  if (signal === undefined) {
    return () => undefined;
  }

  if (signal.aborted) {
    listener();
    return () => undefined;
  }

  signal.addEventListener("abort", listener, { once: true });

  return () => {
    signal.removeEventListener("abort", listener);
  };
}
