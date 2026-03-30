import {
    Button,
    Modal,
    ModalProps,
    Select,
    Tooltip,
    Dropdown,
    Space,
} from 'antd'
import React, { memo, useEffect, useMemo, useState } from 'react'
import Icon, { DownOutlined, CloseOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { ReactComponent as basicInfo } from '@/assets/DataAssetsCatlg/basicInfo.svg'
import {
    ViewType,
    viewOptionList,
} from '@/components/SCustomView/LogicalViewModal/helper'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import GlossaryDirTree from '@/components/BusinessDomain/GlossaryDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { UNGROUPED } from '@/components/BusiArchitecture/const'
import DatasourceTree from '@/components/DatasheetView/DatasourceTree'
import LogicalViewList from './LogicalViewList'
import { DsType } from '@/components/DatasheetView/const'
import { BusinessDomainType } from '@/components/BusinessDomain/const'
import { DatasheetViewColored } from '@/icons'
import { formatError, getViewsInDataset } from '@/core'

interface IChooseLogicalView extends ModalProps {
    open: boolean
    dataSetId?: string
    onClose: () => void
    onSure: (info) => void
}
/**
 * 库表选择窗
 */
const AddViewModal: React.FC<IChooseLogicalView> = ({
    open,
    dataSetId,
    onClose,
    onSure,
    ...props
}) => {
    const [checkedItem, setCheckedItem] = useState<any>([])
    const [viewKey, setViewKey] = useState<ViewType>(ViewType.SubjectDomain)
    const [selectedNode, setSelectedNode] = useState<any>()
    const [dataType, setDataType] = useState<DsType>()
    const [dropdownItems, setDropdownItems] = useState<any>([])
    const [allData, setAllData] = useState<any[]>([])

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
            default:
                return undefined
        }
    }, [selectedNode])

    const handleOk = async () => {
        onSure(checkedItem)
        setCheckedItem([])
    }

    const removeDropList = (key: string) => {
        let newCheckItems = []
        if (key !== 'all') {
            newCheckItems = checkedItem.filter(
                (checkItem) => checkItem.id !== key,
            )
        }
        setCheckedItem(newCheckItems)
    }

    const getAllData = async () => {
        try {
            const res = await getViewsInDataset({
                id: dataSetId!,
                sort: 'updated_at',
                direction: 'desc',
                limit: 2000,
                offset: 1,
                keyword: '',
            })
            setAllData(res?.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (open && dataSetId) {
            getAllData()
            return
        }
        setAllData([])
    }, [open, dataSetId])

    useEffect(() => {
        const initailItem = {
            label: (
                <div
                    className={styles['choose-lv-bottom-title']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className={styles['choose-lv-bottom-title-text']}>
                        {__('本次已选')}：{checkedItem.length} 个
                    </span>
                    <a
                        className={styles['choose-lv-bottom-title-clearAll']}
                        onClick={() => removeDropList('all')}
                    >
                        {__('清空')}
                    </a>
                </div>
            ),
            key: `initail`,
        }
        const dropList = checkedItem.map((listItem: any) => ({
            label: (
                <div
                    className={styles['choose-lv-bottom-item']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Space size={8}>
                        <DatasheetViewColored />
                        <span
                            className={styles['choose-lv-bottom-text']}
                            title={listItem.business_name}
                        >
                            {listItem.business_name}
                        </span>
                    </Space>
                    <CloseOutlined
                        onClick={() => removeDropList(listItem.id)}
                    />
                </div>
            ),
            key: `${listItem.id}`,
        }))
        const newDropList = [initailItem, ...dropList]
        setDropdownItems(newDropList)
    }, [checkedItem.length])

    const footer = (
        <div className={styles['choose-lv-bottom']}>
            <div
                className={
                    checkedItem.length > 7
                        ? styles['choose-lv-bottom-box-more']
                        : styles['choose-lv-bottom-box-less']
                }
            >
                {checkedItem.length === 0 ? (
                    <p className={styles['choose-lv-bottom-gray']}>
                        {__('本次已选')}：{checkedItem.length} 个
                    </p>
                ) : (
                    <Dropdown
                        menu={{
                            items: dropdownItems,
                        }}
                        trigger={['click']}
                        getPopupContainer={(node) => node}
                    >
                        <a onClick={(e) => e.preventDefault()}>
                            <Space>
                                <span>
                                    {__('本次已选')}：{checkedItem.length} 个
                                </span>
                                <DownOutlined />
                            </Space>
                        </a>
                    </Dropdown>
                )}
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
                    title={checkedItem.length ? '' : __('请选择要引用的库表')}
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
            title={__('添加库表')}
            width={1000}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            destroyOnClose
            getContainer={false}
            okButtonProps={{
                disabled: checkedItem.length === 0,
            }}
            footer={footer}
            bodyStyle={{ height: 534, padding: 0 }}
            {...props}
        >
            <div className={styles['choose-lv']}>
                <div className={styles['choose-lv-left']}>
                    <div className={styles['choose-lv-left-top']}>
                        <Icon component={basicInfo} />
                        <Select
                            value={viewKey}
                            bordered={false}
                            options={viewOptionList.slice(0, 2)}
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
                        // onChecked={(val) => setCheckedItem(val)}
                        checkItems={checkedItem}
                        setCheckItems={setCheckedItem}
                        dataViewLists={allData}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default AddViewModal
