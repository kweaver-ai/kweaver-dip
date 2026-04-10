import type { ConfigType } from './types';
import { LangType } from './types';

/** 运行时 HTTP 网关与鉴权配置，由 qiankun mount 时 setConfig 注入 */
export const config: ConfigType = {
  protocol: 'http',
  host: 'localhost',
  port: 80,
  lang: LangType.zh,
  prefix: '',
  getToken: () => '',
  refreshToken: undefined,
  onTokenExpired: undefined,
  businessDomainID: '',
};

export function setConfig(obj: Partial<ConfigType> & Record<string, unknown>) {
  Object.assign(config, obj);
}

export function getConfig(key: string) {
  return (config as unknown as Record<string, unknown>)[key];
}
