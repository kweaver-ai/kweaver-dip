import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import classnames from 'classnames'
import DragBox from '@/components/DragBox'
import AccessManage from './components/AccessManage'
import AccessTree from './components/AccessTree'
import AssetContent from './components/AssetContent'
import styles from './styles.module.less'

function AccessPolicy() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [dragSize, setDragSize] = useState<number[]>([12, 88])

    const id = searchParams.get('id')
    const indicatorType = searchParams.get('indicatorType')
    const type = searchParams.get('type')
    const isDetail = searchParams.get('detail')
    // 左侧选中节点
    const [node, setNode] = useState<any>()

    return (
        <div className={styles['assetAccess-container']}>
            <DragBox
                defaultSize={dragSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDragSize(size)
                }}
            >
                {/* 授权树 */}
                <AccessTree onSelect={setNode} />
                {/* 资源内容 */}
                <AssetContent currentNode={node} activeType={type} />
            </DragBox>
            {id && (
                <div
                    className={classnames({
                        [styles['pop-manage']]: true,
                        [styles['is-detail']]: isDetail,
                    })}
                >
                    <AccessManage
                        id={id}
                        type={type as any}
                        indicatorType={indicatorType || undefined}
                    />
                </div>
            )}
        </div>
    )
}

export default AccessPolicy
