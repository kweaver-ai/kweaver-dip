import {
  DefaultBknHttpClient,
  type BknHttpClient,
  type BknHttpClientOptions,
  type BknProxyResponse
} from "../infra/bkn-http-client";
import { getEnv } from "../utils/env";
import type { BknQuery } from "../types/bkn";

/**
 * Application logic that proxies BKN knowledge network requests.
 */
export interface BknLogic {
  /**
   * Fetches the BKN knowledge network list.
   *
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value.
   * @returns The normalized upstream response.
   */
  listKnowledgeNetworks(query: BknQuery, businessDomain?: string): Promise<BknProxyResponse>;

  /**
   * Fetches one BKN knowledge network detail.
   *
   * @param knId Knowledge network id.
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value.
   * @returns The normalized upstream response.
   */
  getKnowledgeNetwork(
    knId: string,
    query: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse>;
}

/**
 * Factory used to create a fresh BKN HTTP client for each request.
 */
export type CreateBknHttpClient = (options: BknHttpClientOptions) => BknHttpClient;

/**
 * Runtime dependencies required by {@link DefaultBknLogic}.
 */
export interface BknLogicOptions {
  /**
   * Optional env reader used to resolve the current BKN client configuration.
   */
  getEnv?: typeof getEnv;

  /**
   * Optional factory used to create the per-request BKN HTTP client.
   */
  createClient?: CreateBknHttpClient;
}

/**
 * Default BKN logic implementation that creates a fresh HTTP client for every request.
 */
export class DefaultBknLogic implements BknLogic {
  private readonly getEnvValue: typeof getEnv;
  private readonly createClientValue: CreateBknHttpClient;

  /**
   * Creates the BKN logic.
   *
   * @param options Optional dependency overrides for tests.
   */
  public constructor(options: BknLogicOptions = {}) {
    this.getEnvValue = options.getEnv ?? getEnv;
    this.createClientValue = options.createClient ?? ((clientOptions) =>
      new DefaultBknHttpClient(clientOptions));
  }

  /**
   * Fetches the BKN knowledge network list.
   *
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value.
   * @returns The normalized upstream response.
   */
  public async listKnowledgeNetworks(
    query: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse> {
    return this.createClient().listKnowledgeNetworks(query, businessDomain);
  }

  /**
   * Fetches one BKN knowledge network detail.
   *
   * @param knId Knowledge network id.
   * @param query Incoming query string values.
   * @param businessDomain Upstream `x-business-domain` value.
   * @returns The normalized upstream response.
   */
  public async getKnowledgeNetwork(
    knId: string,
    query: BknQuery,
    businessDomain?: string
  ): Promise<BknProxyResponse> {
    return this.createClient().getKnowledgeNetwork(knId, query, businessDomain);
  }

  /**
   * Builds a fresh BKN HTTP client from the current environment snapshot.
   *
   * @returns A newly created BKN HTTP client instance.
   */
  private createClient(): BknHttpClient {
    const env = this.getEnvValue();

    return this.createClientValue({
      baseUrl: env.bknBackendUrl,
      token: env.appUserToken,
      timeoutMs: env.openClawGatewayTimeoutMs
    });
  }
}
