import { useEffect, useState } from 'react'
import DragBox from '../DragBox'
import InfoSystem from './InfoSystem'
import DataBusiness from './DataBusiness'
import __ from './locale'
import styles from './styles.module.less'
import { databaseTypesEleData } from '@/core/dataSource'
import MultiTypeSelectTree from '../MultiTypeSelectTree'
import { TreeType } from '../MultiTypeSelectTree/const'

const DataSource = () => {
    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])
    const [selectedSysId, setSelectedSysId] = useState<string>('')
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')

    return (
        <div className={styles.modelingWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <div className={styles.title}>{__('组织架构')}</div>
                    <div className={styles.treeBox}>
                        <MultiTypeSelectTree
                            enabledTreeTypes={[TreeType.Department]}
                            onSelectedNode={(val) => {
                                setSelectedDepartmentId(val.nodeId)
                            }}
                            showUnCategorized
                            treePropsConfig={{
                                [TreeType.Department]: {
                                    needUncategorized: false,
                                },
                            }}
                        />
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.coreBusiness}>
                        <DataBusiness
                            selectedSysId={selectedSysId}
                            selectedDepartmentId={selectedDepartmentId}
                        />
                    </div>
                </div>
            </DragBox>
        </div>
    )
}

export default DataSource
