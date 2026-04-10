import {
  defaultIframeSize,
  defaultOemBasicConfig,
  defaultOemResourceConfigs,
} from './defaultConfig'
import type { AppConfigResponse, OemBasicConfig, OemResourceConfig } from './index.d'
import {
  FontStyle,
  LoginBackgroundType,
  LoginBoxLocationType,
  LoginBoxStyleType,
  TemplateType,
} from './index.d'

export type { OemBasicConfig, OemResourceConfig } from './index.d'
export { TemplateType, LoginBoxLocationType, LoginBoxStyleType, LoginBackgroundType, FontStyle }

/**
 * 获取应用配置接口
 * TODO: 后端接口待接入
 */
export function getAppConfigApi(): Promise<AppConfigResponse> {
  // TODO: 后端接口待接入，暂时返回默认值
  return Promise.resolve({ language: 'zh-CN' })
  // return get('/config/app')
}

/**
 * 更新语言配置接口
 * TODO: 后端接口待接入
 */
export function postLanguageApi(_language: string): Promise<void> {
  // TODO: 后端接口待接入，暂时不执行任何操作
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return Promise.resolve()
  // return post('/config/app', { body: { language } })
}

/**
 * 获取 OEM 资源配置（使用本地默认配置）
 * @param language 语言代码，如 'zh-CN', 'zh-TW', 'en-US'
 * @param _product product 参数，占位保持原有签名
 */
export function getOEMResourceConfigApi(
  language: string = 'zh-CN',
  _product: string = 'dip',
): Promise<OemResourceConfig> {
  // 先按语言精确匹配
  const directConfig = defaultOemResourceConfigs[language]
  if (directConfig) {
    return Promise.resolve(directConfig)
  }

  // 再根据语言前缀做兜底
  const langPrefix = language.split('-')[0].toLowerCase()
  if (langPrefix === 'zh') {
    return Promise.resolve(defaultOemResourceConfigs['zh-CN'] || defaultOemResourceConfigs['zh-TW'])
  }
  if (langPrefix === 'en') {
    return Promise.resolve(defaultOemResourceConfigs['en-US'])
  }

  // 最终兜底：返回第一个可用配置
  const firstConfig = Object.values(defaultOemResourceConfigs)[0]
  return Promise.resolve(firstConfig)
}

/**
 * 获取 OEM 基本配置（使用本地默认配置）
 */
export function getOEMBasicConfigApi(): Promise<OemBasicConfig> {
  return Promise.resolve(defaultOemBasicConfig)
}

/**
 * 获取 iframe 高度（使用本地默认配置）
 * @returns iframe 高度（像素）
 */
export function getIframeSizeApi(): Promise<{ height: number }> {
  return Promise.resolve(defaultIframeSize)
}
