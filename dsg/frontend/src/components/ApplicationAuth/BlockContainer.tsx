import { FC, ReactNode, useEffect, useState } from 'react'
import classnames from 'classnames'
import { noop } from 'lodash'
import { CaretDownOutlined } from '@ant-design/icons'
import styles from './styles.module.less'

interface IBlockContainer {
    title: string | ReactNode
    children: ReactNode
    defaultExpand?: boolean
    needExpand?: boolean
    handleExpandStatus?: boolean
    resetHandleExpandStatus?: (status: boolean) => void
}

/**
 * BlockContainer是一个可折叠的区块容器组件，用于展示具有一定结构的内容。
 * 它提供了一个标题栏，用户可以通过点击来展开或收起内容。
 *
 * @param {string} title - 区块的标题，用于标识区块内容。
 * @param {React.ReactNode} children - 区块内的内容，可以是任何React子元素。
 * @param {boolean} defaultExpand - （可选）区块默认是否展开，默认值为true。
 * @returns {JSX.Element} 渲染的组件，包含标题栏和可展开/收起的内容。
 */
const BlockContainer: FC<IBlockContainer> = ({
    title,
    children,
    defaultExpand = true,
    needExpand = true,
    handleExpandStatus = false,
    resetHandleExpandStatus = noop,
}) => {
    // 控制内容的展开状态，初始值由defaultExpand决定。
    const [expand, setExpand] = useState<boolean>(defaultExpand)

    useEffect(() => {
        if (handleExpandStatus) {
            setExpand(true)
            resetHandleExpandStatus(false)
        }
    }, [handleExpandStatus])

    return (
        <div className={styles.blockContainer}>
            <div
                className={styles.titleBar}
                onClick={() => {
                    setExpand(!expand)
                }}
            >
                {/* // 点击事件处理，用于切换内容的展开/收起状态。 */}
                {needExpand && (
                    <div
                        className={classnames(
                            styles.expandBtn,
                            expand ? styles.expanded : styles.unExpand,
                        )}
                    >
                        <CaretDownOutlined />
                    </div>
                )}
                <div className={styles.titleContent}>{title}</div>
            </div>
            {/* // 根据展开状态决定是否显示内容。 */}
            {needExpand ? (
                <div
                    className={classnames(
                        styles.contentWrapper,
                        !expand && styles.contentUnExpanded,
                    )}
                >
                    {children}
                </div>
            ) : null}
        </div>
    )
}

export default BlockContainer
