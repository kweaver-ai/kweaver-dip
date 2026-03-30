import { message } from 'antd'
import { ErrorCode, getErrorCodeMessage } from './errCode'
import { getHttpStatusMessage, HTTPStatus } from './httpStatus'
import { IFormatError, IGetErrorMessage } from './types'
import __ from './locale'
import { messageError } from '../messages'

// 变量正则方法
const VariableReg = /(?<=\[)(.+?)(?=\])/g

/**
 * 根据错误获取提示语
 * @param code 错误码
 * @param dic 变量字典
 */
const getMessageByError = (error: Record<string, any>) => {
    const code = error?.data?.code
    if (!code) return undefined
    const description = getErrorCodeMessage()[code]
    if (!description) return undefined
    // 不含变量
    if (!description.includes('${')) return description

    // 例： {name:'阶段一'}
    const dic = error?.data?.detail
    if (!dic || !Object.keys(dic).length) return description

    return __(description, dic)
}

export const getErrorMessage = ({ error }: IGetErrorMessage): string => {
    if (error?.status === HTTPStatus.Forbidden) {
        return getHttpStatusMessage()?.[error?.status]
    }
    // 虚拟化引擎特殊处理
    if (error?.data?.code?.includes('VirtualizationEngine')) {
        return (
            getMessageByError(error) ||
            error?.data?.detail ||
            error?.data?.description ||
            __('未知错误码')
        )
    }
    if (
        error?.status >= HTTPStatus.InternalServerError &&
        error?.status <= HTTPStatus.NetworkAuthenticationRequired
    ) {
        return (
            error?.data?.description ||
            getHttpStatusMessage()[error?.status] ||
            error?.statusText
        )
    }

    if (error?.data?.code === 'session.logout.GetCookieValueNotExist') {
        return ''
    }

    if (error?.data?.code) {
        return (
            getMessageByError(error) ||
            error?.data?.description ||
            __('未知错误码')
        )
    }
    if (
        error?.data?.description &&
        error?.data?.description?.indexOf('err.timeout') > -1
    ) {
        return __('请求超时')
    }
    return error?.data?.description || __('未知错误码')
}

// 根据后端返回的错误码提示错误信息
export const formatError = (error: any, toast?: any, config?: any): any => {
    if (!navigator.onLine) {
        return toast
            ? toast?.warning(__('无法连接网络'))
            : message.warning(__('无法连接网络'))
    }

    if (error?.status === HTTPStatus.Unauthorized) {
        return null
    }
    if (error?.data?.code === ErrorCode.MissingUserToken) {
        return null
    }
    if (error?.data?.code === 'ERR_CANCELED') {
        return null
    }

    // 没有错误主体则返回
    if (!error) return null

    return toast
        ? toast?.error(getErrorMessage({ error }))
        : messageError(getErrorMessage({ error }))
}
// 直接显示后端返回的错误详情
// export const formatError = (error: any): any => {
//     if (error.status === HTTPStatus.Unauthorized) {
//         return null
//     }

//     if (error?.data?.code === ErrorCode.MissingUserToken) {
//         return null
//     }

//     if (
//         error.status >= HTTPStatus.InternalServerError &&
//         error.status <= HTTPStatus.NetworkAuthenticationRequired
//     ) {
//         return messageError(
//             getHttpStatusMessage()[error.status] || error.statusText,
//         )
//     }

//     return messageError(error?.data?.description)
// }

// 自定义提示弹窗
export const getMsgToast = (msgApi: any, newClassName?: string) => {
    return {
        error: (msg) => {
            msgApi.open?.({
                type: 'error',
                content: msg,
                className: newClassName,
            })
        },
        success: (msg) => {
            msgApi.open?.({
                type: 'success',
                content: msg,
                className: newClassName,
            })
        },
    }
}
