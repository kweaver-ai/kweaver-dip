import { noop } from 'lodash'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { info } from '@/utils/modalHelper'
import __ from '../../locale'

interface ITipModal {
    title?: string
    content?: string
    onOK?: () => void
    microWidgetProps?: any
}

const TipModal = ({
    title = __('提示'),
    content = __('暂未开启权限申请功能，请联系管理员。'),
    onOK = noop,
    microWidgetProps,
}: ITipModal) => {
    if (microWidgetProps?.components?.messageBox) {
        microWidgetProps?.components?.messageBox({
            type: 'info',
            title,
            message: content,
            onOk: () => {
                onOK()
            },
        })
    } else {
        info({
            title: (
                <span style={{ fontWeight: 550, color: '#000' }}>{title}</span>
            ),
            icon: <ExclamationCircleFilled style={{ color: '#126ee3' }} />,
            content,
            onOk: () => {
                onOK?.()
            },
            keyboard: false,
        })
    }
}

export default TipModal
