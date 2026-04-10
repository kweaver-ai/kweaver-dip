export type SearchParamValue = string | number | boolean | null | undefined;

export interface SetSearchParamOptions {
  /**
   * replace=true 时不会新增 history 记录
   */
  replace?: boolean;
}

/**
 * 获取某一个 query 参数
 */
export function getSearchParam(key: string, search: string = window.location.search): string | null {
  return new URLSearchParams(search).get(key);
}

/**
 * 设置某一个 query 参数
 *
 * - 会保留其它 query
 * - value 为 null/undefined/'' 时会删除该 key
 */
export function setSearchParam(key: string, value: SearchParamValue, options: SetSearchParamOptions = {}) {
  const params = new URLSearchParams(window.location.search);

  if (value === null || value === undefined || value === '') {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;

  if (options.replace) {
    window.history.replaceState(window.history.state, '', nextUrl);
  } else {
    window.history.pushState(window.history.state, '', nextUrl);
  }
}
