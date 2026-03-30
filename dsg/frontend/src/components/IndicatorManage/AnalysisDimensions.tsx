import React, { FC, ReactNode, useEffect, useState } from 'react'
import {
    InfoCircleOutlined,
    DownOutlined,
    RightOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Input, Tag, Tooltip, Badge } from 'antd'
import { noop } from 'lodash'
import classnames from 'classnames'
import { AnalysisDimensionsData } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getFieldTypeIcon } from './helper'
import { Empty } from '@/ui'
import { disabledField } from './const'

// import Empty from '../Empty'

interface IFieldList {
    options: Array<AnalysisDimensionsData>
    onSelect: (item: AnalysisDimensionsData) => void
    iconHeight?: number
}

const FieldList: FC<IFieldList> = ({ options, onSelect, iconHeight = 100 }) => {
    const [searchKey, setSearchKey] = useState<string>('')
    const [dataOptions, setDataOptions] = useState<
        Array<AnalysisDimensionsData>
    >([])

    useEffect(() => {
        setSearchKey('')
    }, [options])
    useEffect(() => {
        getDataOptions()
    }, [searchKey, options])

    /**
     * 获取options
     */
    const getDataOptions = () => {
        if (searchKey) {
            const regex = new RegExp(searchKey ?? '', 'i')
            setDataOptions(
                options.filter(
                    (currentOption) =>
                        regex.test(currentOption.business_name) ||
                        regex.test(currentOption.technical_name),
                ),
            )
        } else {
            setDataOptions(options)
        }
    }

    return (
        <div className={styles.FieldListContainer}>
            {options.length ? (
                <>
                    <div className={styles.searchInput}>
                        <Input
                            value={searchKey}
                            onChange={(e) => {
                                setSearchKey(e.target.value)
                            }}
                            prefix={<SearchOutlined />}
                            placeholder={__('搜索业务名称、技术名称')}
                            allowClear
                        />
                    </div>
                    {dataOptions.length ? (
                        <div className={styles.fieldsList}>
                            {dataOptions.map((current) => (
                                <Tooltip
                                    overlayInnerStyle={{
                                        color: 'rgb(0 0 0 / 85%)',
                                        fontSize: 14,
                                    }}
                                    color="#fff"
                                    title={__(
                                        '当前字段数据受脱敏管控，不能作为分析维度',
                                    )}
                                    placement="top"
                                    key={current.field_id}
                                >
                                    <div
                                        className={classnames(
                                            styles.tableItem,
                                            disabledField(current) &&
                                                styles.disabled,
                                        )}
                                        onClick={() => {
                                            if (disabledField(current)) return
                                            onSelect(current)
                                        }}
                                    >
                                        <span className={styles.icon}>
                                            {getFieldTypeIcon(
                                                current.original_data_type,
                                            )}
                                        </span>
                                        <div className={styles.fieldsInfo}>
                                            <div
                                                className={styles.name}
                                                title={
                                                    current?.business_name || ''
                                                }
                                            >
                                                {current?.business_name || ''}
                                            </div>
                                            <div
                                                title={
                                                    current?.technical_name ||
                                                    ''
                                                }
                                                className={styles.enName}
                                            >
                                                {current?.technical_name || ''}
                                            </div>
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <Empty iconHeight={iconHeight} />
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.empty}>
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__('暂无可添加字段')}
                        iconHeight={iconHeight}
                    />
                </div>
            )}
        </div>
    )
}

interface IAnalysisDimensions {
    options: Array<any>
    value?: Array<AnalysisDimensionsData>
    onChange?: (value: Array<AnalysisDimensionsData>) => void

    // 是否为原子指标
    isAtoms?: boolean
    emptyText?: string
}
const AnalysisDimensions: FC<IAnalysisDimensions> = ({
    options,
    value,
    onChange = noop,
    isAtoms = false,
    emptyText = __('暂无可添加字段'),
}) => {
    const [itemsOption, setItemsOption] = useState<Array<any>>([])

    // 下拉展开的状态
    const [expand, setExpand] = useState<boolean>(false)

    const [selectedTable, setSelectedTable] = useState<string>('')

    useEffect(() => {
        changeItemsOptions()
    }, [options, value])

    const changeItemsOptions = () => {
        if (value?.length) {
            if (isAtoms) {
                setItemsOption(
                    options.map((current) => {
                        return {
                            ...current,
                            fields: current?.fields.filter(
                                (field) =>
                                    !value.find(
                                        (currentValue) =>
                                            currentValue.field_id ===
                                            field.field_id,
                                    ),
                            ),
                        }
                    }),
                )
            } else {
                setItemsOption(
                    options.filter(
                        (field) =>
                            !value.find(
                                (currentValue) =>
                                    currentValue.field_id === field.field_id,
                            ),
                    ),
                )
            }
        } else {
            setItemsOption(options)
        }
        if (!selectedTable) {
            setSelectedTable(options[0]?.table_id || '')
        }
    }

    /**
     *  获取维度表列表
     * @returns
     */
    const getDimDataTemplate = () => {
        return itemsOption.map((currentData) => {
            return (
                <div
                    className={classnames(
                        styles.tableItem,
                        currentData?.table_id === selectedTable
                            ? styles.selectedTable
                            : '',
                    )}
                    onClick={() => {
                        setSelectedTable(currentData?.table_id)
                    }}
                >
                    <div className={styles.textItem}>
                        <FontIcon
                            name="icon-shujubiaoshitu"
                            type={IconType.COLOREDICON}
                            className={styles.icon}
                        />
                        <span className={styles.text}>
                            {currentData?.business_name || ''}
                        </span>
                    </div>
                    <div className={styles.rightBtn}>
                        <RightOutlined />
                    </div>
                </div>
            )
        })
    }

    /**
     *  获取下拉内容
     * @returns
     */
    const dropdownRenderTemplate = () => {
        return itemsOption.length ? (
            isAtoms ? (
                <div className={styles.dropDownBody}>
                    <div className={styles.tableContainer}>
                        {getDimDataTemplate()}
                    </div>
                    <div className={styles.fieldsListContainer}>
                        <FieldList
                            options={
                                itemsOption.find(
                                    (current) => current.id === selectedTable,
                                )?.fields || []
                            }
                            onSelect={(currentSelected) => {
                                onChange([currentSelected, ...(value || [])])
                            }}
                            iconHeight={100}
                        />
                    </div>
                </div>
            ) : (
                <div className={styles.dropDownBody}>
                    <div className={styles.fieldsListContainer}>
                        <FieldList
                            options={itemsOption}
                            onSelect={(currentSelected) => {
                                onChange([currentSelected, ...(value || [])])
                            }}
                        />
                    </div>
                </div>
            )
        ) : (
            <div className={styles.dropDownBody}>
                <div className={styles.empty}>
                    <Empty iconSrc={dataEmpty} desc={emptyText} />
                </div>
            </div>
        )
    }

    return (
        <div className={styles.analysisDim}>
            <Dropdown
                dropdownRender={dropdownRenderTemplate}
                open={expand}
                getPopupContainer={(node) =>
                    (node.parentNode as HTMLElement) || node
                }
                onOpenChange={(visible) => setExpand(visible)}
                trigger={['click']}
                placement="topLeft"
            >
                <Button
                    onClick={() => {
                        setExpand(!expand)
                    }}
                    className={styles.btnContainer}
                >
                    {__('添加')}
                    <DownOutlined
                        className={classnames(
                            styles.addBtn,
                            expand ? styles.expandBtn : '',
                        )}
                    />
                </Button>
            </Dropdown>
            {value?.map((current) => (
                <Badge
                    count={
                        disabledField(current) ? (
                            <Tooltip
                                overlayInnerStyle={{
                                    color: 'rgb(0 0 0 / 85%)',
                                    fontSize: 14,
                                }}
                                color="#fff"
                                title={__(
                                    '当前字段数据受脱敏管控，不能作为分析维度',
                                )}
                                placement="right"
                            >
                                <InfoCircleOutlined
                                    style={{
                                        color: '#FF4D4F',
                                        backgroundColor: '#fff',
                                        zIndex: 9,
                                        right: '6px',
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            0
                        )
                    }
                >
                    <Tag
                        icon={getFieldTypeIcon(current.original_data_type)}
                        closable
                        onClose={() => {
                            onChange(
                                value?.filter(
                                    (currentValue) =>
                                        current.field_id !==
                                        currentValue.field_id,
                                ) || [],
                            )
                        }}
                        key={current.field_id}
                        className={classnames(
                            styles.tag,
                            disabledField(current) && styles.error,
                        )}
                    >
                        <Tooltip
                            title={
                                <div>
                                    <div>
                                        <span>{__('业务名称：')}</span>
                                        <span>{current.business_name}</span>
                                    </div>

                                    <div>
                                        <span>{__('技术名称：')}</span>
                                        <span>{current.technical_name}</span>
                                    </div>
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                        >
                            <span className={styles.text}>
                                {current.business_name}
                            </span>
                        </Tooltip>
                    </Tag>
                </Badge>
            ))}
        </div>
    )
}

export default AnalysisDimensions
