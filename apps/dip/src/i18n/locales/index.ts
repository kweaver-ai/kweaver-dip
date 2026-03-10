import dataAgent_en from './data-agent/en-US.json'
import dataAgent_zh from './data-agent/zh-CN.json'
import dataAgent_tw from './data-agent/zh-TW.json'
import error_en from './error/en-US.json'
import error_zh from './error/zh-CN.json'
import error_tw from './error/zh-TW.json'
import global_en from './global/en-US.json'
import global_zh from './global/zh-CN.json'
import global_tw from './global/zh-TW.json'

const zh_CN = {
  ...error_zh,
  ...global_zh,
  ...dataAgent_zh,
}

const zh_TW = {
  ...error_tw,
  ...global_tw,
  ...dataAgent_tw,
}

const en_US = {
  ...error_en,
  ...global_en,
  ...dataAgent_en,
}

const locales = {
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  'en-US': en_US,
}

export default locales
