import { Button, Tooltip } from 'antd'
import __ from '../../locale'
import styles from './styles.module.less'

interface IFooterBar {
    leftText: string
    cancelText?: string
    sureText?: string
    sureTip?: string
    onSure: () => void
    onCancel: () => void
    onUnAuth?: () => void
    disabled: boolean
    leftDisabled: boolean
}

function FooterBar({
    leftText = __('取消全部授权'),
    cancelText = __('取消'),
    sureText = __('确定'),
    sureTip,
    disabled = false,
    leftDisabled = false,
    onSure,
    onCancel,
    onUnAuth,
}: Partial<IFooterBar>) {
    return (
        <div className={styles.footerbar}>
            <div>
                {onUnAuth && (
                    <Button
                        onClick={() => onUnAuth()}
                        type="link"
                        disabled={leftDisabled}
                    >
                        {leftText}
                    </Button>
                )}
            </div>
            <div>
                <Tooltip
                    title={
                        disabled
                            ? __('权限信息未变更，无需${cancelText}本次授权', {
                                  cancelText,
                              })
                            : ''
                    }
                    placement="topRight"
                    overlayStyle={{ maxWidth: 500 }}
                >
                    <Button
                        type="default"
                        onClick={() => onCancel && onCancel()}
                        disabled={disabled}
                    >
                        {cancelText}
                    </Button>
                </Tooltip>
                <Tooltip
                    title={sureTip}
                    placement="topRight"
                    overlayStyle={{ maxWidth: 500 }}
                >
                    <Button
                        type="primary"
                        onClick={() => onSure && onSure()}
                        disabled={disabled}
                    >
                        {sureText}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )
}

export default FooterBar
