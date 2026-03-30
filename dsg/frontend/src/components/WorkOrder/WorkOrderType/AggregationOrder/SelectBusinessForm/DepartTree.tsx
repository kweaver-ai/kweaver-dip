import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import __ from './locale'
import styles from './styles.module.less'
import { SystemCategory } from '@/core'

function DepartTree({ onChange }: any) {
    return (
        <div className={styles.recommendForm}>
            <div className={styles.treeSelectNode}>
                <ResourcesCustomTree
                    onChange={onChange}
                    needUncategorized
                    unCategorizedKey="upgroup"
                    hiddenSwitch
                    defaultCategotyId={SystemCategory.Organization} // 组织架构
                    // isShowAll={false}
                />
            </div>
        </div>
    )
}

export default DepartTree
