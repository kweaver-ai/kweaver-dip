import { ExclamationCircleFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import { confirm } from '@/utils/modalHelper'
import __ from './locale'

interface IReturnConfirmModal {
    title?: string
    content?: string
    okText?: string
    cancelText?: string
    onOK?: () => void
    onCancel?: () => void
    // 集成AS时候传入
    microWidgetProps?: any
}

const ReturnConfirmModal = ({
    title = __('确定要离开此页吗？'),
    content = __(
        '若当前页面有变更，离开此页将放弃当前更改的内容，请确认操作。',
    ),
    okText = __('留在此页'),
    cancelText = __('离开此页'),
    onOK = noop,
    onCancel = noop,
    microWidgetProps,
}: IReturnConfirmModal) => {
    if (microWidgetProps?.components?.messageBox) {
        microWidgetProps?.components?.messageBox({
            type: 'confirm',
            title,
            message: content,
            cancelText,
            okText,
            onOk: () => {
                onOK()
            },
            onCancel: () => {
                onCancel()
            },
        })
    } else {
        confirm({
            title: (
                <span style={{ fontWeight: 550, color: '#000' }}>{title}</span>
            ),
            icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
            focusTriggerAfterClose: false, // 取消后不触发按钮聚焦
            content,
            okText,
            cancelText,
            onOk: () => {
                onOK()
            },
            onCancel: () => {
                onCancel()
            },
            keyboard: false,
        })
    }
}

export default ReturnConfirmModal
