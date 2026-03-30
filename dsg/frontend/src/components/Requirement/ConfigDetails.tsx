import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { Form, Table } from 'antd'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import {
    formatError,
    getDemandItemDetails,
    getDemandItemInfos,
    IDemandItemConfig,
} from '@/core'
import Empty from '@/ui/Empty'
import FilterRules from './FilterRules'
import styles from './styles.module.less'
import {
    callUnitList,
    dataSpaceRange,
    dataTimeRange,
    dataTypes,
    PageType,
    ResourceSource,
    ResourceType,
    updateCycle,
} from './const'
import { APIColored, DBTableColored } from '@/icons'
import emptyData from '@/assets/dataEmpty.svg'
import { SearchInput } from '@/ui'
import __ from './locale'

interface IConfigDetails {
    itemInfo?: IDemandItemConfig
    pageType?: PageType
}
const ConfigDetails: React.FC<IConfigDetails> = ({
    itemInfo,
    pageType = PageType.APPLY,
}) => {
    const [foldInfo, setFoldInfo] = useState([false, false, false])
    const [infoItems, setInfoItems] = useState<any[]>(
        itemInfo?.info_items || [],
    )
    const [showInfoItems, setShowInfoItems] = useState<any[]>([])
    const [searchValue, setSearchValue] = useState<any>('')
    // const searchValue = useDebounce(searchValue, { wait: 500 })
    const [isShowErrorInfo, setIsShowErrorInfo] = useState(false)

    useEffect(() => {
        if (itemInfo?.res_source === ResourceSource.BLANK) {
            setInfoItems(itemInfo?.info_items || [])
            setShowInfoItems(itemInfo?.info_items || [])
        } else {
            const data =
                (itemInfo?.info_items || []).filter(
                    (item) => item.selected === 2,
                ) || []

            setInfoItems(data)
            setShowInfoItems(data)
        }
    }, [itemInfo])

    // 获取信息项
    const getInfoItems = async (resId: string) => {
        try {
            const res = await getDemandItemInfos({
                res_id: resId,
                item_id:
                    pageType === PageType.ANALYSIS
                        ? undefined
                        : itemInfo?.id
                        ? `${itemInfo?.id}`
                        : undefined,
                // 需求分析时的分析项id
                // 新增的分析项不需要传该参数
                analyse_item_id:
                    pageType === PageType.APPLY
                        ? undefined
                        : itemInfo?.id
                        ? `${itemInfo?.id}`
                        : undefined,
                original_id:
                    pageType === PageType.ANALYSIS
                        ? itemInfo?.original_id
                        : undefined,
            })
            const data = (res.entries || []).filter(
                (item) => item.selected === 2,
            )
            setInfoItems(data)
            setShowInfoItems(data)
        } catch (error) {
            formatError(error)
            setIsShowErrorInfo(true)
        }
    }
    useEffect(() => {
        if (
            (itemInfo?.info_items || []).length === 0 &&
            itemInfo?.res_id &&
            itemInfo.res_source === ResourceSource.SERVICESHOP
        ) {
            getInfoItems(itemInfo?.res_id)
        }
    }, [itemInfo])

    const resetFoldInfo = (index: number) => {
        foldInfo[index] = !foldInfo[index]
        setFoldInfo([...foldInfo])
    }

    const infoItemColumns = () => {
        const itemNameCol = {
            title: __('信息项名称'),
            dataIndex: 'item_name',
            key: 'item_name',
            ellipsis: true,
        }
        const ColumnNameCol = {
            title: __('字段名称'),
            dataIndex: 'column_name',
            key: 'column_name',
            ellipsis: true,
        }

        const dataTypeCol = {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            render: (val) => {
                if (typeof val === 'number') {
                    return (
                        dataTypes.find((data) => data.value === val)?.label ||
                        '--'
                    )
                }
                return '--'
            },
        }

        const desCol = {
            title: __('信息项描述'),
            dataIndex: 'description',
            key: 'description',
            render: (val: string) => val || '--',
            ellipsis: true,
        }

        return itemInfo?.res_source === ResourceSource.SERVICESHOP
            ? [itemNameCol, ColumnNameCol]
            : [itemNameCol, dataTypeCol, desCol]
    }

    // TODO: 以下代码在审核微应用中不生效
    // useEffect(() => {
    //     const data = searchValue
    //         ? infoItems?.filter(
    //               (item) =>
    //                   item.item_name
    //                       ?.toLocaleLowerCase()
    //                       .includes(searchValue.toLocaleLowerCase()) ||
    //                   item.column_name
    //                       ?.toLocaleLowerCase()
    //                       .includes(searchValue.toLocaleLowerCase()),
    //           )
    //         : [...(infoItems || [])]

    //     setShowInfoItems(data)
    // }, [searchValue])

    const getFilterData = (val: string) => {
        const data = val
            ? infoItems?.filter(
                  (item) =>
                      item.item_name
                          ?.toLocaleLowerCase()
                          .includes(val.toLocaleLowerCase()) ||
                      item.column_name
                          ?.toLocaleLowerCase()
                          .includes(val.toLocaleLowerCase()),
              )
            : [...(infoItems || [])]
        setShowInfoItems(data)
    }

    const getTitleComp = (t: string, index: number) => {
        return (
            <div
                className={styles.sourceConfigTitleWrapper}
                onClick={() => resetFoldInfo(index)}
            >
                <div className={styles.sourceConfigTitle}>{t}</div>
                {foldInfo[index] ? (
                    <DownOutlined className={styles.arrow} />
                ) : (
                    <UpOutlined className={styles.arrow} />
                )}
            </div>
        )
    }

    const getValue = (
        key: string,
        options: { label: string; value: string | number }[],
    ) => {
        return options.find((op) => op.value === itemInfo?.[key])?.label || '--'
    }

    const getCallUnit = (unit?: number) => {
        if (unit) {
            return callUnitList.find((item) => item.value === unit)?.label
        }
        return null
    }

    return (
        <div className={styles.configDetailsWrapper}>
            <div className={styles.resourceNameWrapper}>
                {itemInfo?.res_type === ResourceType.DBTABLE ? (
                    <DBTableColored className={styles.resourceTypeIcon} />
                ) : itemInfo?.res_type === ResourceType.INTERFACE ? (
                    <APIColored className={styles.resourceTypeIcon} />
                ) : null}
                <div className={styles.resourceName} title={itemInfo?.res_name}>
                    {itemInfo?.res_name}
                </div>
            </div>
            {getTitleComp(__('基本配置'), 0)}
            <div hidden={foldInfo[0]}>
                <Form.Item
                    label={__('目标数据源/库表')}
                    hidden={itemInfo?.res_type !== ResourceType.DBTABLE}
                >
                    <div className={styles.value}>
                        {itemInfo?.target_machine_name || '--'}
                    </div>
                </Form.Item>
                <Form.Item
                    label={__('调用频率')}
                    hidden={itemInfo?.res_type !== ResourceType.INTERFACE}
                >
                    <div className={styles.value}>
                        {itemInfo?.call_frequency
                            ? `${itemInfo?.call_frequency} ${getCallUnit(
                                  itemInfo?.call_frequency_unit,
                              )}`
                            : '--'}
                    </div>
                </Form.Item>
                <Form.Item
                    label={__('授权IP地址')}
                    hidden={itemInfo?.res_type !== ResourceType.INTERFACE}
                >
                    <div className={styles.value}>{itemInfo?.access_ip}</div>
                </Form.Item>
                <Form.Item label={__('资源描述')}>
                    <div className={styles.value}>
                        {itemInfo?.res_desc || '--'}
                    </div>
                </Form.Item>
                <Form.Item label={__('使用用途')}>
                    <div className={styles.value}>
                        {itemInfo?.use_purpose || '--'}
                    </div>
                </Form.Item>
            </div>
            {getTitleComp(__('推送规则配置'), 1)}
            <div hidden={foldInfo[1]}>
                <Form.Item label={__('开始时间')}>
                    <div className={styles.value}>
                        {itemInfo?.data_push_time
                            ? moment(itemInfo?.data_push_time).format(
                                  'YYYY-MM-DD',
                              )
                            : '--'}
                    </div>
                </Form.Item>
                <Form.Item label={__('更新周期')}>
                    <div className={styles.value}>
                        {getValue('update_cycle', updateCycle)}
                    </div>
                </Form.Item>
                <Form.Item label={__('时间范围')}>
                    <div className={styles.value}>
                        {getValue('data_time_range', dataTimeRange)}
                    </div>
                </Form.Item>
                <Form.Item label={__('数据范围')}>
                    <div className={styles.value}>
                        {getValue('data_space_range', dataSpaceRange)}
                    </div>
                </Form.Item>
                <Form.Item label={__('使用期限')}>
                    {itemInfo?.service_life === 2 ? (
                        <div className={styles.value}>
                            <span>{__('短期')}</span>
                            <span className={styles.serviceEndTime}>
                                {itemInfo.service_end_time
                                    ? `${moment(
                                          itemInfo.service_end_time,
                                      ).format('YYYY-MM-DD')} 23:59:59 过期`
                                    : '--'}
                            </span>
                        </div>
                    ) : itemInfo?.service_life === 1 ? (
                        __('永久')
                    ) : (
                        '--'
                    )}
                </Form.Item>
            </div>
            {getTitleComp(__('信息项配置'), 2)}
            <div hidden={foldInfo[2]}>
                <div className={styles.infoItemsWrapper}>
                    <div className={styles.infoItemsTitle}>{__('信息项')}</div>
                    {isShowErrorInfo && (
                        <div className={styles.errorInfo}>
                            {__('资源已失效，无法查看信息项')}
                        </div>
                    )}
                    <div className={styles.infoItemOperate}>
                        <div className={styles.infoItemCount}>
                            {__('共 ${count} 个信息项', {
                                count: infoItems?.length,
                            })}
                        </div>
                        <SearchInput
                            placeholder={
                                itemInfo?.res_source === ResourceSource.BLANK
                                    ? __('搜索信息项名称')
                                    : __('搜索信息项名称、字段名称')
                            }
                            onChange={(e: any) => {
                                const kw = e.target.value
                                setSearchValue(kw)
                                getFilterData(kw)
                            }}
                            className={styles.infoItemSearchInput}
                        />
                    </div>

                    {!searchValue && infoItems.length === 0 ? (
                        <Empty iconSrc={emptyData} desc={__('暂无数据')} />
                    ) : (
                        <Table
                            columns={infoItemColumns()}
                            dataSource={showInfoItems}
                            rowKey="item_uuid"
                            pagination={{
                                hideOnSinglePage: true,
                                showSizeChanger: false,
                                showQuickJumper: false,
                            }}
                            locale={{ emptyText: <Empty /> }}
                        />
                    )}

                    {infoItems &&
                        Array.isArray(infoItems) &&
                        infoItems.length > 0 && (
                            <>
                                <FilterRules
                                    infoItems={infoItems}
                                    filterItems={itemInfo?.filter_items}
                                    isDetails
                                />
                                <Form.Item label={__('过滤规则描述')}>
                                    <div className={styles.value}>
                                        {itemInfo?.filter_description || '--'}
                                    </div>
                                </Form.Item>
                            </>
                        )}
                </div>
            </div>
        </div>
    )
}

export default ConfigDetails
