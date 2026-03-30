import { LeftOutlined } from '@ant-design/icons'
import { Divider } from 'antd'
import classnames from 'classnames'
import { memo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { AssetStateTip, ResIcon } from '../../helper'
import __ from '../../locale'
import styles from './styles.module.less'
import { AssetTypeEnum } from '@/core'
import { useStatusContext } from '../AccessManage/StatusProvider'
import { MicroWidgetPropsContext } from '@/context'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'

interface ITopBar {
    node: any
    title?: string
    type?: AssetTypeEnum
    indicatorType?: string
    isChange?: boolean
    onClose?: () => void
    ownerName: string
}

function TopBar(props: ITopBar) {
    const { title, node, type, isChange, onClose, indicatorType, ownerName } =
        props
    const navigator = useNavigate()
    const { viewChange } = useStatusContext()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // 返回
    const handleReturn = () => {
        if (isChange || (type === AssetTypeEnum.DataView && viewChange)) {
            ReturnConfirmModal({
                content: __('离开此页将放弃本次更改的内容，请确认操作。'),
                onCancel: () => {
                    if (onClose) {
                        onClose()
                    } else {
                        navigator(-1)
                    }
                },
                microWidgetProps,
            })
        } else if (onClose) {
            onClose()
        } else {
            navigator(-1)
        }
    }

    return (
        <div className={styles.topbar}>
            <div className={styles['topbar-left']}>
                <div onClick={handleReturn} className={styles.back}>
                    <LeftOutlined className={styles['back-icon']} />
                    <span className={styles['back-text']}>{__('返回')}</span>
                </div>
                <Divider className={styles.divider} type="vertical" />
                <div className={styles.info}>
                    <span>{title || __('授权')}</span>
                    <div className={styles['info-icon']}>
                        {indicatorType ? (
                            <IndicatorIcons
                                type={indicatorType}
                                fontSize={32}
                            />
                        ) : (
                            type && ResIcon?.[type]
                        )}
                    </div>
                    <div className={styles['info-title']}>
                        <div title={node?.object_name}>{node?.object_name}</div>
                        {/* <div className={styles.ownerName}>
                            <span>{__('数据Owner：')}</span>
                            <span
                                title={ownerName}
                                style={{
                                    marginRight: 16,
                                }}
                            >
                                {ownerName || __('暂未分配')}
                            </span>
                            {type === AssetTypeEnum.Api &&
                                __('说明： 接口只能给集成应用授权')}
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(TopBar)
