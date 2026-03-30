import React, { useEffect, useRef, useState } from 'react'
import ResourcesDirTree from '../ResourcesDir/ResourcesDirTree'
import {
    Architecture,
    CatlgTreeNode,
    RescCatlgType,
    allNodeInfo,
} from '../ResourcesDir/const'
import styles from './styles.module.less'
import DragBox from '../DragBox'
import __ from './locale'
import DataUndsListContent from './DataUndsListContent'
import { DirTreeProvider } from '@/context/DirTreeProvider'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'

const DataCatalogUnderstanding = () => {
    const ref: any = useRef()
    // 左右分屏大小
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [activeTabKey, setActiveTabKey] = useState<string>()
    // 选中节点
    const [selectedNode, setSelectedNode] = useState<CatlgTreeNode>({
        name: '全部',
        id: '',
        path: '',
        type: Architecture.ALL,
    })

    useEffect(() => {
        setSelectedNode(allNodeInfo)
    }, [])

    // 获取选中的节点
    const getSelectedNode = (sn?: CatlgTreeNode, type?: RescCatlgType) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setSelectedNode(sn || allNodeInfo)
    }

    return (
        <div className={styles.dataCatalogUnderstandingWrap}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    {/* <ResourcesDirTree
                        getCurTabKey={(tk) => setActiveTabKey(tk)}
                        getSelectedNode={getSelectedNode}
                        selectOptions={[
                            {
                                value: RescCatlgType.ORGSTRUC,
                                label: __('组织架构'),
                            },
                        ]}
                        initNodeType={[
                            Architecture.ORGANIZATION,
                            Architecture.DEPARTMENT,
                        ].join()}
                        ref={ref}
                    /> */}

                    <div className={styles.title}>{__('组织架构')}</div>
                    <div className={styles.leftTreeWrapper}>
                        <ArchitectureDirTree
                            getSelectedNode={getSelectedNode}
                            filterType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                            ref={ref}
                        />
                    </div>
                </div>
                <div className={styles.right}>
                    <DataUndsListContent
                        activeTabKey={RescCatlgType.ORGSTRUC}
                        selectedNode={selectedNode}
                    />
                </div>
            </DragBox>
        </div>
    )
}

export default DataCatalogUnderstanding
