import {
    Form,
    Select,
    FormInstance,
    TableProps,
    AutoComplete,
    Cascader,
    FormProps,
    Tooltip,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSize } from 'ahooks'
import {
    CSSProperties,
    memo,
    ReactNode,
    useMemo,
    useRef,
    useState,
    useEffect,
} from 'react'
import classnames from 'classnames'
import { DefaultOptionType } from 'antd/lib/cascader'
import styles from './styles.module.less'
import __ from '../locale'
import { FontIcon } from '@/icons'
import { tipLabel } from './helper'

const { List, Item } = Form

export enum FormItemType {
    AUTOCOMPLETE = 'autocomplete',
    SELECT = 'select',
    CASCADER = 'cascader',
}

interface FormItemProps {
    formType: FormItemType
    componentProps?: any
    itemProps?: any
}

export interface CTableColumnItem {
    key: string
    dataIndex: string
    title: ReactNode
    formItem: FormItemProps
    width?: string | number
    split?: string
    fixed?: string
}

const operateColumnWidth = '80px'

const layout = {
    labelCol: { span: 1 },
    wrapperCol: { span: 23 },
}

const validateMessages = {
    required: '',
}

const ConfigTable = (props: {
    name: string
    form: FormInstance
    columns: CTableColumnItem[]
    dataSource?: any[]
    showOperate?: boolean
    scroll?: TableProps<any>['scroll']
    formProps?: FormProps
    enableItemValidator?: boolean
}) => {
    const {
        name,
        form,
        columns,
        scroll,
        formProps,
        dataSource = [],
        showOperate = false,
        enableItemValidator = false,
    } = props
    const tableHeaderRef = useRef<HTMLDivElement>(null)
    const tableBodyRef = useRef<HTMLDivElement>(null)
    const size = useSize(tableHeaderRef)
    const [seletedValues, setSelectedValues] = useState<string[][]>([])
    const allValues = Form.useWatch([], form)

    useEffect(() => {
        ;(allValues?.[name] ?? []).forEach((item, index) => {
            Object.keys(item ?? {}).forEach((key) => {
                // 如果值不存在或者是唯一标识字段的时候，不需要验证
                if (!item[key]) return
                if (key === 'unique' || key === 'comparisonUnique') {
                    if (item[key]) {
                        form.setFields([
                            {
                                name: [name, index, key],
                                errors: [],
                            },
                        ])
                    }
                    return
                }
                const curCol = columns.find((col) => col.dataIndex === key)
                // 级联选择框的值为数组类型
                if (Array.isArray(item[key])) {
                    const allOptions = (
                        curCol?.formItem.componentProps?.options ?? []
                    ).reduce((acc, cur) => {
                        return acc.concat(cur.children ?? [])
                    }, [])
                    if (!allOptions.find((opt) => opt.value === item[key][1])) {
                        form.setFields([
                            {
                                name: [name, index, curCol?.dataIndex],
                                value: '',
                                errors: [''],
                            },
                        ])
                    }
                } else {
                    // 普通选择框的值为字符串
                    const options =
                        curCol?.formItem.componentProps?.options ?? []
                    if (!options.find((opt) => opt.value === item[key])) {
                        form.setFields([
                            {
                                name: [name, index, curCol?.dataIndex],
                                value: undefined,
                                errors: curCol?.formItem?.itemProps?.rules?.find(
                                    (r) => r.required,
                                )?.required
                                    ? ['']
                                    : [],
                            },
                        ])
                    }
                }
            })
        })
    }, [allValues, columns])

    const scrollStyle: CSSProperties = useMemo(() => {
        return {
            overflow: `${scroll && scroll.x ? 'auto' : 'hidden'} ${
                scroll && scroll.y ? 'auto' : 'hidden'
            }`,
            ...(scroll && scroll.y
                ? {
                      maxHeight:
                          typeof scroll?.y === 'number'
                              ? `${scroll.y}px`
                              : scroll.y,
                  }
                : {}),
        }
    }, [scroll])

    const tableHeadStyle = useMemo(() => {
        if (scroll && scroll.x) {
            return {
                overflow: 'hidden',
            } as CSSProperties
        }
        return {}
    }, [scroll?.x])

    const tableBodyStyle = useMemo(() => {
        if (scroll && scroll.x) {
            const width =
                typeof scroll.x === 'number' ? `${scroll.x}px` : scroll.x
            if (
                size?.width &&
                size?.width >= Number(Number.parseInt(width as string, 10))
            ) {
                return {}
            }
            return {
                width,
            } as CSSProperties
        }

        return {} as CSSProperties
    }, [scroll?.x, size?.width])

    const cellStyle = (
        col: Partial<CTableColumnItem>,
        isHead = false,
    ): CSSProperties => {
        const tdStyles = {} as CSSProperties
        if (isHead) {
            tdStyles.textAlign = 'center'
        }
        if (tableBodyStyle?.width && col.width) {
            tdStyles.width =
                typeof col.width === 'number' ? `${col.width}px` : col.width
        }
        if (col.fixed) {
            tdStyles.position = 'sticky'
            tdStyles.background = isHead ? 'rgb(240, 242, 246)' : '#fff'

            if (col.fixed === 'left') {
                const colIndex = columns.findIndex((c) => c.key === col.key)
                const preColWdith =
                    colIndex > 0 ? columns[colIndex - 1].width : 0
                tdStyles.left =
                    colIndex === 0
                        ? 0
                        : typeof preColWdith === 'number'
                        ? `${preColWdith}px`
                        : preColWdith
            }
            if (col.fixed === 'right') {
                const colIndex = columns.findIndex((c) => c.key === col.key)
                // 操作列不在columns中
                if (colIndex < 0) {
                    tdStyles.right = 0
                } else {
                    const nextColWdith =
                        colIndex < columns.length - 1
                            ? columns[colIndex + 1].width
                            : 0
                    tdStyles.right =
                        colIndex === columns.length - 1
                            ? operateColumnWidth
                            : typeof nextColWdith === 'number'
                            ? `${nextColWdith}px`
                            : nextColWdith
                }
            }
        }

        return tdStyles
    }

    const handleScroll = () => {
        if (tableHeaderRef.current && tableBodyRef.current) {
            tableHeaderRef.current.scrollLeft = tableBodyRef.current.scrollLeft
        }
    }

    const listItemValidator = (fieldName) => {
        const values = allValues[name]
        // 初始表单默认有一条空数据
        if (!values.length) {
            return Promise.reject()
        }
        const hasError =
            Object.values(values[fieldName] ?? {}).filter(Boolean).length === 0
        if (hasError) {
            return Promise.reject()
        }
        return Promise.resolve()
    }

    const getCanOptions = (options, dataIndex) => {
        const values = form.getFieldsValue()
        const rows = (values[name] ?? [])
            .map((row) => {
                if (!row || !row[dataIndex]) return undefined
                return row[dataIndex][1]
            })
            .filter(Boolean)

        return options.map((opt) => {
            return {
                ...opt,
                children: opt.children.map((child) => {
                    const isDisabled = rows.includes(child.value)
                    const newChild = {
                        ...child,
                        // 保持和父节点一致，用于搜索过滤
                        data: { name: child.label },
                        label: (
                            <Tooltip
                                title={isDisabled ? __('已存在此比对项') : null}
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0, 0, 0, 0.85)',
                                }}
                            >
                                <span>{child.label}</span>
                            </Tooltip>
                        ),
                    }
                    if (isDisabled) {
                        newChild.disabled = true
                    }
                    return newChild
                }),
            }
        })
    }

    const displayRender = (label: string[]) => {
        return label[label.length - 1]
    }

    const filter = (inputValue: string, path: DefaultOptionType[]) =>
        path.some((option) => {
            return (
                ((option?.data?.name ?? '') as string)
                    .toLowerCase()
                    .indexOf(inputValue.toLowerCase()) > -1
            )
        })

    return (
        <Form
            {...formProps}
            form={form}
            requiredMark={false}
            colon={false}
            initialValues={{ [name]: dataSource }}
            className={styles.configTable}
            validateMessages={validateMessages}
            {...layout}
        >
            <div
                className={styles['configTable-head']}
                ref={tableHeaderRef}
                style={tableHeadStyle}
            >
                <table>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={classnames({
                                        [styles['configTable-cell-fixed']]:
                                            !!col.fixed,
                                    })}
                                    style={cellStyle(col, true)}
                                >
                                    {col.title}
                                </th>
                            ))}
                            {showOperate && (
                                // eslint-disable-next-line jsx-a11y/control-has-associated-label
                                <th
                                    key="add"
                                    style={{
                                        ...cellStyle(
                                            {
                                                fixed: 'right',
                                            },
                                            true,
                                        ),
                                        width: '80px',
                                    }}
                                />
                            )}
                        </tr>
                    </thead>
                </table>
            </div>
            <div
                ref={tableBodyRef}
                className={classnames(styles['configTable-body'], {
                    [styles['configTable-body-Operate']]: showOperate,
                })}
                style={scrollStyle}
                onScroll={handleScroll}
            >
                <table style={tableBodyStyle}>
                    <tbody>
                        <List name={name}>
                            {(fields, { add, remove }) => {
                                return fields.map((field, index) => (
                                    <tr>
                                        {columns.map((col, colIndex) => {
                                            const {
                                                key,
                                                fixed,
                                                split,
                                                dataIndex,
                                                formItem,
                                            } = col
                                            const {
                                                formType,
                                                itemProps,
                                                componentProps,
                                            } = formItem
                                            return (
                                                <td
                                                    key={key}
                                                    className={classnames({
                                                        [styles[
                                                            'configTable-cell-fixed'
                                                        ]]: !!fixed,
                                                    })}
                                                    style={cellStyle(col)}
                                                >
                                                    {formType ===
                                                        FormItemType.AUTOCOMPLETE && (
                                                        <Item
                                                            name={[
                                                                field.name,
                                                                dataIndex,
                                                            ]}
                                                            label={split}
                                                            {...itemProps}
                                                        >
                                                            <AutoComplete
                                                                placeholder={__(
                                                                    '请输入',
                                                                )}
                                                                style={{
                                                                    width: '100%',
                                                                }}
                                                                allowClear
                                                                {...componentProps}
                                                            />
                                                        </Item>
                                                    )}
                                                    {formType ===
                                                        FormItemType.SELECT && (
                                                        <Item
                                                            name={[
                                                                field.name,
                                                                dataIndex,
                                                            ]}
                                                            label={split}
                                                            {...itemProps}
                                                            rules={[
                                                                ...(itemProps?.rules ??
                                                                    []),
                                                                // enableItemValidator
                                                                //     ? {
                                                                //           validator:
                                                                //               () =>
                                                                //                   listItemValidator(
                                                                //                       field.name,
                                                                //                   ),
                                                                //       }
                                                                //     : {},
                                                            ]}
                                                        >
                                                            <Select
                                                                placeholder={__(
                                                                    '请选择',
                                                                )}
                                                                style={{
                                                                    width: '100%',
                                                                }}
                                                                showSearch
                                                                allowClear
                                                                notFoundContent={tipLabel(
                                                                    __(
                                                                        '抱歉，没有找到相关内容',
                                                                    ),
                                                                )}
                                                                {...componentProps}
                                                                onChange={(
                                                                    value,
                                                                    option,
                                                                ) => {
                                                                    componentProps.onChange?.(
                                                                        value,
                                                                        option,
                                                                        index,
                                                                    )
                                                                }}
                                                            />
                                                        </Item>
                                                    )}
                                                    {formType ===
                                                        FormItemType.CASCADER && (
                                                        <Item
                                                            name={[
                                                                field.name,
                                                                dataIndex,
                                                            ]}
                                                            label={split}
                                                            {...itemProps}
                                                        >
                                                            <Cascader
                                                                showSearch={{
                                                                    filter,
                                                                }}
                                                                displayRender={
                                                                    displayRender
                                                                }
                                                                placeholder={__(
                                                                    '请选择/输入',
                                                                )}
                                                                style={{
                                                                    width: '100%',
                                                                }}
                                                                {...componentProps}
                                                                options={getCanOptions(
                                                                    componentProps.options ??
                                                                        [],
                                                                    dataIndex,
                                                                )}
                                                            />
                                                        </Item>
                                                    )}
                                                </td>
                                            )
                                        })}
                                        {showOperate && (
                                            // eslint-disable-next-line jsx-a11y/control-has-associated-label
                                            <td
                                                key="add"
                                                style={{
                                                    ...cellStyle({
                                                        fixed: 'right',
                                                    }),
                                                    width: '80px',
                                                }}
                                            >
                                                <FontIcon
                                                    name="icon-lajitong"
                                                    style={{
                                                        marginRight: '10px',
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={() => {
                                                        if (
                                                            fields.length === 1
                                                        ) {
                                                            form.resetFields([
                                                                ...columns.map(
                                                                    (col) => [
                                                                        name,
                                                                        field.name,
                                                                        col.dataIndex,
                                                                    ],
                                                                ),
                                                            ])
                                                        } else {
                                                            remove(index)
                                                        }
                                                    }}
                                                />
                                                <PlusOutlined
                                                    onClick={() => {
                                                        add()
                                                    }}
                                                />
                                            </td>
                                        )}
                                    </tr>
                                ))
                            }}
                        </List>
                    </tbody>
                </table>
            </div>
        </Form>
    )
}

export default memo(ConfigTable)
