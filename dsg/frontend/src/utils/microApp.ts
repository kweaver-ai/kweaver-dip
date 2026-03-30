/**
 * 微应用模式下的容器挂载工具函数
 * 解决 Modal、Tooltip、Popover 等组件在微应用模式下的挂载问题
 */

/**
 * 支持的微应用容器 ID 列表
 */
const MICRO_APP_CONTAINER_IDS = [
    'smart-data-find',
    'smart-data-query',
    'semantic-governance',
    'af-plugin-framework-for-as',
]

/**
 * 查找微应用容器
 */
function findMicroAppContainer(): HTMLElement | null {
    let result: HTMLElement | null = null
    MICRO_APP_CONTAINER_IDS.forEach((id) => {
        if (!result) {
            const container = document.querySelector(`#${id}`)
            if (container) {
                result = container as HTMLElement
            }
        }
    })
    return result
}

/**
 * 获取合适的挂载容器
 * 在微应用模式下返回当前微应用的根节点,在独立应用模式下返回 document.body
 */
// eslint-disable-next-line no-underscore-dangle
export const getPopupContainer = (): HTMLElement | false => {
    // eslint-disable-next-line no-underscore-dangle
    if (window.__POWERED_BY_QIANKUN__) {
        const microAppRoot = findMicroAppContainer()
        if (microAppRoot) {
            return microAppRoot
        }
        return document.body
    }
    return document.body
}

/**
 * 获取 Tooltip 等弹出组件的挂载容器
 */
// eslint-disable-next-line no-underscore-dangle
export const getTooltipContainer = (node?: HTMLElement): HTMLElement => {
    // eslint-disable-next-line no-underscore-dangle
    if (window.__POWERED_BY_QIANKUN__) {
        const microAppRoot = findMicroAppContainer()
        if (microAppRoot) {
            return microAppRoot
        }
        if (node && node.parentNode) {
            return node.parentNode as HTMLElement
        }
        return document.body
    }
    if (node && node.parentNode) {
        return node.parentNode as HTMLElement
    }
    return document.body
}

/**
 * 创建一个通用的 getPopupContainer 函数
 * 用于 Modal、Drawer、Popover 等组件的 getContainer 属性
 */
// eslint-disable-next-line no-underscore-dangle
export const createGetContainerFunc = (): (() => HTMLElement) | false => {
    // eslint-disable-next-line no-underscore-dangle
    if (window.__POWERED_BY_QIANKUN__) {
        return () => {
            const microAppRoot = findMicroAppContainer()
            if (microAppRoot) {
                return microAppRoot
            }
            return document.body
        }
    }
    return false
}

/**
 * 检查当前是否在微应用模式下
 */
// eslint-disable-next-line no-underscore-dangle
export const isMicroAppMode = (): boolean => {
    // eslint-disable-next-line no-underscore-dangle
    return !!window.__POWERED_BY_QIANKUN__
}

/**
 * 获取微应用的根容器
 */
export const getMicroAppRoot = (): HTMLElement | null => {
    if (isMicroAppMode()) {
        return findMicroAppContainer()
    }
    return null
}

/**
 * 微应用类型枚举
 */
export enum MicroAppType {
    SmartDataFind = 'smart-data-find',
    SmartDataQuery = 'smart-data-query',
    SemanticGovernance = 'semantic-governance',
    AfPluginFramework = 'af-plugin-framework-for-as',
}

/**
 * 获取当前运行的微应用类型
 * 优先从全局变量读取，然后检测页面中的容器元素
 */
export const getCurrentMicroAppType = (): MicroAppType | null => {
    // 优先检查全局变量（微应用启动时设置）
    // eslint-disable-next-line no-underscore-dangle
    const globalType = window.__MICRO_APP_TYPE__
    if (globalType) {
        // 根据全局类型返回对应的枚举值
        switch (globalType) {
            case 'smart-data-find':
                return MicroAppType.SmartDataFind
            case 'smart-data-query':
                return MicroAppType.SmartDataQuery
            case 'semantic-governance':
                return MicroAppType.SemanticGovernance
            case 'af-plugin-framework-for-as':
                return MicroAppType.AfPluginFramework
            default:
                break
        }
    }

    // 检查页面中的容器元素（降级方案）
    if (document.querySelector('#smart-data-find')) {
        return MicroAppType.SmartDataFind
    }
    if (document.querySelector('#smart-data-query')) {
        return MicroAppType.SmartDataQuery
    }
    if (document.querySelector('#semantic-governance')) {
        return MicroAppType.SemanticGovernance
    }
    if (document.querySelector('#af-plugin-framework-for-as')) {
        return MicroAppType.AfPluginFramework
    }

    return null
}

/**
 * 判断当前是否在 smartDataFind 微应用中
 */
export const isSmartDataFindApp = (): boolean => {
    return getCurrentMicroAppType() === MicroAppType.SmartDataFind
}

/**
 * 判断当前是否在 semanticGovernance 微应用中
 */
export const isSemanticGovernanceApp = (): boolean => {
    return getCurrentMicroAppType() === MicroAppType.SemanticGovernance
}
