/**
 * 应用配置响应数据
 */
export interface AppConfigResponse {
  language: string
  [key: string]: unknown
}

/**
 * OEM 资源配置信息
 */
export interface OemResourceConfig {
  'background.png': string
  'darklogo.png': string
  'defaultBackground.png': string
  'desktopDefaultBackground.png': string
  homePageSlogan: string
  'logo.png': string
  'org.png': string
  portalBanner: string
  product: string
  'regularBackground.png': string
  'regularLiveBackground.gif': string
  'title.png': string
}

/**
 * OEM 基本配置信息
 */
export interface OemBasicConfig {
  /**
   * 主题
   */
  theme?: string
  /**
   * 登录模板
   */
  webTemplate?: string
  /**
   * 字体
   */
  regularFont?: string
  /**
   * icp备案号
   */
  recordNumber?: string
  /**
   * 公网安备号
   */
  publicCode?: string
  /**
   * 个性化ico
   */
  'favicon.ico'?: string
  /**
   * 自定义版本
   */
  customVersion?: string
  /**
   * 协议文本
   */
  agreementText?: string
  /**
   * 客户端登录模板
   */
  desktopTemplate?: string
  /**
   * ios 下载链接
   */
  iosDownloadLink?: string
  /**
   *安卓 下载链接
   */
  androidDownloadLink?: string
  /**
   * 客户端第三方型号
   */
  desktopThirdLoginSize?: string
  /**
   * 客户端第三方登录宽度
   */
  desktopThirdLoginWidth?: string
  /**
   * 客户端第三方登录高度
   */
  desktopThirdLoginHeight?: string

  // 登录框位置
  loginBoxLocation?: string

  // 登录框样式
  loginBoxStyle?: string

  // 登录背景类型
  loginBackgroundType?: string

  mac?: boolean
  ios?: boolean
  android?: boolean
  showVersion?: boolean
  userAgreement?: boolean
  showCopyright?: boolean
  openWebModule?: boolean
  openContentBus?: boolean
  showPublicCode?: boolean
  showOnlineHelp?: boolean
  isCustomVersion?: boolean
  showRecordNumber?: boolean
  showPortalBanner?: boolean
  showPrivacyPolicy?: boolean
  windows32Advanced?: boolean
  showGettingStarted?: boolean
  windows64Advanced?: boolean
  showUserAgreement?: boolean
}

/** 登录框位置类型 */
export enum LoginBoxLocationType {
  /** 居中 */
  Center = 'center',
  /** 居右 */
  Right = 'right',
}

/** 登录框样式类型 */
export enum LoginBoxStyleType {
  /**  白色背景 */
  White = 'white',
  /** 半透明 */
  Transparent = 'transparent',
}

/** 登录框背景类型 */
export enum LoginBackgroundType {
  /** 图片 */
  Picture = 'picture',
  /** 动图 */
  Animated = 'animated',
}

/** 模板类型 */
export enum TemplateType {
  /** 默认模板 */
  Default = 'default',
  /** 常规模板 */
  Regular = 'regular',
}

/** 字体样式 */
export enum FontStyle {
  /** 深色 */
  Dark = 'dark',
  /** 浅色 */
  Light = 'light',
}
