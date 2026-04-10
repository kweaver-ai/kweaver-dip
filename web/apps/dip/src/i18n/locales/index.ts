import aiPromptInput_en from './ai-prompt-input/en-US.json'
import aiPromptInput_zh from './ai-prompt-input/zh-CN.json'
import aiPromptInput_tw from './ai-prompt-input/zh-TW.json'
import dataAgent_en from './data-agent/en-US.json'
import dataAgent_zh from './data-agent/zh-CN.json'
import dataAgent_tw from './data-agent/zh-TW.json'
import digitalHuman_zh from './digital-human/zh-CN.json'
import dipChatKit_en from './dip-chat-kit/en-US.json'
import dipChatKit_zh from './dip-chat-kit/zh-CN.json'
import dipChatKit_tw from './dip-chat-kit/zh-TW.json'
import error_en from './error/en-US.json'
import error_zh from './error/zh-CN.json'
import error_tw from './error/zh-TW.json'
import global_en from './global/en-US.json'
import global_zh from './global/zh-CN.json'
import global_tw from './global/zh-TW.json'
import home_en from './home/en-US.json'
import home_zh from './home/zh-CN.json'
import home_tw from './home/zh-TW.json'

const zh_CN = {
  ...error_zh,
  ...global_zh,
  ...home_zh,
  ...aiPromptInput_zh,
  ...dataAgent_zh,
  ...digitalHuman_zh,
  ...dipChatKit_zh,
}

const zh_TW = {
  ...error_tw,
  ...global_tw,
  ...home_tw,
  ...aiPromptInput_tw,
  ...dataAgent_tw,
  ...dipChatKit_tw,
}

const en_US = {
  ...error_en,
  ...global_en,
  ...home_en,
  ...aiPromptInput_en,
  ...dataAgent_en,
  ...dipChatKit_en,
}

const locales = {
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  'en-US': en_US,
}

export default locales
