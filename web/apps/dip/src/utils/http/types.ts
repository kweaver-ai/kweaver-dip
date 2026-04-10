export interface OptionsType {
  body?: any
  headers?: any
  timeout?: number
  params?: Record<string, any>
  resHeader?: boolean
  returnFullResponse?: boolean
  /** axios responseType，如流式接口使用 `text` */
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  /** 为 true 时 401 不刷新 token、不跳转登录，将错误体 reject 给调用方 */
  skipAuthRefreshOn401?: boolean
}

export enum IncrementalActionEnum {
  Upsert = 'upsert',
  Append = 'append',
  Remove = 'remove',
  End = 'end',
}
