import { FC, useRef, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import BusinessDomainTree from './BusinessDomainTree'
import ProcessTree from './ProcessTree'

interface TreeSelectContainerProps {
    value?: string
    onSelect: (value: string) => void
}

/**
 * 树形选择组件
 * @param param0
 * @returns
 */
const TreeSelectContainer: FC<TreeSelectContainerProps> = ({
    value,
    onSelect,
}) => {
    // 左侧业务域树组件ref
    const ref = useRef<any>(null)
    // 左侧已选中的业务域id
    const [selectedLeftNodeId, setSelectedNodeId] = useState<string>('')
    return (
        <div className={styles.treeSelectContainer}>
            <div className={styles.boxWrapper}>
                <BusinessDomainTree
                    value={selectedLeftNodeId}
                    onSelect={(leftId) => {
                        setSelectedNodeId(leftId)
                    }}
                    ref={ref}
                />
            </div>
            {ref?.current?.isEmpty ? null : (
                <>
                    <div className={styles.splitLine} />
                    <div className={styles.boxWrapper}>
                        <ProcessTree
                            onSelect={onSelect}
                            value={value}
                            parentId={selectedLeftNodeId}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

export default TreeSelectContainer
