import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Radio, Tabs } from 'antd'
import classnames from 'classnames'
// import DatasourceTree from '@/components/DatasheetView/DatasourceTree'
import styles from './styles.module.less'
import DataView from './DataView'
import {
    allNodeInfo,
    DataSourceRadioTypeList,
    DatasourceTreeNode,
    DsType,
    RescCatlgType,
} from '@/components/DatasheetView/const'
import { OrderType } from '../helper'
import { DataSourceRadioType } from './DatasourceAndViewSelect/const'
import { DataSourceOrigin } from '@/components/DataSource/helper'
import DatasourceAndViewSelect from './DatasourceAndViewSelect'

/**
 * 添加库表  可选择整个数据源
 */
const ViewDataChoose = ({ open, bindData, onClose, onSure }: any) => {
    // 数据源树类型
    const [dataSourceRadio, setDataSourceRadio] = useState<DataSourceRadioType>(
        DataSourceRadioType.BySource,
    )

    const [condition, setCondition] = useState<any>()
    const [selectedNode, setSelectedNode] = useState<any>()
    // 添加树勾选状态管理
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    const [halfCheckedKeys, setHalfCheckedKeys] = useState<string[]>([])

    // 包含数据源与表信息
    const [dsAndViews, setDsAndViews] = useState<any[]>([])
    const [allCheckViews, setAllCheckViews] = useState<any[]>([])
    const getDatasourceSearchParams = (id?: string) => {
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
        const cks = (bindData || [])
            .filter((o) => !o?.form_view_ids?.length)
            .map((o) => o.datasource_id)
        const hcks = (bindData || [])
            .filter((o) => !!o?.form_view_ids?.length)
            .map((o) => o.datasource_id)
        setCheckedKeys(cks)
        setHalfCheckedKeys(hcks)
        setDsAndViews(bindData)
    }, [bindData])

    const curCheckItems = useMemo(() => {
        const isHalfCheck = halfCheckedKeys?.includes(selectedNode?.id)
        let ret = []
        // 半选状态装载绑定视图
        if (isHalfCheck) {
            const it = dsAndViews?.find(
                (o) => o.datasource_id === selectedNode?.id,
            )
            // 存在获取viewIds
            ret = it?.form_view_ids || []
        }
        return ret
    }, [selectedNode, halfCheckedKeys, dsAndViews])

    useEffect(() => {
        if (selectedNode) {
            // || auditType
            const obj: any = {
                ...getDatasourceSearchParams(),
            }
            // if (auditType) {
            //     obj.is_audited = auditType === 'audit'
            // }
            setCondition((prev) => ({
                ...prev,
                ...obj,
            }))
        }
    }, [selectedNode]) // auditType

    const handleOk = async () => {
        onSure(dsAndViews, allCheckViews)
    }

    // 获取选中的节点
    const getSelectedNode = (sn?: DatasourceTreeNode) => {
        setSelectedNode(sn || allNodeInfo)
    }

    const handleCheck = (isCheck: boolean, item, total) => {
        const hasCheckedDataSource = dsAndViews?.find(
            (o) => o?.datasource_id === selectedNode?.id,
        )

        setDsAndViews((prev) => {
            const newDsAndViews = hasCheckedDataSource
                ? prev
                      .map((o) => {
                          if (o?.datasource_id === selectedNode?.id) {
                              const currentFormViewIds = o?.form_view_ids || []
                              const newFormViewIds = isCheck
                                  ? [...currentFormViewIds, item?.id]
                                  : currentFormViewIds.filter(
                                        (id) => id !== item?.id,
                                    )

                              return !isCheck && !newFormViewIds?.length
                                  ? undefined
                                  : {
                                        ...o,
                                        form_view_ids: newFormViewIds,
                                    }
                          }
                          return o
                      })
                      .filter(Boolean)
                : [
                      ...(prev || []),
                      {
                          datasource_id: selectedNode?.id,
                          datasource_name: selectedNode?.name,
                          datasource_type: selectedNode?.type,
                          is_audited: undefined,
                          form_view_ids: [item?.id],
                      },
                  ]

            // 获取更新后的数据源信息来计算isCheckAll
            const updatedDataSource = newDsAndViews?.find(
                (o) => o?.datasource_id === selectedNode?.id,
            )
            const checkedCount = updatedDataSource?.form_view_ids?.length || 0
            const isCheckAll = checkedCount === total

            let finalDsAndViews = newDsAndViews

            // 基于计算结果更新checkedKeys和halfCheckedKeys
            if (isCheckAll) {
                // 全选状态：移除半选状态，添加到全选状态，清空form_view_ids
                setHalfCheckedKeys((prevHalfKeys) =>
                    (prevHalfKeys || []).filter((o) => o !== selectedNode?.id),
                )
                if (!checkedKeys?.includes(selectedNode?.id)) {
                    setCheckedKeys((prevCheckedKeys) => [
                        ...(prevCheckedKeys || []),
                        selectedNode?.id,
                    ])
                }
                // 清空form_view_ids表示全选
                finalDsAndViews = newDsAndViews.map((o) => {
                    if (o?.datasource_id === selectedNode?.id) {
                        return {
                            ...o,
                            form_view_ids: [],
                        }
                    }
                    return o
                })
            } else if (checkedCount > 0) {
                // 部分选中状态：添加到半选状态，从全选状态移除
                if (checkedKeys?.includes(selectedNode?.id)) {
                    setCheckedKeys((prevCheckedKeys) =>
                        (prevCheckedKeys || []).filter(
                            (o) => o !== selectedNode?.id,
                        ),
                    )
                }
                if (!halfCheckedKeys?.includes(selectedNode?.id)) {
                    setHalfCheckedKeys((prevHalfKeys) => [
                        ...(prevHalfKeys || []),
                        selectedNode?.id,
                    ])
                }
            } else {
                // 完全取消勾选状态：从半选状态和全选状态都移除
                setHalfCheckedKeys((prevHalfKeys) =>
                    (prevHalfKeys || []).filter((o) => o !== selectedNode?.id),
                )
                setCheckedKeys((prevCheckedKeys) =>
                    (prevCheckedKeys || []).filter(
                        (o) => o !== selectedNode?.id,
                    ),
                )
            }

            return finalDsAndViews
        })
    }
    // 处理树的勾选变化
    const handleTreeCheckChange = (
        keys: {
            checked: string[]
            halfChecked: string[]
        },
        nodes: {
            checkedNodes: any[]
            halfCheckedNodes: any[]
        },
    ) => {
        setCheckedKeys(keys?.checked)
        setHalfCheckedKeys(keys?.halfChecked)

        const ids = dsAndViews?.map((o) => o?.datasource_id)

        const ckNodes = [
            ...(nodes?.checkedNodes || []),
            ...(nodes?.halfCheckedNodes || []),
        ].map((o) => ({
            datasource_id: o?.id,
            datasource_name: o?.name,
            datasource_type: o?.type,
            is_audited: undefined, // 目前默认不带状态
            form_view_ids:
                ids?.includes(o?.id) && keys?.halfChecked?.includes(o?.id)
                    ? dsAndViews?.find((d) => d?.datasource_id === o?.id)
                          ?.form_view_ids || []
                    : [],
        }))
        setDsAndViews(ckNodes)
    }

    return (
        <Modal
            title="添加库表"
            width={800}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: !dsAndViews?.length,
            }}
            bodyStyle={{ height: 482, padding: '0' }}
            className={styles.viewDataChooseModal}
        >
            <div className={classnames(styles['view-data-choose'])}>
                <div>
                    <div className={styles['box-datasource']}>
                        <div className={styles['box-top']}>
                            <div className={styles.title}>数据源</div>
                            <div className={styles.type}>
                                <Radio.Group
                                    value={dataSourceRadio}
                                    onChange={(e) =>
                                        setDataSourceRadio(e.target.value)
                                    }
                                    size="small"
                                >
                                    {DataSourceRadioTypeList.map((item) => (
                                        <Radio.Button
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </Radio.Button>
                                    ))}
                                </Radio.Group>
                            </div>
                        </div>
                        <DatasourceAndViewSelect
                            dataSourceTreeType={dataSourceRadio}
                            setSelectedNode={getSelectedNode}
                            selectedNode={selectedNode}
                            filterDataSourceTypes={[
                                DataSourceOrigin.DATASANDBOX,
                            ]}
                            checkedKeys={checkedKeys}
                            halfCheckedKeys={halfCheckedKeys}
                            onCheckChange={handleTreeCheckChange}
                        />
                    </div>
                </div>
                <div>
                    <div className={styles['box-dataview']}>
                        <DataView
                            condition={condition}
                            checkedAll={checkedKeys?.includes(selectedNode?.id)} // 当前选中项左侧为全选状态 右侧视图默认全勾选且不可操作
                            checkedItems={curCheckItems}
                            onCheck={handleCheck}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ViewDataChoose
