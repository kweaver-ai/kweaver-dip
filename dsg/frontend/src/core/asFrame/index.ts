import Cookies from 'js-cookie'
import requests from '@/utils/request'

// 加载状态
export const enum FrameStatus {
    // 加载中
    Loading = 'Loading',

    // 正常使用插件
    Normal = 'Normal',

    // 异常
    Error = 'Error',
}

// AS 加载平台
export const enum MicroWidgetPlatformsType {
    // web客户端
    Browser = 'browser',

    // 富客户端
    Electron = 'electron',

    // 未知
    Unknown = 'unknown',
}

// 根据插件command获取AF真实服务地址
export const getUrlByCommand = ({
    microWidgetProps,
    command = 'anyfabric-app',
}) => {
    const afAppInfo = microWidgetProps?.config?.getMicroWidgetByCommand({
        command,
    })
    const reg = /(\w+):\/\/([^/:]+)(:\d*)?/

    return afAppInfo[0]?.entry?.match(reg)[0]
}

// 检查插件是否存在
export const isMicroWidget = ({
    microWidgetProps,
    command = 'anyfabric-app',
}) => {
    return !!(
        microWidgetProps?.config?.getMicroWidgetByCommand({
            command,
        }).length > 0
    )
}

// 获取插件运行平台
export const getMicroWidgetPlatform = ({ microWidgetProps }) => {
    return microWidgetProps?.config?.systemInfo?.platform
}

// 获取有效token
export const getToken = ({ microWidgetProps }) => {
    // 插件中使用sso接口返回的token
    if (isMicroWidget({ microWidgetProps })) {
        return `Bearer ${requests?.default?.accessToken}`
    }
    return `Bearer ${Cookies.get('af.oauth2_token') || ''}`
}

// 获取完整的请求路径
export const getFullRequestPath = ({ microWidgetProps, path }) => {
    if (microWidgetProps?.config) {
        const realIp = getUrlByCommand({ microWidgetProps })
        if (
            getMicroWidgetPlatform({ microWidgetProps }) ===
            MicroWidgetPlatformsType.Electron
        ) {
            return `${realIp}/anyfabric${path}`
        }
        return realIp + path
    }
    return path
}
