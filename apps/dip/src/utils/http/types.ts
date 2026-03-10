export interface OptionsType {
  body?: any
  headers?: any
  timeout?: number
  params?: Record<string, any>
  resHeader?: boolean
  returnFullResponse?: boolean
}

export enum IncrementalActionEnum {
  Upsert = 'upsert',
  Append = 'append',
  Remove = 'remove',
  End = 'end',
}
