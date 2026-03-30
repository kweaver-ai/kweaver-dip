import { Button, Modal, ModalProps, Select, Tooltip } from 'antd'
import React, { memo, useEffect, useMemo, useState } from 'react'
import Icon, { InfoCircleFilled } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'
import { ViewType, viewOptionList } from './helper'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import GlossaryDirTree from '@/components/BusinessDomain/GlossaryDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { UNGROUPED } from '@/components/BusiArchitecture/const'
import DatasourceTree from '@/components/DatasheetView/DatasourceTree'
import LogicalViewList from './LogicalViewList'
import { DsType } from '@/components/DatasheetView/const'
import { BusinessDomainType } from '@/components/BusinessDomain/const'

interface IChooseLogicalView extends ModalProps {
    open: boolean
    checkedId?: string
    onClose: () => void
    onSure: (info) => void
}
/**
 * 库表选择窗
 */
const ChooseLogicalView: React.FC<IChooseLogicalView> = ({
    open,
    checkedId,
    onClose,
    onSure,
    ...props
}) => {
    const [checkedItem, setCheckedItem] = useState<any>()
    const [viewKey, setViewKey] = useState<ViewType>(ViewType.SubjectDomain)
    const [selectedNode, setSelectedNode] = useState<any>()
    const [dataType, setDataType] = useState<DsType>()

    useEffect(() => {
        if (checkedId && open) {
            setCheckedItem({ id: checkedId })
        } else {
            setCheckedItem(undefined)
        }
    }, [open])

    const condition = useMemo(() => {
        if (!selectedNode) return undefined
        setDataType(undefined)
        switch (viewKey) {
            case ViewType.Organization:
                if (selectedNode?.id === 'ungrouped') {
                    return undefined
                }
                return { department_id: selectedNode?.id }
            case ViewType.SubjectDomain:
                if (selectedNode?.parent_id === '') {
                    return undefined
                }
                return {
                    subject_id: selectedNode?.id,
                    include_sub_subject: true,
                }
            case ViewType.DataSource:
                setDataType(
                    selectedNode?.id === ''
                        ? DsType.all
                        : selectedNode?.id === selectedNode?.type
                        ? DsType.datasourceType
                        : DsType.datasource,
                )
                if (selectedNode?.id === '') {
                    return undefined
                }
                if (selectedNode?.id === selectedNode?.type) {
                    return { datasource_type: selectedNode.type }
                }
                return { datasource_id: selectedNode?.id }
            default:
                return undefined
        }
    }, [selectedNode])

    const handleOk = async () => {
        onSure(checkedItem)
    }

    const footer = (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <div>
                <InfoCircleFilled
                    style={{ color: '#3A8FF0', marginRight: 6 }}
                />
                {__('仅为您提供“已发布”的库表进行选择')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    style={{ width: 80, height: 32, marginRight: 12 }}
                    onClick={onClose}
                >
                    {__('取消')}
                </Button>
                <Tooltip
                    placement="topRight"
                    title={checkedItem ? '' : __('请选择所需库表')}
                >
                    <Button
                        style={{ width: 80, height: 32 }}
                        type="primary"
                        disabled={!checkedItem}
                        onClick={handleOk}
                    >
                        {__('确定')}
                    </Button>
                </Tooltip>
            </div>
        </div>
    )

    return (
        <Modal
            title={__('选择库表')}
            width={800}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: !checkedItem,
            }}
            footer={footer}
            bodyStyle={{ height: 484, padding: 0 }}
            {...props}
        >
            <div className={styles['choose-lv']}>
                <div className={styles['choose-lv-left']}>
                    <div className={styles['choose-lv-left-top']}>
                        <Icon component={basicInfo} />
                        <Select
                            value={viewKey}
                            bordered={false}
                            options={viewOptionList}
                            onChange={(option: ViewType) => {
                                setViewKey(option)
                            }}
                            dropdownStyle={{ minWidth: 96 }}
                            getPopupContainer={(n) => n}
                        />
                    </div>
                    {viewKey === ViewType.Organization ? (
                        <div className={styles['choose-lv-left-orgTree']}>
                            <ArchitectureDirTree
                                getSelectedNode={(node) => {
                                    if (node) {
                                        setSelectedNode(node)
                                    } else {
                                        setSelectedNode({ id: '' })
                                    }
                                }}
                                hiddenType={[
                                    Architecture.BMATTERS,
                                    Architecture.BSYSTEM,
                                    Architecture.COREBUSINESS,
                                ]}
                                filterType={[
                                    Architecture.ORGANIZATION,
                                    Architecture.DEPARTMENT,
                                ].join()}
                                // extendNodesData={[
                                //     {
                                //         id: UNGROUPED,
                                //         title: __('未分组'),
                                //     },
                                // ]}
                            />
                        </div>
                    ) : viewKey === ViewType.SubjectDomain ? (
                        <div className={styles['choose-lv-left-sbjTree']}>
                            <GlossaryDirTree
                                placeholder={__(
                                    '搜索业务对象分组、业务对象或逻辑实体',
                                )}
                                getSelectedKeys={setSelectedNode}
                                limitTypes={[BusinessDomainType.logic_entity]}
                            />
                        </div>
                    ) : viewKey === ViewType.DataSource ? (
                        <div className={styles['choose-lv-left-sorTree']}>
                            <DatasourceTree
                                getSelectedNode={setSelectedNode}
                                hasTreeData={false}
                            />
                        </div>
                    ) : undefined}
                </div>
                <div className={styles['choose-lv-right']}>
                    <LogicalViewList
                        dataType={dataType}
                        condition={condition}
                        checkedId={checkedItem?.id}
                        onChecked={(val) => setCheckedItem(val)}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default ChooseLogicalView
