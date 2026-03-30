import { Button, Modal, ModalProps, Select, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import Icon from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'
import { ViewType, viewOptionList } from './helper'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import GlossaryDirTree from '@/components/BusinessDomain/GlossaryDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import DatasourceTree from '@/components/DatasheetView/DatasourceTree'
import LogicalViewList from './LogicalViewList'
import { DsType } from '@/components/DatasheetView/const'
import { BusinessDomainType } from '@/components/BusinessDomain/const'

interface IChooseMountResources extends ModalProps {
    open: boolean
    initCheckedItems?: any[]
    onClose: () => void
    onSure: (info) => void
}
/**
 * 库表选择窗
 */
const ChooseMountResources: React.FC<IChooseMountResources> = ({
    open,
    initCheckedItems,
    onClose,
    onSure,
    ...props
}) => {
    const [checkedItem, setCheckedItem] = useState<any>([])
    const [viewKey, setViewKey] = useState<ViewType>(ViewType.SubjectDomain)
    const [selectedNode, setSelectedNode] = useState<any>()
    const [dataType, setDataType] = useState<DsType>()

    const condition = useMemo(() => {
        if (!selectedNode) return undefined
        setDataType(undefined)
        switch (viewKey) {
            case ViewType.Organization:
                if (selectedNode?.id) {
                    return { department_id: selectedNode.id }
                }
                return undefined
            case ViewType.SubjectDomain:
                if (selectedNode?.id) {
                    return {
                        subject_id: selectedNode.id,
                        include_sub_subject: true,
                    }
                }
                return undefined
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

                return {
                    datasource_id:
                        selectedNode?.dataSourceId || selectedNode?.id,
                    excel_file_name:
                        selectedNode?.dataType === 'file'
                            ? selectedNode?.title
                            : undefined,
                }
            default:
                return undefined
        }
    }, [selectedNode])

    useEffect(() => {
        if (initCheckedItems) {
            setCheckedItem(initCheckedItems)
        }
    }, [initCheckedItems])

    const handleOk = async () => {
        onSure(checkedItem)
        setCheckedItem([])
        onClose()
    }

    const footer = (
        <div className={styles['choose-lv-bottom']}>
            <div>
                <Button
                    style={{ width: 80, height: 32, marginRight: 12 }}
                    onClick={onClose}
                >
                    {__('取消')}
                </Button>
                <Tooltip
                    placement="topRight"
                    title={checkedItem.length ? '' : __('请选择资源')}
                >
                    <Button
                        style={{ width: 80, height: 32 }}
                        type="primary"
                        disabled={!checkedItem.length}
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
            title={__('挂接数据资源')}
            width={1130}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: checkedItem.length === 0,
            }}
            zIndex={1005}
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
                                needUncategorized
                                unCategorizedKey="00000000-0000-0000-0000-000000000000"
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
                                needUncategorized
                                unCategorizedKey="00000000-0000-0000-0000-000000000000"
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
                        checkItems={checkedItem}
                        initCheckedItems={initCheckedItems}
                        setCheckItems={setCheckedItem}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default ChooseMountResources
