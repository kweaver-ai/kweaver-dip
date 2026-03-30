import { Checkbox } from 'antd'
import classnames from 'classnames'
import { memo, useRef } from 'react'
import { useHover } from 'ahooks'
import DimensionColored from '@/icons/DimensionColored'
import { DragOutlined } from '@/icons'
// import { FormatType } from '../../const'
import { FieldLabel } from '../FieldLabel'
import styles from './styles.module.less'

export interface IFieldItemContent {
    item: any
    checked: boolean
    connected: boolean
    handleCheck?: (isChecked: boolean, item: any) => void
}

/**
 * 事实表字段行内容渲染
 */
const FieldItemContent = ({
    item,
    checked,
    connected,
    handleCheck,
}: IFieldItemContent) => {
    const ref = useRef<HTMLDivElement | null>(null)
    const isHovering = useHover(ref)

    return (
        <div
            ref={ref}
            key={item.id}
            className={classnames({
                [styles['dragable-item']]: true,
                [styles['is-checked']]: !!checked,
                [styles['is-connected']]: !!connected,
            })}
            onClick={() => {
                if (!connected) {
                    handleCheck?.(!checked, item)
                }
            }}
        >
            <span className={styles['dragable-item-drag']}>
                {!connected && (checked || isHovering) && <DragOutlined />}
            </span>
            <span className={styles['dragable-item-check']}>
                {connected ? (
                    <DimensionColored />
                ) : (
                    <Checkbox checked={checked} />
                )}
            </span>
            <div className={styles['dragable-item-title']}>
                <FieldLabel
                    type={item?.data_type}
                    title={item?.business_name}
                />
            </div>
        </div>
    )
}

export default memo(FieldItemContent)
