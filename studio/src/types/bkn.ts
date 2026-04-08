/**
 * BKN proxy query and path types.
 *
 * List and detail `GET` routes also accept inbound header `x-business-domain` (optional); when
 * missing or blank, the server forwards `bd_public` to the BKN Backend.
 */

/**
 * Query parameters supported by the BKN knowledge network list endpoint.
 */
export interface BknKnowledgeNetworksListQuery {
  /**
   * Fuzzy name filter.
   */
  name_pattern?: string;

  /**
   * Sort field.
   */
  sort?: "update_time" | "name";

  /**
   * Sort direction.
   */
  direction?: "asc" | "desc";

  /**
   * Pagination offset.
   */
  offset?: string;

  /**
   * Pagination limit.
   */
  limit?: string;

  /**
   * Exact tag filter.
   */
  tag?: string;
}

/**
 * Query parameters supported by the BKN detail endpoint.
 */
export interface BknKnowledgeNetworkDetailQuery {
  /**
   * Optional detail mode.
   */
  mode?: "" | "export";

  /**
   * Whether to include statistics.
   */
  include_statistics?: string;
}

/**
 * Express path parameters for knowledge network detail routes.
 */
export interface BknKnowledgeNetworkParams {
  /**
   * Knowledge network identifier.
   */
  kn_id: string;
}

/**
 * Supported BKN route query combinations.
 */
export type BknQuery =
  | BknKnowledgeNetworksListQuery
  | BknKnowledgeNetworkDetailQuery;
