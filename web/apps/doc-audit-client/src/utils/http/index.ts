import { createHttpRequest, cacheableHttp, getCommonHttpHeaders, getHttpBaseUrl } from './http-request';
import { setConfig, getConfig } from './http-config';
import { type OptionsType, businessDomainHeaderKey, LangType } from './types';

export const get = (url: string, options?: OptionsType) => createHttpRequest('GET', url, options);
export const post = (url: string, options?: OptionsType) => createHttpRequest('POST', url, options);
export const put = (url: string, options?: OptionsType) => createHttpRequest('PUT', url, options);
export const del = (url: string, options?: OptionsType) => createHttpRequest('DELETE', url, options);
export const patch = (url: string, options?: OptionsType) => createHttpRequest('PATCH', url, options);
export const cacheableGet = (url: string, options?: OptionsType & { expires?: number }) =>
  cacheableHttp('GET', url, options);

export { setConfig, getConfig, getCommonHttpHeaders, getHttpBaseUrl, businessDomainHeaderKey, LangType };
