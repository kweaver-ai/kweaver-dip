import background from '@/assets/images/brand/background.png'
import background2 from '@/assets/images/brand/background2.png'
import logo from '@/assets/images/brand/logo.svg'
import { getFullPath } from '@/utils/config'

import type { OemBasicConfig, OemResourceConfig } from './index.d'
import {
  FontStyle,
  LoginBackgroundType,
  LoginBoxLocationType,
  LoginBoxStyleType,
  TemplateType,
} from './index.d'

/**
 * 默认 OEM 资源配置（按语言）
 * 这里只保留当前项目实际用到的字段
 */
export const defaultOemResourceConfigs: Record<string, OemResourceConfig> = {
  'zh-CN': {
    'background.png': background,
    'darklogo.png': '',
    'defaultBackground.png': '',
    'desktopDefaultBackground.png': '',
    homePageSlogan: '',
    'logo.png': logo,
    'org.png': '',
    portalBanner: '',
    product: 'dip',
    'regularBackground.png': background2,
    'regularLiveBackground.gif': '',
    'title.png': '',
  },
  'zh-TW': {
    'background.png': '',
    'darklogo.png': '',
    'defaultBackground.png': '',
    'desktopDefaultBackground.png': '',
    homePageSlogan: '',
    'logo.png': '',
    'org.png': '',
    portalBanner: '',
    product: 'dip',
    'regularBackground.png': '',
    'regularLiveBackground.gif': '',
    'title.png': '',
  },
  'en-US': {
    'background.png': '',
    'darklogo.png': '',
    'defaultBackground.png': '',
    'desktopDefaultBackground.png': '',
    homePageSlogan: '',
    'logo.png': '',
    'org.png': '',
    portalBanner: '',
    product: 'dip',
    'regularBackground.png': '',
    'regularLiveBackground.gif': '',
    'title.png': '',
  },
}

/**
 * 默认 OEM 基本配置
 * 这里只保留当前项目实际用到的字段
 */
export const defaultOemBasicConfig: OemBasicConfig = {
  // 登录模板：默认模板
  webTemplate: TemplateType.Regular,
  // 字体样式：深色
  regularFont: FontStyle.Dark,
  // 登录框位置：靠右
  loginBoxLocation: LoginBoxLocationType.Center,
  // 登录框样式：白色背景
  loginBoxStyle: LoginBoxStyleType.White,
  // 登录背景类型：图片
  loginBackgroundType: LoginBackgroundType.Picture,
  // 是否显示「用户协议」「隐私政策」链接
  showUserAgreement: true,
  showPrivacyPolicy: true,
  // 备案号
  recordNumber: '沪ICP备09089247号-9',
  // 自定义版本
  customVersion: '1.0.4.0',
  // 主题
  theme: '#126ee3',
  // 个性化ico
  'favicon.ico': getFullPath('/favicon.ico'),
}

/**
 * 默认 iframe 大小配置
 */
export const defaultIframeSize = {
  height: 410,
}
