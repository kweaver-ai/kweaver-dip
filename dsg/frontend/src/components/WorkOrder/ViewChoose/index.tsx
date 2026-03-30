import React, { useEffect, useRef, useState } from 'react'
import { Modal, Tabs } from 'antd'
import classnames from 'classnames'
// import DatasourceTree from '@/components/DatasheetView/DatasourceTree'
import ViewList from './ViewList'
import styles from './styles.module.less'
import DataView from './DataView'
import {
    allNodeInfo,
    DatasourceTreeNode,
    DsType,
    RescCatlgType,
} from '@/components/DatasheetView/const'
import { OrderType } from '../helper'
import DataSourceTree from '@/components/MultiTypeSelectTree/DataSourceTree'
import { DataSourceRadioType } from '@/components/MultiTypeSelectTree/const'
import { DataSourceOrigin } from '@/components/DataSource/helper'

const ViewChoose = ({ open, bindItems, onClose, onSure, orderType }: any) => {
    const datasourceTreeRef = useRef<any>(null)
    const [checkedItems, setCheckedItems] = useState<any[]>([])
    const [selectedNode, setSelectedNode] = useState<any>({
        name: '全部',
        id: '',
    })
    const [auditType, setAuditType] = useState<string>(
        orderType === OrderType.QUALITY_EXAMINE ? 'unAudit' : '',
    )
    const [condition, setCondition] = useState<any>()

    const getDatasourceSearchParams = (id?: string) => {
        // // 后端datasource_id和datasource_type二选一，有id则不使用type
        // const datasource_type =
        //     !selectedNode?.id || selectedNode?.id !== selectedNode.type || id
        //         ? undefined
        //         : selectedNode.type
        // const datasource_id =
        //     datasource_type || !selectedNode?.id
        //         ? undefined
        //         : selectedNode.dataSourceId || id || selectedNode?.id
        // const excel_file_name =
        //     selectedNode?.dataType === 'file' ? selectedNode?.title : undefined

        // return {
        //     datasource_type,
        //     datasource_id,
        //     excel_file_name,
        // }
        const nodeId =
            selectedNode?.dataType === 'file'
                ? selectedNode.dataSourceId
                : selectedNode.id
        if (!selectedNode || !nodeId) {
            return {
                department_id: undefined,
                info_system_id: undefined,
                datasource_source_type: undefined,
                datasource_type: undefined,
                datasource_id: undefined,
            }
        }
        if (selectedNode.type === 'source_type') {
            return {
                department_id: undefined,
                info_system_id: undefined,
                datasource_type: undefined,
                datasource_source_type: nodeId,
                datasource_id: undefined,
            }
        }
        if (selectedNode.type === 'dsType') {
            return {
                department_id: undefined,
                info_system_id: undefined,
                datasource_source_type: selectedNode.dataSourceType,
                datasource_type: nodeId,
                datasource_id: undefined,
            }
        }
        if (selectedNode.type === 'excel' && selectedNode.dataType === 'file') {
            return {
                department_id: undefined,
                info_system_id: undefined,
                datasource_source_type: undefined,
                datasource_type: undefined,
                datasource_id: nodeId,
                excel_file_name: selectedNode.name,
            }
        }
        return {
            department_id: undefined,
            info_system_id: undefined,
            datasource_source_type: undefined,
            datasource_type: undefined,
            datasource_id: nodeId,
        }
    }

    useEffect(() => {
        if (selectedNode || auditType) {
            const obj: any = {
                ...getDatasourceSearchParams(),
            }
            if (auditType) {
                obj.is_audited = auditType === 'audit'
            }
            setCondition({
                ...condition,
                ...obj,
            })
        }
    }, [selectedNode, auditType])

    const handleOk = async () => {
        onSure(checkedItems)
    }

    // 获取选中的节点
    const getSelectedNode = (sn?: DatasourceTreeNode, type?: RescCatlgType) => {
        const snType =
            sn?.id === ''
                ? DsType.all
                : sn?.id === sn?.type
                ? DsType.datasourceType
                : DsType.datasource

        setSelectedNode(sn || allNodeInfo)
    }

    const handleCheck = (isCheck: boolean, item) => {
        if (isCheck) {
            setCheckedItems((prev) => [...(prev ?? []), item])
        } else {
            setCheckedItems((prev) => prev?.filter((o) => o?.id !== item?.id))
        }
    }

    const handleRemove = (items) => {
        const ids = items?.map((o) => o?.id)
        setCheckedItems((prev) => prev?.filter((o) => !ids?.includes(o?.id)))
    }

    return (
        <Modal
            title="选择库表"
            width={800}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: !checkedItems?.length,
            }}
            bodyStyle={{ height: 484, padding: '16px 24px' }}
            className={styles.viewChooseModal}
        >
            {orderType === OrderType.QUALITY_EXAMINE && (
                <Tabs
                    size="small"
                    items={[
                        { label: '待检测', key: 'unAudit' },
                        { label: '已检测', key: 'audit' },
                    ]}
                    activeKey={auditType}
                    onChange={(key) => {
                        setAuditType(key)
                    }}
                    className={styles.tabs}
                />
            )}
            <div
                className={classnames(styles['view-choose'], {
                    [styles['view-choose-quality']]:
                        orderType === OrderType.QUALITY_EXAMINE,
                })}
            >
                <div>
                    <div className={styles['box-datasource']}>
                        <div className={styles['box-title']}>数据源</div>
                        <DataSourceTree
                            dataSourceTreeType={DataSourceRadioType.ByType}
                            key={auditType}
                            setSelectedNode={getSelectedNode}
                            selectedNode={selectedNode}
                            filterDataSourceTypes={[
                                DataSourceOrigin.DATASANDBOX,
                            ]}
                        />
                    </div>
                </div>
                <div>
                    <div className={styles['box-dataview']}>
                        <div className={styles['box-title']}>库表</div>
                        <DataView
                            condition={condition}
                            bindItems={bindItems}
                            checkedItems={checkedItems}
                            onCheck={handleCheck}
                        />
                    </div>
                    <div className={styles['box-viewlist']}>
                        <ViewList data={checkedItems} onDelete={handleRemove} />
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ViewChoose
