import type {
  OpenClawGatewayPort,
  OpenClawRequestFrame
} from "../types/openclaw";
import type {
  OpenClawChatHistoryParams,
  OpenClawChatHistoryResult,
  OpenClawSessionDeleteParams,
  OpenClawSessionDeleteResult,
  OpenClawSessionGetParams,
  OpenClawSessionGetResult,
  OpenClawSessionsListParams,
  OpenClawSessionsListResult,
  OpenClawSessionsPreviewParams,
  OpenClawSessionsPreviewResult
} from "../types/sessions";

/**
 * Outbound adapter used to fetch OpenClaw sessions through the gateway port.
 */
export interface OpenClawSessionsAdapter {
  /**
   * Fetches chat messages using OpenClaw `chat.history`.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw chat history payload.
   */
  getChatMessages?(
    params: OpenClawChatHistoryParams
  ): Promise<OpenClawChatHistoryResult>;

  /**
   * Fetches sessions using OpenClaw `sessions.list`.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions list payload.
   */
  listSessions(params: OpenClawSessionsListParams): Promise<OpenClawSessionsListResult>;

  /**
   * Fetches one session detail using OpenClaw `sessions.get`.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw session detail payload.
   */
  getSession(params: OpenClawSessionGetParams): Promise<OpenClawSessionGetResult>;

  /**
   * Deletes one session using OpenClaw `sessions.delete`.
   *
   * @param params Request parameters forwarded to OpenClaw.
   * @returns The OpenClaw session deletion payload.
   */
  deleteSession(
    params: OpenClawSessionDeleteParams
  ): Promise<OpenClawSessionDeleteResult>;

  /**
   * Fetches previews for multiple sessions using OpenClaw `sessions.preview`.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw session previews payload.
   */
  previewSessions(
    params: OpenClawSessionsPreviewParams
  ): Promise<OpenClawSessionsPreviewResult>;
}

/**
 * Creates the OpenClaw `sessions.list` request.
 *
 * @param requestId The frame correlation id.
 * @param params Query parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createSessionsListRequest(
  requestId: string,
  params: OpenClawSessionsListParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "sessions.list",
    params
  };
}

/**
 * Creates the OpenClaw `sessions.get` request.
 *
 * @param requestId The frame correlation id.
 * @param params Query parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createSessionsGetRequest(
  requestId: string,
  params: OpenClawSessionGetParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "sessions.get",
    params
  };
}

/**
 * Creates the OpenClaw `chat.history` request.
 *
 * @param requestId The frame correlation id.
 * @param params Query parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createChatHistoryRequest(
  requestId: string,
  params: OpenClawChatHistoryParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "chat.history",
    params
  };
}

/**
 * Creates the OpenClaw `sessions.delete` request.
 *
 * @param requestId The frame correlation id.
 * @param params Request parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createSessionsDeleteRequest(
  requestId: string,
  params: OpenClawSessionDeleteParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "sessions.delete",
    params
  };
}

/**
 * Creates the OpenClaw `sessions.preview` request.
 *
 * @param requestId The frame correlation id.
 * @param params Query parameters forwarded to OpenClaw.
 * @returns A serialized OpenClaw request frame.
 */
export function createSessionsPreviewRequest(
  requestId: string,
  params: OpenClawSessionsPreviewParams
): OpenClawRequestFrame {
  return {
    type: "req",
    id: requestId,
    method: "sessions.preview",
    params
  };
}

/**
 * Adapter that translates sessions queries to OpenClaw Gateway JSON RPC.
 */
export class OpenClawSessionsGatewayAdapter implements OpenClawSessionsAdapter {
  /**
   * Creates the adapter.
   *
   * @param gatewayPort The OpenClaw Gateway RPC port.
   */
  public constructor(private readonly gatewayPort: OpenClawGatewayPort) {}

  /**
   * Queries `chat.history` over the gateway RPC port.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw chat history payload.
   */
  public async getChatMessages(
    params: OpenClawChatHistoryParams
  ): Promise<OpenClawChatHistoryResult> {
    return this.gatewayPort.invoke<OpenClawChatHistoryResult>(
      createChatHistoryRequest("chat.history", params)
    );
  }

  /**
   * Queries `sessions.list` over the gateway RPC port.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions list payload.
   */
  public async listSessions(
    params: OpenClawSessionsListParams
  ): Promise<OpenClawSessionsListResult> {
    return this.gatewayPort.invoke<OpenClawSessionsListResult>(
      createSessionsListRequest("sessions.list", params)
    );
  }

  /**
   * Queries `sessions.get` over the gateway RPC port.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw session detail payload.
   */
  public async getSession(
    params: OpenClawSessionGetParams
  ): Promise<OpenClawSessionGetResult> {
    return this.gatewayPort.invoke<OpenClawSessionGetResult>(
      createSessionsGetRequest("sessions.get", params)
    );
  }

  /**
   * Queries `sessions.delete` over the gateway RPC port.
   *
   * @param params Request parameters forwarded to OpenClaw.
   * @returns The OpenClaw session deletion payload.
   */
  public async deleteSession(
    params: OpenClawSessionDeleteParams
  ): Promise<OpenClawSessionDeleteResult> {
    return this.gatewayPort.invoke<OpenClawSessionDeleteResult>(
      createSessionsDeleteRequest("sessions.delete", params)
    );
  }

  /**
   * Queries `sessions.preview` over the gateway RPC port.
   *
   * @param params Query parameters forwarded to OpenClaw.
   * @returns The OpenClaw sessions preview payload.
   */
  public async previewSessions(
    params: OpenClawSessionsPreviewParams
  ): Promise<OpenClawSessionsPreviewResult> {
    return this.gatewayPort.invoke<OpenClawSessionsPreviewResult>(
      createSessionsPreviewRequest("sessions.preview", params)
    );
  }
}
