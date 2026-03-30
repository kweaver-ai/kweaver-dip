import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
} from 'react'
import { Table, Select, message, Tooltip, Button, Form } from 'antd'
import { debounce, noop, set } from 'lodash'
import type { ColumnsType } from 'antd/es/table'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import {
    DataProcessingList,
    shareTypeList,
    openTypeList,
    belongSystemClassifyList,
    sensitivityLevelList,
} from '../const'
import styles from './styles.module.less'
import __ from '../locale'
import Empty from '@/ui/Empty'

interface IInfoItemEditTable {
    value?: Array<any>
    onChange?: (value) => void
    isEidt?: boolean
    showMore?: boolean
}
const InfoItemEditTable = forwardRef(
    (
        { value = [], isEidt, showMore, onChange = noop }: IInfoItemEditTable,
        ref,
    ) => {
        const tableRef: any = useRef()
        const parentNode = tableRef?.current
        const [appSystem, setAppSystem] = useState<any>()
        const [showError, setShowError] = useState<boolean>(false)
        const [appSystemType, setAppSystemType] = useState<any>()
        const [infoItemLevel, setInfoItemLevel] = useState<any>()
        const defaultKeys = [
            'business_name',
            'info_name',
            'app_system',
            'app_system_type',
            'info_item_level',
        ]
        const [tableData, setTableData] = useState<any[]>([])

        useImperativeHandle(ref, () => ({
            setShowError,
        }))

        useEffect(() => {
            setTableData(value)
        }, [value])

        const onFieldsChange = (
            type: 'all' | 'single',
            key: string,
            val: any,
            id?: string,
        ) => {
            let list: any[]
            if (type === 'single') {
                list = value.map((item) => {
                    return {
                        ...item,
                        [key]: item.id === id ? val : item[key],
                    }
                })
            } else {
                list = value.map((item) => ({
                    ...item,
                    [key]: val,
                }))
            }
            onChange?.(list)
            const setAction =
                key === 'app_system'
                    ? setAppSystem
                    : key === 'app_system_type'
                    ? setAppSystemType
                    : setInfoItemLevel
            // 选项值是否统一，统一则头部选项有值，否则头部显示多项值
            const flag = list
                .map((item) => item[key])
                .every((item) => item === val)
            setAction(type === 'all' || flag ? val : null)
        }

        const columns = [
            {
                title: __('库表字段'),
                key: 'business_name',
                width: 180,
                render: (text, record) => {
                    const name = record.business_name
                    const code = record.technical_name
                    const type = record?.data_type
                    const isPrimary = record?.is_primary
                    return (
                        <div className={styles.fieldItemWrapper}>
                            <div className={styles.icon}>
                                {getFieldTypeEelment({ type }, 20)}
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.name}>
                                    <span
                                        title={name}
                                        className={styles.nameText}
                                    >
                                        {name}
                                    </span>
                                    {isPrimary && (
                                        <span className={styles.nameIcon}>
                                            {record?.suffixIcon}
                                        </span>
                                    )}
                                </div>
                                <div title={code} className={styles.code}>
                                    {code}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                title: __('信息项名称'),
                key: 'info_name',
                width: 180,
                render: (text, record) => {
                    const name = record.info_business_name
                    const code = record.info_technical_name
                    const type = record?.info_data_type
                    const isPrimary = record?.is_primary
                    return (
                        <div className={styles.fieldItemWrapper}>
                            <div className={styles.icon}>
                                {getFieldTypeEelment({ type }, 20)}
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.name}>
                                    <span
                                        title={name}
                                        className={styles.nameText}
                                    >
                                        {name}
                                    </span>
                                    {isPrimary && (
                                        <span className={styles.nameIcon}>
                                            {record?.suffixIcon}
                                        </span>
                                    )}
                                </div>
                                <div title={code} className={styles.code}>
                                    {code}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                title: isEidt ? (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('来源系统')}
                        </span>
                        <Select
                            placeholder={__('多项值')}
                            style={{ width: '100%' }}
                            value={appSystem}
                            options={DataProcessingList}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            onChange={(val) => {
                                onFieldsChange('all', 'app_system', val)
                            }}
                        />
                    </div>
                ) : (
                    __('来源系统')
                ),
                key: 'app_system',
                dataIndex: 'app_system',
                width: 130,
                ellipsis: true,
                render: (text, record) => {
                    return isEidt ? (
                        <Tooltip
                            title={
                                showError && !text ? __('请选择来源系统') : ''
                            }
                            placement="topLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: '#e60012',
                            }}
                            zIndex={99}
                        >
                            <Select
                                placeholder={__('请选择来源系统')}
                                style={{ width: '100%' }}
                                options={DataProcessingList}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                                status={showError && !text ? 'error' : ''}
                                value={text}
                                onChange={(val) =>
                                    onFieldsChange(
                                        'single',
                                        'app_system',
                                        val,
                                        record?.id,
                                    )
                                }
                            />
                        </Tooltip>
                    ) : (
                        text
                    )
                },
            },
            {
                title: isEidt ? (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('来源系统分类')}
                        </span>
                        <Select
                            placeholder={__('多项值')}
                            style={{ width: '100%' }}
                            value={appSystemType}
                            options={belongSystemClassifyList}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            onChange={(val) => {
                                onFieldsChange('all', 'app_system_type', val)
                            }}
                        />
                    </div>
                ) : (
                    __('来源系统分类')
                ),
                key: 'app_system_type',
                dataIndex: 'app_system_type',
                width: 130,
                ellipsis: true,
                render: (text, record) => {
                    return isEidt ? (
                        <Tooltip
                            title={
                                showError && !text
                                    ? __('请选择来源系统分类')
                                    : ''
                            }
                            placement="topLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: '#e60012',
                            }}
                            zIndex={99}
                        >
                            <Select
                                placeholder={__('请选择来源系统分类')}
                                style={{ width: '100%' }}
                                options={belongSystemClassifyList}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                                value={text}
                                status={showError && !text ? 'error' : ''}
                                onChange={(val) =>
                                    onFieldsChange(
                                        'single',
                                        'app_system_type',
                                        val,
                                        record?.id,
                                    )
                                }
                            />
                        </Tooltip>
                    ) : (
                        belongSystemClassifyList.find(
                            (item) => item.value === text,
                        )?.label
                    )
                },
            },
            {
                title: isEidt ? (
                    <div className={styles.tableTitleContainer}>
                        <span className={styles.fieldLabel}>
                            {__('信息项分级')}
                        </span>
                        <Select
                            placeholder={__('多项值')}
                            style={{ width: '100%' }}
                            value={infoItemLevel}
                            options={sensitivityLevelList}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                            onChange={(val) => {
                                onFieldsChange('all', 'info_item_level', val)
                            }}
                        />
                    </div>
                ) : (
                    __('信息项分级')
                ),
                key: 'info_item_level',
                dataIndex: 'info_item_level',
                width: 130,
                ellipsis: true,
                render: (text, record) => {
                    return isEidt ? (
                        <Tooltip
                            title={
                                showError && !text ? __('请选择信息项分级') : ''
                            }
                            placement="topLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: '#e60012',
                            }}
                            zIndex={99}
                        >
                            <Select
                                placeholder={__('请选择信息项分级')}
                                style={{ width: '100%' }}
                                options={sensitivityLevelList}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                                value={text}
                                status={showError && !text ? 'error' : ''}
                                onChange={(val) =>
                                    onFieldsChange(
                                        'single',
                                        'info_item_level',
                                        val,
                                        record?.id,
                                    )
                                }
                            />
                        </Tooltip>
                    ) : (
                        sensitivityLevelList.find((item) => item.value === text)
                            ?.label
                    )
                },
            },
            {
                title: __('字段长度'),
                key: 'data_length',
                dataIndex: 'data_length',
                width: 120,
                render: (text) => (text === 0 ? text : text || '--'),
            },
            {
                title: __('共享类型'),
                key: 'shared_type',
                dataIndex: 'shared_type',
                ellipsis: true,
                width: 120,
                render: (text, record) => {
                    const label = shareTypeList.find(
                        (item) => item.value === text,
                    )?.label
                    const condition = record?.shared_condition
                        ? `（${record?.shared_condition}）`
                        : ''
                    return `${label}${condition}`
                },
            },
            {
                title: __('开放类型'),
                key: 'open_type',
                dataIndex: 'open_type',
                ellipsis: true,
                width: 120,
                render: (text, record) => {
                    const label = openTypeList.find(
                        (item) => item.value === text,
                    )?.label
                    const condition = record?.open_condition
                        ? `（${record?.open_condition}）`
                        : ''
                    return (
                        <span
                            title={`${label}${condition}`}
                        >{`${label}${condition}`}</span>
                    )
                },
            },
            {
                title: __('值域'),
                key: 'ranges',
                dataIndex: 'ranges',
                ellipsis: true,
                width: 120,
            },
        ]

        return (
            <Table
                ref={tableRef}
                pagination={false}
                rowKey={(record, index) => index || 0}
                dataSource={tableData}
                columns={
                    showMore
                        ? columns
                        : columns.filter((item) =>
                              defaultKeys.includes(item.key),
                          )
                }
                className={styles.paramTable}
                scroll={{
                    x: 1092,
                }}
                sticky
                locale={{
                    emptyText: <Empty />,
                }}
            />
        )
    },
)
export default InfoItemEditTable
