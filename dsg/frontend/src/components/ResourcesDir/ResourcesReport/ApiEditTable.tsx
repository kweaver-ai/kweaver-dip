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
import { RadioBox } from '@/components/FormTableMode/helper'

interface IApiEditTable {
    value?: Array<any>
    onChange?: (value) => void
    isEidt?: boolean
    columnKeys?: string[]
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
            setTableData(value)
        }, [value])

        const onFieldsChange = (key: string, val: any, id: string) => {
            const list = value.map((item) => {
                return {
                    ...item,
                    [key]: item.id === id ? val : item[key],
                }
            })
            onChange?.(list)
        }

        const columns = [
            {
                title: __('参数名称'),
                key: 'name',
                render: (text, record) => {
                    const { name } = record
                    const type = record?.data_type
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
                key: 'lxgs',
                dataIndex: 'lxgs',
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
                                    onFieldsChange('lxgs', val, record?.id)
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
                    <span className={styles.fieldLabel}>{__('是否数组')}</span>
                ) : (
                    __('是否数组')
                ),
                key: 'sfsz',
                dataIndex: 'sfsz',
                render: (text, record) => {
                    return (
                        <Tooltip
                            title={
                                showError && !text && isEidt
                                    ? __('请选择是否数组')
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
                                    onFieldsChange('sfsz', val, record?.id)
                                }
                                disabled={!isEidt}
                            />
                        </Tooltip>
                    )
                },
            },
            {
                title: isEidt ? (
                    <span className={styles.fieldLabel}>{__('是否必传')}</span>
                ) : (
                    __('是否必传')
                ),
                key: 'sfbc',
                dataIndex: 'sfbc',
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
                                    onFieldsChange('sfbc', val, record?.id)
                                }
                                disabled={!isEidt}
                            />
                        </Tooltip>
                    )
                },
            },
            {
                title: isEidt ? (
                    <span className={styles.fieldLabel}>
                        {__('是否有内容')}
                    </span>
                ) : (
                    __('是否有内容')
                ),
                key: 'sfynr',
                dataIndex: 'sfynr',
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
                                    onFieldsChange('sfynr', val, record?.id)
                                }
                                disabled={!isEidt}
                            />
                        </Tooltip>
                    )
                },
            },
            {
                title: __('描述'),
                key: 'description',
                dataIndex: 'description',
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
                    columnKeys.includes(item.key),
                )}
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
export default ApiEditTable
