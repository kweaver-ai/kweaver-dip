import { ExclamationCircleFilled } from '@ant-design/icons'
import { ModalFuncProps } from 'antd'

import { confirm } from '@/utils/modalHelper'
import __ from './locale'

/**
 * 操作提示 modal
 */
export const PromptModal = ({ ...porps }: ModalFuncProps) => {
    confirm({
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        focusTriggerAfterClose: false, // 取消后不触发按钮聚焦
        okText: __('确定'),
        cancelText: __('取消'),
        keyboard: false,
        ...porps,
    })
}

export const getCurOffset = (page, pageSize = 10) => {
    return ((page || 1) - 1) * pageSize || 1
}
