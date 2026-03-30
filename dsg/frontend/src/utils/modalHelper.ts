import { Modal } from 'antd'
import type { ModalFuncProps } from 'antd/lib/modal'
import { getPopupContainer } from './microApp'

const { destroyAll } = Modal

/**
 * Modal.confirm - 确认对话框
 * 自动设置正确的挂载容器以支持微应用模式
 */
export const confirm = (props: ModalFuncProps) => {
    return Modal.confirm({
        ...props,
        getContainer: getPopupContainer() as any,
    })
}

/**
 * Modal.info - 信息提示框
 * 自动设置正确的挂载容器以支持微应用模式
 */
export const info = (props: ModalFuncProps) => {
    return Modal.info({
        ...props,
        getContainer: getPopupContainer() as any,
    })
}

/**
 * Modal.success - 成功提示框
 * 自动设置正确的挂载容器以支持微应用模式
 */
export const success = (props: ModalFuncProps) => {
    return Modal.success({
        ...props,
        getContainer: getPopupContainer() as any,
    })
}

/**
 * Modal.error - 错误提示框
 * 自动设置正确的挂载容器以支持微应用模式
 */
export const error = (props: ModalFuncProps) => {
    return Modal.error({
        ...props,
        getContainer: getPopupContainer() as any,
    })
}

/**
 * Modal.warning - 警告提示框
 * 自动设置正确的挂载容器以支持微应用模式
 */
export const warning = (props: ModalFuncProps) => {
    return Modal.warning({
        ...props,
        getContainer: getPopupContainer() as any,
    })
}

/**
 * Modal.destroyAll - 关闭所有对话框
 */
export { destroyAll }

// 导出原始Modal对象,用于特殊情况
export { Modal }
