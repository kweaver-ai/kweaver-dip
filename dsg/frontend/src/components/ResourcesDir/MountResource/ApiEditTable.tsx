import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
} from 'react'
import { Table, Select, Checkbox, Tooltip, Button, Form } from 'antd'
import { debounce, noop, set } from 'lodash'
import type { ColumnsType } from 'antd/es/table'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { ParameterTypeList } from '../const'
import styles from './styles.module.less'
import __ from '../locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RadioBox } from '@/components/FormTableMode/helper'

export enum ColumnKeys {
    name = 'name',
    data_type = 'type',
    isArray = 'is_array',
    required = 'required',
    default_value = 'has_content',
    description = 'description',
}
interface IApiEditTable {
    value?: Array<any>
    onChange?: (value) => void
    isEidt?: boolean
    columnKeys?: ColumnKeys[]
}
const ApiEditTable = forwardRef(
    (
        { value = [], isEidt, onChange = noop, columnKeys = [] }: IApiEditTable,
        ref,
    ) => {
        const tableRef: any = useRef()
        const parentNode = tableRef?.current
        const [showError, setShowError] = useState<boolean>(false)
        const [tableData, setTableData] = useState<any[]>([])

        useImperativeHandle(ref, () => ({
            setShowError,
        }))

        useEffect(() => {
            if (value?.length) {
                setTableData(value)
            }
        }, [value])

        const onFieldsChange = (key: string, val: any, en_name: string) => {
            const list = value.map((item) => {
                return {
                    ...item,
                    [key]: item.en_name === en_name ? val : item[key],
                }
            })
            onChange?.(list)
        }

        const columns = [
            {
                title: __('参数名称'),
                key: ColumnKeys.name,
                dataIndex: ColumnKeys.name,
                render: (text, record) => {
                    const type = record?.[ColumnKeys.data_type]
                    return (
                        <div className={styles.fieldItemWrapper}>
                            <div className={styles.icon}>
                                {getFieldTypeEelment({ type }, 20)}
                            </div>
                            <div className={styles.nameBox}>
                                <div className={styles.name}>
                                    <span
                                        title={text}
                                        className={styles.nameText}
                                    >
                                        {text}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                title: isEidt ? (
                    <span className={styles.fieldLabel}>{__('类型格式')}</span>
                ) : (
                    __('类型格式')
                ),
                key: ColumnKeys.data_type,
                dataIndex: ColumnKeys.data_type,
                render: (text, record) => {
                    return isEidt ? (
                        <Tooltip
                            title={
                                showError && !text ? __('请选择类型格式') : ''
                            }
                            placement="topLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: '#e60012',
                            }}
                            zIndex={99}
                        >
                            <Select
                                placeholder={__('请选择类型格式')}
                                style={{ width: '100%' }}
                                options={ParameterTypeList}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                                status={showError && !text ? 'error' : ''}
                                value={text}
                                onChange={(val) =>
                                    onFieldsChange(
                                        ColumnKeys.data_type,
                                        val,
                                        record?.en_name,
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
                title: isEidt ? <span>{__('是否数组')}</span> : __('是否数组'),
                key: ColumnKeys.isArray,
                dataIndex: ColumnKeys.isArray,
                render: (text, record) => {
                    return (
                        <RadioBox
                            checked={text}
                            onChange={(val) =>
                                onFieldsChange(
                                    ColumnKeys.isArray,
                                    !!val,
                                    record?.en_name,
                                )
                            }
                            disabled={!isEidt}
                        />
                    )
                },
            },
            {
                title: isEidt ? (
                    <span className={styles.fieldLabel}>{__('是否必传')}</span>
                ) : (
                    __('是否必传')
                ),
                key: ColumnKeys.required,
                dataIndex: ColumnKeys.required,
                render: (text, record) => {
                    return (
                        <Tooltip
                            title={
                                showError && !text && isEidt
                                    ? __('请选择是否必传')
                                    : ''
                            }
                            placement="topLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: '#e60012',
                            }}
                            zIndex={99}
                        >
                            <RadioBox
                                checked={text}
                                onChange={(val) =>
                                    onFieldsChange(
                                        ColumnKeys.required,
                                        !!val,
                                        record?.en_name,
                                    )
                                }
                                disabled={!isEidt}
                            />
                        </Tooltip>
                    )
                },
            },
            {
                title: isEidt ? (
                    <span>{__('是否有内容')}</span>
                ) : (
                    __('是否有内容')
                ),
                key: ColumnKeys.default_value,
                dataIndex: ColumnKeys.default_value,
                render: (text, record) => {
                    return (
                        <Tooltip
                            title={
                                showError && !text && isEidt
                                    ? __('请选择是否有内容')
                                    : ''
                            }
                            placement="topLeft"
                            color="#fff"
                            overlayInnerStyle={{
                                color: '#e60012',
                            }}
                            zIndex={99}
                        >
                            <RadioBox
                                checked={text}
                                onChange={(val) =>
                                    onFieldsChange(
                                        ColumnKeys.default_value,
                                        !!val,
                                        record?.en_name,
                                    )
                                }
                                disabled={!isEidt}
                            />
                        </Tooltip>
                    )
                },
            },
            {
                title: __('描述'),
                key: ColumnKeys.description,
                dataIndex: ColumnKeys.description,
                ellipsis: true,
                width: 200,
            },
        ]

        return (
            <Table
                ref={tableRef}
                pagination={false}
                rowKey={(record, index) => index || 0}
                dataSource={tableData}
                columns={columns.filter((item) =>
                    columnKeys.includes(item.key as ColumnKeys),
                )}
                className={styles.paramTable}
                scroll={{
                    y: 500,
                }}
                locale={{
                    emptyText: (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    ),
                }}
            />
        )
    },
)
export default ApiEditTable
