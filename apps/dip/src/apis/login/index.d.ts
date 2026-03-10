/** 刷新令牌响应 */
export interface RefreshTokenResponse {
  /** Session ID */
  session_id: string
  /** Access Token */
  access_token: string
}
