export enum LangType {
  zh = 'zh-cn',
  tw = 'zh-tw',
  us = 'en-us',
}

export interface ConfigType {
  protocol: string;
  host: string;
  port: number;
  lang: LangType;
  prefix: string;
  getToken: () => string;
  refreshToken?: () => Promise<{ access_token?: string; accessToken?: string }>;
  onTokenExpired?: (code?: number) => void;
  businessDomainID: string;
}

export interface OptionsType {
  body?: any;
  headers?: any;
  timeout?: number;
  params?: Record<string, any>;
  resHeader?: boolean;
  returnFullResponse?: boolean;
  responseType?: string;
}

export enum IncrementalActionEnum {
  Upsert = 'upsert',
  Append = 'append',
  Remove = 'remove',
  End = 'end',
}

export const businessDomainHeaderKey = 'x-business-domain';
