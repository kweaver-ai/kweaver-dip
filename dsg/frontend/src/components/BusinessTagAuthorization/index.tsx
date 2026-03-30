import { useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import DragBox from '../DragBox'
import TagAuthTable from './TagAuthTable'
import TagTree from './TagTree'

const BusinessTagAuthorization = () => {
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [selectedNode, setSelectedNode] = useState<any>({})

    return (
        <div className={styles.tagAuthorizationWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <TagTree onNodeClick={(o) => setSelectedNode(o)} />
                </div>
                <div className={styles.right}>
                    <TagAuthTable selectedTagClassify={selectedNode} />
                </div>
            </DragBox>
        </div>
    )
}

export default BusinessTagAuthorization
