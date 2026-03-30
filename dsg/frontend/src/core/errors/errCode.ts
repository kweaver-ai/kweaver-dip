import { IErrorCodeMessage } from './types'
import __ from './locale'
import ServiceCodeMessage from './serviceCode'

export const ErrorCode = {
    // 超时
    TimeOut: 1,

    // 服务器错误
    InternalServerError: 500,

    // 未携带用户token
    MissingUserToken: 'TaskCenter.Common.MissingUserToken',

    // 表单不存在
    FormNotExist: 'BusinessGrooming.Form.FormNotExist',

    // 选中的对象被删除
    ParentObjectNotFound:
        'ConfigurationCenter.BusinessStructure.ParentObjectNotFound',

    // 源节点被删除
    ObjectNotFound: 'ConfigurationCenter.BusinessStructure.ObjectNotFound',
}

export const getErrorCodeMessage = (): IErrorCodeMessage => ({
    ...ServiceCodeMessage,
    [ErrorCode.TimeOut]: __('请求超时'),
    [ErrorCode.InternalServerError]: __('服务器内部错误'),
    [ErrorCode.FormNotExist]: __('该表单被删除，可重新选择'),
    [ErrorCode.ParentObjectNotFound]: __('目标位置路径已不存在，请重新选择。'),
    [ErrorCode.ObjectNotFound]: __('当前位置路径已不存在，请重新选择。 '),
})
