import React, { useEffect, useState } from 'react'
import { Checkbox, Modal, Tag } from 'antd'
import classnames from 'classnames'
import { useDebounce, useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import { CloseOutlined } from '@/icons'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import {
    IMountType,
    ISearchCondition,
    ResourceType,
    typeOptoins,
} from '@/components/ResourcesDir/const'
import {
    formatError,
    getDataCatalogMount,
    getDatasheetViewDetails,
    getInfoItems,
    getRescCatlgList,
    SortDirection,
    SystemCategory,
} from '@/core'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'

const CatlgInfoItemChooseModal = ({
    open,
    selDataItems = [],
    bindItems,
    onClose,
    onSure,
    fieldKeys = {
        id: 'info_item_id',
        name: 'info_item_business_name',
    },
}: any) => {
    const [checkedItems, setCheckedItems] = useState<any[]>(selDataItems)
    // 类目
    const [categorys, setCategorys] = useState<Array<any>>([])
    const [selectedNode, setSelectedNode] = useState<any>({
        name: '全部',
        id: '',
    })
    const nodeDebounce = useDebounce(selectedNode, { wait: 200 })
    const initSearchCondition: ISearchCondition = {
        current: 1,
        pageSize: 1000,
        orgcode: '',
        keyword: '',
        direction: SortDirection.DESC,
        sort: 'updated_at',
        mount_type: IMountType.ViewCount,
    }
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        // org_code: selectedNode.id,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 200 })

    const [catlgList, setCatlgList] = useState<Array<any>>([])
    const [infoItems, setInfoItems] = useState<Array<any>>([])
    const [catlgListLoading, setCatlgListLoading] = useState(true)
    const [infoItemsLoading, setInfoItemsLoading] = useState(true)

    // 已选的数据资源目录
    const [selCatlg, setSelCatlg] = useState<any>({})

    const spliceParams = () => {
        let searchData: any = {}
        if (selectedNode.cate_id === SystemCategory.Organization) {
            searchData = {
                ...searchCondition,
                department_id: selectedNode.id,
                info_system_id: undefined,
                subject_id: undefined,
                category_node_id: undefined,
            }
        } else if (selectedNode.cate_id === SystemCategory.InformationSystem) {
            searchData = {
                ...searchCondition,
                subject_id: undefined,
                department_id: undefined,
                category_node_id: undefined,
                info_system_id: selectedNode.id,
            }
            // } else {
            //     searchData = {
            //         ...searchCondition,
            //         subject_id: selectedNode.id,
            //         department_id: undefined,
            //         info_system_id: undefined,
            //         current: 1,
            //     }
        } else {
            searchData = {
                ...searchCondition,
                category_node_id: selectedNode.id,
                subject_id: undefined,
                department_id: undefined,
                info_system_id: undefined,
            }
        }
        return searchData
    }

    useUpdateEffect(() => {
        setInfoItems([])
        setSearchCondition({
            ...searchCondition,
            current: initSearchCondition.current,
        })
    }, [nodeDebounce])

    useUpdateEffect(() => {
        const searchData: any = spliceParams()
        getCatlgList(searchData)
    }, [searchDebounce])

    useEffect(() => {
        if (!open) {
            setSelCatlg(undefined)
        }
    }, [open])
    const getCatlgList = async (params) => {
        try {
            setCatlgListLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getRescCatlgList(obj)
            setCatlgList(res?.entries || [])
            setSelCatlg(res?.entries?.[0])
            getDirInfoItems(res?.entries?.[0])
        } catch (error) {
            formatError(error)
        } finally {
            setCatlgListLoading(false)
            // setInitSearch(false)
        }
    }

    // 获取目录信息项
    const getDirInfoItems = async (catlg: any) => {
        const catlgId = catlg?.id
        if (!catlgId) return
        try {
            setInfoItemsLoading(true)
            const mountRes = await getDataCatalogMount(catlgId)
            const logicViewId = mountRes?.mount_resource?.find(
                (item) => item.resource_type === ResourceType.DataView,
            )?.resource_id
            if (logicViewId) {
                const logicViewInfo = await getDatasheetViewDetails(logicViewId)
                setSelCatlg((prev) => {
                    return {
                        ...prev,
                        logicViewInfo: logicViewInfo ?? {},
                    }
                })
            }
            const res = await getInfoItems(catlgId, { limit: 0 })
            setInfoItems(
                res.columns?.map((cItem) => {
                    return {
                        ...cItem,
                        [fieldKeys.id]: cItem.id,
                        [fieldKeys.name]: cItem.business_name,
                    }
                }),
            )
        } catch (e) {
            formatError(e)
        } finally {
            setInfoItemsLoading(false)
        }
    }

    const handleOk = async () => {
        onSure(checkedItems)
    }

    const handleClickCatlgItem = async (item: any) => {
        setSelCatlg(item)
        setInfoItems([])
        getDirInfoItems(item)
    }

    const handleChecked = async (isCheck: boolean, item) => {
        if (isCheck) {
            setCheckedItems((prev) => [
                ...(prev ?? []),
                {
                    ...item,
                    tableNameEn: selCatlg?.logicViewInfo?.technical_name,
                },
            ])
        } else {
            setCheckedItems((prev) => prev?.filter((o) => o?.id !== item?.id))
        }
    }

    const onDelete = (id: string) => {
        setCheckedItems(checkedItems.filter((item) => item.id !== id))
    }
    return (
        <Modal
            title={__('添加字段')}
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
            className={styles.infoItemChooseModalWrapper}
        >
            {!!checkedItems.length && (
                <div className={styles.selFieldList}>
                    <div className={styles.selectedInfo}>
                        {__('已选（${text}）：', {
                            text: checkedItems.length || '0',
                        })}
                        {/* {!!checkedItems.length && (
                        <span
                            className={styles.clearAllBtn}
                            onClick={() => setCheckedItems([])}
                        >
                            {__('全部移除')}
                        </span>
                    )} */}
                    </div>
                    <div className={styles.selInfoItemsContWrapper}>
                        {checkedItems
                            ?.filter((item) => item[fieldKeys.id])
                            ?.map((item) => {
                                return (
                                    <div
                                        key={item.id}
                                        className={styles.selInfoItem}
                                    >
                                        <div className={styles.selFieldInfo}>
                                            <div
                                                className={
                                                    styles.selInfoItemName
                                                }
                                                title={item[fieldKeys?.name]}
                                            >
                                                {item[fieldKeys?.name] || '--'}
                                            </div>
                                        </div>
                                        {!selDataItems?.find(
                                            (_item) =>
                                                _item[fieldKeys?.id] ===
                                                item[fieldKeys?.id],
                                        ) && (
                                            <CloseOutlined
                                                className={
                                                    styles.selInfoItemDelBtn
                                                }
                                                onClick={() =>
                                                    onDelete(item.id)
                                                }
                                            />
                                        )}
                                    </div>
                                )
                            })}
                    </div>
                </div>
            )}
            <div className={styles.catlgInfoModalContent}>
                <div>
                    <div className={styles.leftTreeWrapper}>
                        <ResourcesCustomTree
                            getCategorys={setCategorys}
                            onChange={setSelectedNode}
                            needUncategorized
                        />
                    </div>
                </div>
                <div>
                    <div className={styles.catlgListWrapper}>
                        <div className={styles.boxTitle}>
                            {__('数据资源目录')}
                        </div>
                        <SearchInput
                            placeholder={__('搜索数据资源目录')}
                            value={searchCondition?.keyword}
                            onKeyChange={(keyword: string) => {
                                setSearchCondition({
                                    ...(searchCondition || {}),
                                    keyword,
                                })
                            }}
                            maxLength={128}
                            className={styles.caltgSearchInput}
                        />
                        <div className={styles.catlgListContent}>
                            {catlgListLoading ? (
                                <Loader />
                            ) : catlgList?.length > 0 ? (
                                catlgList.map((item) => (
                                    <div
                                        className={classnames(
                                            styles.catlgInfo,
                                            selCatlg?.id === item.id
                                                ? styles.selCatlgInfo
                                                : undefined,
                                        )}
                                        onClick={() =>
                                            handleClickCatlgItem(item)
                                        }
                                    >
                                        {getDataRescTypeIcon(
                                            {
                                                type: DataRescType.DATA_RESC_CATLG,
                                            },
                                            20,
                                        )}
                                        <div
                                            className={styles.catlgNameWrapper}
                                        >
                                            <div
                                                className={styles.top}
                                                title={item.name}
                                            >
                                                {item.name}
                                            </div>
                                            <div
                                                className={styles.bottom}
                                                title={item.code}
                                            >
                                                {item.code}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyContainer}>
                                    <Empty
                                        iconSrc={
                                            searchCondition?.keyword
                                                ? searchEmpty
                                                : dataEmpty
                                        }
                                        desc={
                                            searchCondition?.keyword
                                                ? __('抱歉，没有找到相关内容')
                                                : __('暂无数据')
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.fieldListWrapper}>
                        <div className={styles.boxTitle}>{__('信息项')}</div>
                        <div className={styles.infoItemListContent}>
                            {catlgListLoading || infoItemsLoading ? (
                                <Loader />
                            ) : infoItems?.length > 0 ? (
                                infoItems.map((item) => {
                                    const isChecked = !![
                                        ...checkedItems,
                                        ...selDataItems,
                                    ]?.find(
                                        (_item) =>
                                            _item[fieldKeys?.id] === item.id,
                                    )
                                    return (
                                        <div className={styles.fieldInfo}>
                                            <Checkbox
                                                defaultChecked={isChecked}
                                                checked={isChecked}
                                                disabled={
                                                    !!selDataItems?.find(
                                                        (_item) =>
                                                            _item[
                                                                fieldKeys?.id
                                                            ] === item.id,
                                                    )
                                                }
                                                onChange={(e) =>
                                                    handleChecked(
                                                        e.target.checked,
                                                        {
                                                            ...item,
                                                            catalog_id:
                                                                selCatlg?.id,
                                                        },
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                            <span className={styles.icon}>
                                                {getFieldTypeEelment(
                                                    {
                                                        type: typeOptoins.find(
                                                            (_item) =>
                                                                _item.value ===
                                                                item?.data_type,
                                                        )?.strValue,
                                                    },
                                                    16,
                                                )}
                                            </span>
                                            <div
                                                className={
                                                    styles.fieldNameWrapper
                                                }
                                            >
                                                <div
                                                    className={styles.top}
                                                    title={
                                                        item[fieldKeys?.name]
                                                    }
                                                >
                                                    {item[fieldKeys?.name] ||
                                                        '--'}
                                                </div>
                                                <div
                                                    className={styles.bottom}
                                                    title={item.technical_name}
                                                >
                                                    {item.technical_name ||
                                                        '--'}
                                                </div>
                                            </div>
                                            {!!selDataItems?.find(
                                                (_item) =>
                                                    _item[fieldKeys?.id] ===
                                                    item.id,
                                            ) && (
                                                <Tag
                                                    className={styles.addedTag}
                                                >
                                                    {__('已添加')}
                                                </Tag>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                <div className={styles.emptyContainer}>
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default CatlgInfoItemChooseModal
