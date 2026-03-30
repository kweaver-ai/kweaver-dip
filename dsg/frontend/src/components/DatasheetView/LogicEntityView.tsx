import React, { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import DragBox from '../DragBox'
import __ from './locale'
import DatasheetTable from './DatasheetTable'
import { LogicViewType } from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { AddOutlined } from '@/icons'
import GlossaryDirTree from '../BusinessDomain/GlossaryDirTree'
import { OperateType } from '@/utils'
import { ModuleType } from '../SceneAnalysis/const'
import { BusinessDomainType } from '../BusinessDomain/const'
import DatasheetDetail from './DatasheetDetail'

/**
 * 逻辑实体库表
 */
const LogicEntityView = () => {
    const navigator = useNavigate()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [isTreeEmpty, setIsTreeEmpty] = useState<boolean>(false)
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [selectedNode, setSelectedNode] = useState<any>()

    useEffect(() => {
        setIsEmpty(false)
    }, [selectedNode])

    const isLogicEntity = useMemo(() => {
        if (
            selectedNode?.id &&
            selectedNode?.type === BusinessDomainType.logic_entity
        ) {
            return true
        }
        return false
    }, [selectedNode])

    const handleCreateLogicView = () => {
        const objId = selectedNode?.path_id.split('/').slice(-2)[0]
        navigator(
            `/datasheet-view/graph?operate=${OperateType.CREATE}&module=${ModuleType.LogicEntityView}&objId=${objId}&entityId=${selectedNode.id}`,
        )
    }

    const showEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                <Empty
                    desc={
                        isLogicEntity
                            ? __('暂无数据，可基于当前逻辑实体创建库表')
                            : __(
                                  '暂无数据，可从左侧主题架构树中选中逻辑实体进行库表创建',
                              )
                    }
                    iconSrc={dataEmpty}
                />
                <div className={styles.emptyBtn}>
                    <Button
                        type="primary"
                        onClick={handleCreateLogicView}
                        icon={<AddOutlined />}
                        hidden={!isLogicEntity}
                    >
                        {__('新建库表')}
                    </Button>
                </div>
            </div>
        )
    }

    const showAllEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                <Empty
                    desc={
                        <div style={{ textAlign: 'center' }}>
                            <div>{__('暂无数据')}</div>
                            <div>
                                {__(
                                    '逻辑实体库表必须基于业务对象下的逻辑实体创建，当前未定义业务对象和逻辑实体，无法创建库表',
                                )}
                            </div>
                        </div>
                    }
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    return (
        <div className={styles.logicEntityView}>
            {isTreeEmpty ? (
                showAllEmpty()
            ) : (
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[220, 270]}
                    maxSize={[800, Infinity]}
                    // existPadding={!isLogicEntity}
                    // gutterStyles={{
                    //     width: '8px',
                    // }}
                    // gutterSize={8}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                >
                    <div className={styles['logicEntityView-left']}>
                        <div className={styles['logicEntityView-left-top']}>
                            <span
                                className={
                                    styles['logicEntityView-left-top-title']
                                }
                            >
                                {__('基于逻辑实体开发库表')}
                            </span>
                        </div>
                        <div className={styles['logicEntityView-left-tree']}>
                            <GlossaryDirTree
                                placeholder={__(
                                    '搜索业务对象分组、业务对象、业务对象/活动或逻辑实体',
                                )}
                                getSelectedKeys={setSelectedNode}
                                limitTypes={[BusinessDomainType.logic_entity]}
                                handleLoadOrEmpty={(loadState, emptyState) => {
                                    setIsTreeEmpty(emptyState)
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles['logicEntityView-right']}>
                        {
                            isEmpty ? (
                                showEmpty()
                            ) : (
                                <div
                                    className={
                                        styles['logicEntityView-right-table']
                                    }
                                >
                                    <DatasheetTable
                                        getTableEmptyFlag={(flag) => {
                                            setIsEmpty(flag)
                                        }}
                                        logicType={LogicViewType.LogicEntity}
                                        subDomainData={selectedNode}
                                    />
                                </div>
                            )
                            // isLogicEntity ? (
                            //     <div
                            //         className={
                            //             styles['logicEntityView-right-graph']
                            //         }
                            //     >
                            //         <DatasheetDetail
                            //             id="4f82a489-21de-4e96-bad9-ff0335415c88"
                            //             model="view"
                            //             isCompleted="true"
                            //             logic={LogicViewType.LogicEntity}
                            //         />
                            //     </div>
                            // ) : (
                            //     <div
                            //         className={
                            //             styles['logicEntityView-right-table']
                            //         }
                            //     >
                            //         <DatasheetTable
                            //             getTableEmptyFlag={(flag) => {
                            //                 setIsEmpty(flag)
                            //             }}
                            //             logicType={LogicViewType.LogicEntity}
                            //             subDomainData={selectedNode}
                            //         />
                            //     </div>
                            // )
                        }
                    </div>
                </DragBox>
            )}
        </div>
    )
}

export default LogicEntityView
