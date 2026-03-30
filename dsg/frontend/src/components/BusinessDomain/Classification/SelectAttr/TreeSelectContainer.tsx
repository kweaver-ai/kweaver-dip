import { FC, useRef, useState } from 'react'
import styles from './styles.module.less'
import GlossaryDirTree from '../../GlossaryDirTree'
import { BusinessDomainType } from '../../const'
import { ISubjectDomainItem } from '@/core'
import AttrList from './AttrList'

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
                <GlossaryDirTree
                    getSelectedKeys={(so: ISubjectDomainItem) => {
                        setSelectedNodeId(so.id)
                    }}
                    isShowSearch={false}
                    filterType={[
                        BusinessDomainType.subject_domain_group,
                        BusinessDomainType.subject_domain,
                        BusinessDomainType.business_object,
                        BusinessDomainType.business_activity,
                        BusinessDomainType.logic_entity,
                    ]}
                    limitTypes={[BusinessDomainType.logic_entity]}
                />
            </div>
            {ref?.current?.isEmpty ? null : (
                <>
                    <div className={styles.splitLine} />
                    <div className={styles.boxWrapper}>
                        <AttrList
                            parentId={selectedLeftNodeId}
                            onSelect={onSelect}
                            value={value}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

export default TreeSelectContainer
