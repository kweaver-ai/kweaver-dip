import React, { useState } from 'react'
import { Button, Checkbox, Modal, Tag, Tooltip } from 'antd'
import classnames from 'classnames'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { className } from '@antv/x6/lib/registry/highlighter/class'
import form from 'antd/lib/form'
import styles from './styles.module.less'
import __ from './locale'
import { CloseOutlined } from '@/icons'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import {
    IMountType,
    ISearchCondition,
    onLineStatus,
    publishStatus,
    ResourceType,
} from '@/components/ResourcesDir/const'
import {
    formatError,
    getDataCatalogMount,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getRescCatlgList,
    SortDirection,
    SystemCategory,
} from '@/core'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'

/**
 * 选择已上线目录对话框
 * @returns
 */
const CatlgChooseModal = ({
    open,
    selDataItems = [],
    onClose,
    onSure,
    useDetail = true,
    fieldKeys = {
        id: 'id',
        name: 'name',
    },
}: any) => {
    const [checkedItems, setCheckedItems] = useState<any[]>([])
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
        publish_status: [
            publishStatus.Published,
            publishStatus.ChangeAuditing,
            publishStatus.ChangeReject,
        ].join(','),
    }
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 200 })
    const catlgIcon = getDataRescTypeIcon(
        {
            type: DataRescType.DATA_RESC_CATLG,
        },
        20,
    )

    const [catlgList, setCatlgList] = useState<Array<any>>([])
    const [catlgListLoading, setCatlgListLoading] = useState(true)
    const [confirmLoading, setConfirmLoading] = useState(false)

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
        setSearchCondition({
            ...searchCondition,
            current: initSearchCondition.current,
        })
    }, [nodeDebounce])

    useUpdateEffect(() => {
        const searchData: any = spliceParams()
        getCatlgList(searchData)
    }, [searchDebounce])

    const getCatlgList = async (params) => {
        try {
            setCatlgListLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = { ...rest, offset: current, limit: pageSize }
            const res = await getRescCatlgList(obj)
            setCatlgList(res?.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setCatlgListLoading(false)
            // setInitSearch(false)
        }
    }

    const handleOk = async () => {
        // onSure(checkedItems)

        let newCheckedItems: any[] = Object.assign([], checkedItems)
        try {
            setConfirmLoading(true)

            // 使用Promise.all处理所有异步操作
            newCheckedItems = await Promise.all(
                checkedItems?.map(async (item) => {
                    const catlgId = item?.id
                    let logicViewInfo: any = {}
                    try {
                        if (catlgId && useDetail) {
                            const mountRes = await getDataCatalogMount(catlgId)
                            const logicViewId = mountRes?.mount_resource?.find(
                                (mItem) =>
                                    mItem.resource_type ===
                                    ResourceType.DataView,
                            )?.resource_id
                            if (logicViewId) {
                                const res = await getDatasheetViewDetails(
                                    logicViewId,
                                )
                                const baseInfoRes = await getDataViewBaseInfo(
                                    logicViewId,
                                )
                                logicViewInfo = {
                                    resource_id: logicViewId,
                                    ...res,
                                    ...baseInfoRes,
                                }
                            }
                        }
                    } catch (e) {
                        formatError(e)
                    }

                    // 返回处理后的数据项
                    return {
                        ...item,
                        logicViewInfo,
                    }
                }) || [],
            )
        } catch (e) {
            formatError(e)
        } finally {
            setConfirmLoading(false)
            onSure(newCheckedItems)
        }
    }

    const handleChecked = async (isCheck: boolean, item) => {
        if (isCheck) {
            setCheckedItems((prev) => [...(prev ?? []), item])
        } else {
            setCheckedItems((prev) => prev?.filter((o) => o?.id !== item?.id))
        }
    }

    const onDelete = (id: string) => {
        setCheckedItems((prev) => prev?.filter((o) => o?.id !== id))
    }

    return (
        <Modal
            title={__('添加数据资源目录')}
            width={873}
            maskClosable={false}
            open={open}
            destroyOnClose
            getContainer={false}
            onCancel={onClose}
            // onOk={handleOk}
            // confirmLoading={confirmLoading}
            // okButtonProps={{
            //     disabled: !checkedItems?.length,
            // }}
            footer={
                <div className={styles.modalFooter}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Tooltip
                        title={
                            !checkedItems?.length && __('请选择数据资源目录')
                        }
                    >
                        <Button
                            type="primary"
                            disabled={!checkedItems?.length}
                            onClick={() => handleOk()}
                            loading={confirmLoading}
                        >
                            {__('确定')}
                        </Button>
                    </Tooltip>
                </div>
            }
            bodyStyle={{ height: 484, padding: '16px 24px' }}
            className={styles.catlgChooseModalWrapper}
        >
            <div className={styles.catlgInfoModalContent}>
                <div>
                    <div className={styles.leftTreeWrapper}>
                        <ResourcesCustomTree
                            // getCategorys={setCategorys}
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
                            placeholder={__('搜索数据资源目录、编码')}
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
                                catlgList.map((item) => {
                                    const isChecked =
                                        !!checkedItems?.find(
                                            (_item) => _item.id === item.id,
                                        ) ||
                                        !!selDataItems?.find(
                                            (_item) =>
                                                _item[fieldKeys?.id] ===
                                                item.id,
                                        )

                                    return (
                                        <div
                                            className={classnames(
                                                styles.catlgInfo,
                                                isChecked
                                                    ? styles.selCatlgInfo
                                                    : undefined,
                                            )}
                                        >
                                            <Checkbox
                                                defaultChecked={
                                                    !!selDataItems?.find(
                                                        (_item) =>
                                                            _item[
                                                                fieldKeys?.id
                                                            ] === item.id,
                                                    )
                                                }
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
                                                        item,
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                style={{ marginRight: '8px' }}
                                            />
                                            {catlgIcon}
                                            <div className={styles.viewNames}>
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
                    <div className={styles.selectedInfoWrapper}>
                        <div className={styles.selectedTopInfo}>
                            <span className={styles.selectedTitle}>
                                {__('已选')}
                            </span>
                            {!!checkedItems.length && (
                                <span
                                    className={styles.clearAllBtn}
                                    onClick={() => setCheckedItems([])}
                                >
                                    {__('全部移除')}
                                </span>
                            )}
                        </div>
                        <div className={styles.selectedListWrapper}>
                            {checkedItems?.length > 0 ? (
                                checkedItems.map((item) => {
                                    const isChecked = !!checkedItems?.find(
                                        (_item) =>
                                            _item[fieldKeys?.id] === item.id,
                                    )
                                    return (
                                        <div className={styles.catlgInfo}>
                                            <span className={styles.icon}>
                                                {catlgIcon}
                                            </span>
                                            <div
                                                className={
                                                    styles.fieldNameWrapper
                                                }
                                            >
                                                <div
                                                    className={styles.top}
                                                    title={item.name}
                                                >
                                                    {item.name || '--'}
                                                </div>
                                                <div
                                                    className={styles.bottom}
                                                    title={item.code}
                                                >
                                                    {item.code || '--'}
                                                </div>
                                            </div>

                                            <CloseOutlined
                                                className={
                                                    styles.selInfoItemDelBtn
                                                }
                                                onClick={() =>
                                                    onDelete(item.id)
                                                }
                                            />
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

export default CatlgChooseModal
