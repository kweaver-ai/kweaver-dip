import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Drawer, List, Radio, Space, Tooltip } from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import classNames from 'classnames'
import { useUpdateEffect, useDebounce } from 'ahooks'
import { uniqBy } from 'lodash'
import styles from './styles.module.less'
import { Empty, LightweightSearch, Loader, SearchInput } from '@/ui'
import { SortDirection, formatError, queryInfoResCatlgColumns } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { CloseOutlined } from '@/icons'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import __ from './locale'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { InfoCatlgItemDataType } from '../helper'

export const menus = [
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}

interface ISelectRelateInfo {
    formId: string
    title?: string
    // type: SelectRescCatlgType
    open: boolean
    onClose: () => void
    onOK: (resource) => void
    selInfoCatlgList?: Array<{
        label: string
        value: string
        title: string
    }>
    selInfoItems?: Array<{
        label: string
        value: string
        title: string
        metadata: any
    }>
}
const SelectRelateInfo: React.FC<ISelectRelateInfo> = ({
    formId = '',
    title = __('选择信息项'),
    // type = SelectRescCatlgType.DATA_RESOURCE,
    open,
    onClose,
    selInfoCatlgList,
    selInfoItems = [],
    onOK,
}) => {
    const [{ using }, updateUsing] = useGeneralConfig()
    const [selectedNode, setSelectedNode] = useState<any>({})
    const [checkedData, setCheckedData] = useState<any[]>([])
    const [selectedData, setSelectedData] = useState<any>()
    const initSearchCondition = {
        offset: 1,
        limit: 10,
        keyword: '',
    }
    const [searchCondition, setSearchCondition] =
        useState<any>(initSearchCondition)
    const searchDebounce = useDebounce(searchCondition, { wait: 500 })
    const [dataSource, setDataSource] = useState<any[]>([])
    const [fieldsLoading, setFieldsLoading] = useState(false)
    const [curInfoCatlg, setCurInfoCatlg] = useState<any>()
    // 信息目录字段列表
    const [fieldList, setFieldList] = useState<any[]>([])
    const [fieldTotal, setFieldTotal] = useState<number>(0)

    useEffect(() => {
        setCurInfoCatlg(selInfoCatlgList?.[0])
    }, [selInfoCatlgList])

    useEffect(() => {
        setCheckedData(
            selInfoItems?.map((item) => ({
                id: item.value,
                name: item.label,
                metadata: item.metadata,
            })),
        )
    }, [selInfoItems])

    const getColumnInfo = async (params) => {
        const { isInit, catalogId, keyword, offset, limit } = params

        try {
            setFieldsLoading(true)

            const res: any = await queryInfoResCatlgColumns({
                id: catalogId,
                keyword,
                offset,
                limit,
            })

            if (offset === 1) {
                setFieldList(res?.entries || [])
            } else {
                setFieldList([...(fieldList || []), ...(res?.entries || [])])
            }
            setFieldTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setFieldsLoading(false)
        }
    }

    useUpdateEffect(() => {
        getColumnInfo(searchCondition)
    }, [searchDebounce])

    useEffect(() => {
        if (curInfoCatlg) {
            setSearchCondition({
                ...initSearchCondition,
                isInit: true,
                catalogId: curInfoCatlg.value,
            })
        }
    }, [curInfoCatlg])

    const handleOk = () => {
        onOK(checkedData)
        onClose()
    }

    const handleChecked = (checked: boolean, data) => {
        if (checked) {
            setCheckedData(uniqBy([...checkedData, data], 'id'))
        } else {
            setCheckedData(checkedData.filter((item) => item.id !== data.id))
        }
    }

    const onDelete = (id: string) => {
        setCheckedData(checkedData.filter((item) => item.id !== id))
    }

    return (
        <Drawer
            title={title}
            width={1138}
            open={open}
            onClose={onClose}
            bodyStyle={{ padding: 0, overflow: 'hidden' }}
            className={styles.selectRescCatlgWrapper}
            footer={
                <Space className={styles.selectRescCatlgFooter}>
                    <Button onClick={onClose} className={styles.btn}>
                        {__('取消')}
                    </Button>
                    <Tooltip
                        title={
                            checkedData.length === 0
                                ? __('请选择信息项后保存')
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            onClick={() => handleOk()}
                            className={styles.btn}
                            style={{ width: 80 }}
                            disabled={checkedData.length === 0}
                        >
                            {__('确定')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles.selectRescCatlgContent}>
                <div className={styles.leftContent}>
                    {/* {selInfoCatlgList?.map((catlg) => {
                        return <div key={catlg.id}>{catlg.name}</div>
                    })} */}
                    <List
                        itemLayout="horizontal"
                        dataSource={selInfoCatlgList}
                        renderItem={(item) => (
                            <div
                                key={item.value}
                                className={classNames(
                                    styles.infoCatlgItem,
                                    curInfoCatlg?.value === item.value &&
                                        styles.selectedInfoCatlgItem,
                                )}
                                onClick={() => {
                                    setFieldList([])
                                    setFieldTotal(0)
                                    setCurInfoCatlg(item)
                                }}
                            >
                                <div className={styles.itemContent}>
                                    {getDataRescTypeIcon(
                                        { type: DataRescType.INFO_RESC_CATLG },
                                        30,
                                    )}
                                    <div className={styles.itemNames}>
                                        <div
                                            className={styles.top}
                                            title={item.label}
                                        >
                                            {item.label}
                                        </div>
                                        <div
                                            className={styles.bottom}
                                            title={item.label}
                                        >
                                            {item.title}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                </div>
                <div className={styles.midContent}>
                    <div className={styles.migTop}>
                        <SearchInput
                            placeholder={__('搜索信息项名称')}
                            value={searchCondition.keyword}
                            onKeyChange={(keyword: string) => {
                                // 防止重复申请
                                if (searchCondition.keyword === keyword) return
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                    keyword,
                                })
                            }}
                            maxLength={128}
                            style={{
                                width: '300px',
                            }}
                        />
                    </div>
                    {!curInfoCatlg ? (
                        <div className={styles.emptyContainer}>
                            <Empty
                                iconSrc={dataEmpty}
                                desc={__('请先选择关联信息类')}
                            />
                        </div>
                    ) : fieldsLoading ? (
                        <div className={styles.listLoading}>
                            <Loader />
                        </div>
                    ) : fieldList?.length === 0 ? (
                        <div className={styles.emptyContainer}>
                            <Empty
                                iconSrc={
                                    searchCondition.keyword
                                        ? searchEmpty
                                        : dataEmpty
                                }
                                desc={
                                    searchCondition.keyword
                                        ? __('抱歉，没有找到相关内容')
                                        : __('暂无数据')
                                }
                            />
                        </div>
                    ) : (
                        <div
                            className={styles.infoItems}
                            id="analysis-choose-res"
                        >
                            <InfiniteScroll
                                hasMore={fieldList.length < fieldTotal}
                                loader={
                                    <div className={styles.listLoading}>
                                        <Loader />
                                    </div>
                                }
                                next={() => {
                                    setSearchCondition({
                                        ...searchCondition,
                                        offset:
                                            (searchCondition?.offset || 0) + 1,
                                    })
                                }}
                                dataLength={fieldList?.length}
                                scrollableTarget="analysis-choose-res"
                            >
                                {fieldList
                                    .filter((item) => item && item.id)
                                    .map((item) => (
                                        <div
                                            key={item.id}
                                            className={classNames(
                                                styles.infoItem,
                                                selectedData?.id === item.id &&
                                                    styles.selectedInfoItem,
                                            )}
                                            onClick={() =>
                                                setSelectedData(item)
                                            }
                                        >
                                            {/* <Tooltip
                                            title={
                                                selInfoCatlgList?.includes(
                                                    item.id,
                                                )
                                                    ? __('已添加')
                                                    : ''
                                            }
                                        > */}
                                            <Checkbox
                                                checked={
                                                    !!checkedData.find(
                                                        (cd) =>
                                                            cd.id === item.id,
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
                                            />
                                            {/* </Tooltip> */}
                                            <div className={styles.itemContent}>
                                                <div
                                                    className={styles.itemNames}
                                                >
                                                    {getFieldTypeEelment(
                                                        {
                                                            type:
                                                                item.metadata
                                                                    ?.data_type ||
                                                                'other',
                                                        },
                                                        16,
                                                    )}

                                                    <div
                                                        className={styles.top}
                                                        title={item.name}
                                                    >
                                                        {item.name || '--'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </InfiniteScroll>
                        </div>
                    )}
                </div>
                <div className={styles.rightContent}>
                    <div className={styles.selectedInfo}>
                        <span>
                            {__('已选择：')} {checkedData.length}
                        </span>
                        {!!checkedData.length && (
                            <span
                                className={styles.clearAllBtn}
                                onClick={() => setCheckedData([])}
                            >
                                {__('全部移除')}
                            </span>
                        )}
                    </div>
                    <div className={styles.selInfoItemsContWrapper}>
                        {checkedData?.map((item) => {
                            return (
                                <div
                                    key={item.id}
                                    className={styles.selInfoItem}
                                >
                                    <div className={styles.selFieldInfo}>
                                        {getFieldTypeEelment(
                                            {
                                                type:
                                                    item.metadata?.data_type ||
                                                    InfoCatlgItemDataType.Other,
                                            },
                                            16,
                                        )}

                                        <div
                                            className={styles.selInfoItemName}
                                            title={item.name}
                                        >
                                            {item.name || '--'}
                                        </div>
                                    </div>
                                    <CloseOutlined
                                        className={styles.selInfoItemDelBtn}
                                        onClick={() => onDelete(item.id)}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default SelectRelateInfo
