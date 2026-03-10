import { get } from '@/utils/http'
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
 * 将语言代码转换为 section 参数
 * @param language 语言代码，如 'zh-CN', 'zh-TW', 'en-US'
 * @returns section 参数，如 'shareweb_zh-cn', 'shareweb_zh-tw', 'shareweb_en-us'
 */
function getSectionByLanguage(language: string): string {
  const langMap: Record<string, string> = {
    'zh-CN': 'shareweb_zh-cn',
    'zh-TW': 'shareweb_zh-tw',
    'zh-HK': 'shareweb_zh-tw',
    'en-US': 'shareweb_en-us',
    en: 'shareweb_en-us',
  }

  // 优先精确匹配
  if (langMap[language]) {
    return langMap[language]
  }

  // 尝试匹配前缀
  const langPrefix = language.split('-')[0].toLowerCase()
  if (langPrefix === 'zh') {
    return 'shareweb_zh-cn' // 默认简体中文
  }
  if (langPrefix === 'en') {
    return 'shareweb_en-us'
  }

  // 默认返回简体中文
  return 'shareweb_zh-cn'
}

/**
 * 获取 OEM 资源配置
 * @param language 语言代码，如 'zh-CN', 'zh-TW', 'en-US'
 * @param product product 参数，默认为 'dip'
 */
export function getOEMResourceConfigApi(
  language: string = 'zh-CN',
  product: string = 'dip',
): Promise<OemResourceConfig> {
  const section = getSectionByLanguage(language)
  return get('/api/deploy-web-service/v1/oemconfig', {
    params: { section, product },
  })
}

/**
 * 获取 OEM 基本配置
 */
export function getOEMBasicConfigApi(): Promise<OemBasicConfig> {
  return get('/api/deploy-web-service/v1/oemconfig', {
    params: { section: 'anyshare', product: 'dip' },
  })
}

/**
 * 获取 iframe 高度
 * @returns iframe 高度（像素）
 */
export function getIframeSizeApi(): Promise<{ height: number }> {
  return get('/oauth2/iframe-size')
}
