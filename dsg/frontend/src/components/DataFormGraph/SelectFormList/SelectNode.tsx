import { Tooltip } from 'antd'
import { FC, ReactNode, useRef, useState } from 'react'
import { noop } from 'lodash'
import classnames from 'classnames'
import { BusinessFormOutlined, DragOutlined } from '@/icons'
import { useSelectedDataContext } from './SelectedDataContext'
import styles from './styles.module.less'
import __ from '../locale'
import { formatError } from '@/core'

interface SelectedNodeProps {
    info: any
    onViewForm?: (fid: string) => void
    bottomEle?: ReactNode
    className?: string
}
const SelectNode: FC<SelectedNodeProps> = ({
    info,
    onViewForm = noop,
    bottomEle,
    className,
}) => {
    const {
        onStartDrag,
        allOriginNodes,
        dragLoading,
        setDragLoading,
        activeTab,
    } = useSelectedDataContext()
    // 鼠标悬浮
    const [isHover, setIsHover] = useState<boolean>(false)

    const timeoutIdRef = useRef<number | null>(null)

    /**
     * handleMouseUp
     * 点击表名字，弹窗显示表格详情
     */

    const handleMouseUp = (recommendForm) => {
        return async () => {
            try {
                if (timeoutIdRef.current !== null) {
                    clearTimeout(timeoutIdRef.current)
                }
                onViewForm(recommendForm.id)
            } catch (ex) {
                formatError(ex)
            }
        }
    }

    /**
     *
     * 业务表鼠标拖拽事件
     */
    const handleMouseDown = (recommendForm) => {
        return (event) => {
            async function doMouseDown() {
                if (
                    !allOriginNodes.find(
                        (originNode) =>
                            originNode.data.fid === recommendForm.id,
                    ) &&
                    !dragLoading
                ) {
                    setDragLoading(true)
                    await onStartDrag(
                        event,
                        recommendForm.business_model_id || '',
                        recommendForm.id,
                        activeTab,
                    )
                    setDragLoading(false)
                }
            }
            timeoutIdRef.current = window.setTimeout(doMouseDown, 300)
        }
    }
    return (
        <Tooltip
            title={
                allOriginNodes.find(
                    (originNode) => originNode.data.fid === info.id,
                )
                    ? __('此表已置入')
                    : ''
            }
            placement="right"
        >
            <div
                data-id={info.id}
                onMouseDown={handleMouseDown(info)}
                onMouseUp={handleMouseUp(info)}
                className={classnames(
                    styles.recommendFormItem,
                    styles.recommendFormItemTree,
                    allOriginNodes.find(
                        (originNode) => originNode.data.fid === info.id,
                    ) && styles.recommendFormDisabled,
                    className,
                )}
                style={{
                    height: bottomEle ? '60px' : '36px',
                }}
                onFocus={() => 0}
                onBlur={() => 0}
                onMouseOver={() => {
                    setIsHover(true)
                }}
                onMouseLeave={() => {
                    setIsHover(false)
                }}
            >
                <div className={styles.textContext}>
                    <div
                        className={styles.recommendFormTreeName}
                        title={info.name}
                    >
                        <BusinessFormOutlined className={styles.icon} />
                        <div className={styles.recommendFormItemName}>
                            {info.name}
                        </div>
                    </div>
                    {bottomEle}
                </div>
                {!allOriginNodes.find(
                    (originNode) => originNode.data.fid === info.id,
                ) &&
                    isHover && (
                        <DragOutlined className={styles.dragTreeButton} />
                    )}
            </div>
        </Tooltip>
    )
}

export default SelectNode
