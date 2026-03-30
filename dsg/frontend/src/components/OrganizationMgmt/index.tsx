import { useState } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import DragBox from '../DragBox'
import OrgTable from './OrgTable'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'

const OrganizationMgmt = () => {
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [selectedNode, setSelectedNode] = useState<any>({})

    return (
        <div className={styles.organizationMgmtWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <ArchitectureDirTree
                        getSelectedNode={setSelectedNode}
                        filterType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join()}
                        canEmpty={false}
                        // placeholder={__('搜索组织、行政区、部门、处（科）室')}
                        // needUncategorized
                        // unCategorizedKey="00000000-0000-0000-0000-000000000000"
                        // isOrgTreeShowCurDeptOpt={isOrgTreeShowCurDeptOpt}
                    />
                </div>
                <div className={styles.right}>
                    <OrgTable selectedNode={selectedNode} />
                </div>
            </DragBox>
        </div>
    )
}

export default OrganizationMgmt
