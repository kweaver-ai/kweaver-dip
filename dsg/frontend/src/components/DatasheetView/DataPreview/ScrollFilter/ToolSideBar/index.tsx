import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons'
import { Button, Checkbox, Form, Input, Switch, Tooltip } from 'antd'
import classnames from 'classnames'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    arrayMove,
    SortableContainer,
    SortableElement,
} from 'react-sortable-hoc'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { useGetState } from 'ahooks'
import { Empty, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from '../locale'
import styles from './styles.module.less'
import FieldItem from './FieldItem'
import { changeFormatToType } from '@/components/IndicatorManage/const'
import ConfigFilter from './ConfigFilter'
import QueryConfig, {
    Filter,
} from '@/components/SingleDirectoryQuery/QueryConfig'

export type IFieldMeta = any
export const DragDropType = 'FieldBindDataView'

const SortableItem = SortableElement<any>(({ children }: any) => {
    return <div>{children}</div>
})

const SortableBox = SortableContainer<any>(({ children }: any) => {
    return <div className={styles['expand-box-fields-list']}>{children}</div>
})

function ToolSideBar({
    fields,
    tableId,
    config,
    onConfigChange,
    onExpandChange,
}: any) {
    const configRef = useRef<{
        activeKey: Filter
        onConfigChange: () => any
        onConfigReset: () => void
    }>(null)
    const [confExpand, setConfExpand] = useState<boolean>(true)
    const [fieldList, setFieldList] = useState<Array<any>>([])
    const [checkedItems, setCheckedItems] = useState<IFieldMeta[]>([])
    const [selectedFilterData, setSelectedFilterData] = useState<any>()
    // 过滤数据
    const [filterData, setFilterData, getFilterData] = useGetState<Array<any>>(
        [],
    )
    const initData = config?.configs
        ? JSON.parse(config.configs)?.rule_expression
        : null

    useEffect(() => {
        onExpandChange?.(confExpand)
    }, [confExpand])

    const handleQuery = async () => {
        // const cFields = fieldList?.map((o) => ({
        //     data_type: changeFormatToType(o?.data_type),
        //     id: o?.id,
        //     name: o?.business_name,
        //     name_en: o?.technical_name,
        //     isChecked: checkedItems?.some((k) => k.id === o?.id),
        // }))
        // const cFilters = getFilterData()?.map((o) => ({
        //     data_type: changeFormatToType(o?.data_type),
        //     id: o?.id,
        //     name: o?.business_name,
        //     name_en: o?.technical_name,
        //     operator: o?.operator,
        //     value: o?.value,
        // }))
        // 变更配置
        if (configRef.current) {
            const configValue = await configRef.current.onConfigChange()

            if (!configValue) return

            onConfigChange?.({
                filters: [],
                configs: configValue.filters,
                fields: configValue.fields,
            })
        }
    }

    const handleReset = () => {
        configRef?.current?.onConfigReset()
    }

    const fieldConfig = {
        config,
        initData:
            config?.fields
                ?.filter((o) => o.isChecked)
                ?.map((item) => item.id) ?? [],
    }
    const dataConfig = { initData }

    return (
        <div className={styles['tool-sidebar']}>
            <div
                className={classnames({
                    [styles['tool-sidebar-box']]: true,
                    [styles.expand]: confExpand,
                    [styles.unExpand]: !confExpand,
                })}
            >
                {confExpand ? (
                    <div className={styles['expand-box']}>
                        {/* <div className={styles['expand-box-title']}>
                            <div className={styles.text}>{__('配置')}</div>
                            <Tooltip title={__('收起')}>
                                <div
                                    onClick={() => {
                                        setConfExpand(false)
                                    }}
                                    className={styles.icon}
                                >
                                    <DoubleRightOutlined />
                                </div>
                            </Tooltip>
                        </div> */}
                        <QueryConfig
                            ref={configRef}
                            fields={fields}
                            resourceId={tableId}
                            fieldConfig={fieldConfig}
                            dataConfig={dataConfig}
                            tabBarExtraContent={
                                <Tooltip title={__('收起')}>
                                    <div
                                        onClick={() => {
                                            setConfExpand(false)
                                        }}
                                        className={styles.icon}
                                    >
                                        <DoubleRightOutlined />
                                    </div>
                                </Tooltip>
                            }
                        />
                        <div className={styles['expand-box-fields-btns']}>
                            <Button
                                className={styles.btn}
                                onClick={() => handleReset()}
                            >
                                {__('重置')}
                            </Button>
                            <Button
                                type="primary"
                                className={styles.btn}
                                onClick={() => handleQuery()}
                            >
                                {__('查询')}
                            </Button>
                        </div>

                        {/* {fieldList?.length > 0 ? (
                            <div className={styles['expand-box-fields']}>
                                <div
                                    className={
                                        styles['expand-box-fields-search']
                                    }
                                >
                                    <SearchInput
                                        placeholder={__('搜索字段名称')}
                                        value={searchKey}
                                        onKeyChange={(key: string) => {
                                            setSearchKey(key)
                                        }}
                                        allowClear
                                    />
                                </div>
                                <div
                                    className={
                                        styles['expand-box-fields-check']
                                    }
                                >
                                    <Checkbox
                                        indeterminate={indeterminate}
                                        onChange={handleCheckAll}
                                        checked={checkAll}
                                        disabled={!showFields?.length}
                                    >
                                        {__('全选')}
                                    </Checkbox>

                                    <div className={styles.switch}>
                                        {__('只看已选')}
                                        <Switch
                                            size="small"
                                            checked={switchState}
                                            onChange={handleSwitch}
                                        />
                                    </div>
                                </div>
                                {showFields?.length > 0 ? (
                                    <SortableBox
                                        onSortEnd={onSortEnd}
                                        useDragHandle
                                    >
                                        {getSortList(showFields)}
                                    </SortableBox>
                                ) : (
                                    <div
                                        className={styles.empty}
                                        style={{ flex: '1' }}
                                    >
                                        <Empty
                                            desc={
                                                searchKey
                                                    ? __(
                                                          '抱歉，没有找到相关内容',
                                                      )
                                                    : __('暂无数据')
                                            }
                                            iconSrc={
                                                searchKey
                                                    ? undefined
                                                    : dataEmpty
                                            }
                                        />
                                    </div>
                                )}

                                <div
                                    className={styles['expand-box-fields-btns']}
                                >
                                    <Button
                                        ref={resetRef}
                                        className={styles.btn}
                                        onClick={() => handleReset()}
                                    >
                                        {__('重置')}
                                    </Button>
                                    <Button
                                        type="primary"
                                        className={styles.btn}
                                        onClick={() => handleQuery()}
                                    >
                                        {__('查询')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.empty}>
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            </div>
                        )} */}
                    </div>
                ) : (
                    <div className={styles['unExpand-box']}>
                        <Tooltip title={__('展开')}>
                            <div
                                onClick={() => {
                                    setConfExpand(true)
                                }}
                                className={styles.icon}
                            >
                                <DoubleLeftOutlined />
                            </div>
                        </Tooltip>

                        <div className={styles.text}>{__('配置')}</div>
                    </div>
                )}
            </div>
            {selectedFilterData && (
                <ConfigFilter
                    tableId={tableId}
                    data={selectedFilterData}
                    open={!!selectedFilterData}
                    onClose={() => {
                        setSelectedFilterData(null)
                    }}
                    onOk={(data) => {
                        setSelectedFilterData(null)

                        // 若未勾选 则勾选字段
                        if (!checkedItems?.some((o) => o?.id === data?.id)) {
                            const it = fieldList?.find(
                                (obj) => obj?.id === data?.id,
                            )
                            setCheckedItems((prev) => [...(prev || []), it])
                        }

                        if (
                            filterData?.some(
                                (o) => o?.id === selectedFilterData?.id,
                            )
                        ) {
                            setFilterData(
                                filterData.map((cur) =>
                                    cur?.id === data?.id ? data : cur,
                                ),
                            )
                        } else {
                            setFilterData((prev) => [...(prev || []), data])
                        }
                    }}
                />
            )}
        </div>
    )
}

export default memo(ToolSideBar)
