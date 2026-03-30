import { Select, Switch, Table, Tooltip } from 'antd'
import React, {
    forwardRef,
    ReactNode,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { isEmpty, pick } from 'lodash'
import { methodMap } from '@/components/Desensitization'
import {
    FieldTypeIcon,
    formatError,
    getCommonDataType,
    getDesensitizationRule,
} from '@/core'
import { ListPagination, ListType, SearchInput } from '@/ui'
import { excelTechnicalNameReg } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { PrivacyProtectionTooltip } from '../Details/helper'
import { PreviewBtn } from '../Details/PreviewDesensitizedTable'
import { renderEmpty } from '../helper'
import __ from '../locale'
import { NotFoundContent } from './helper'
import styles from './styles.module.less'

const ErrorTips = (props: { children: ReactNode; errorText?: string }) => {
    const { errorText, children } = props
    return (
        <Tooltip
            title={errorText}
            placement="topLeft"
            color="#fff"
            overlayInnerStyle={{
                color: '#e60012',
            }}
        >
            {children}
        </Tooltip>
    )
}

interface IPushField {
    isCreate: boolean // 新建表 or 已有表
    targetFields: any[] // 选择已有表时需要，已有表字段
    sourceFields: any[] // 来源表字段
    pushFields: any[] // 推送字段
    setPushFields: (value: any[]) => void
    desensitizationRule?: boolean // 启用的脱敏规则
    setDesensitizationRule?: (value: boolean) => void
    ignoreRule?: boolean // 忽略脱敏规则
    sticky?: boolean // 是否固定表头
    ref: any
}

const DEFAULT_LIMIT = 10

/**
 * 推送字段
 */
const PushField: React.FC<IPushField> = forwardRef((props: any, ref) => {
    const {
        isCreate,
        sourceFields,
        targetFields,
        pushFields,
        setPushFields,
        desensitizationRule,
        setDesensitizationRule,
        ignoreRule = true,
        sticky = false,
    } = props
    // 添加表格引用
    const sourceTableRef = useRef<HTMLDivElement>(null)
    const targetTableRef = useRef<HTMLDivElement>(null)
    const arrowArrRef = useRef<HTMLDivElement>(null)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    // 编辑数据
    const [editItem, setEditItem] = useState<any>()
    const [offset, setOffset] = useState(1)
    const [limit, setLimit] = useState(DEFAULT_LIMIT)
    // 脱敏规则列表
    const [privacyRule, setPrivacyRule] = useState<any[]>([])

    const showSourceFields = useMemo(() => {
        return sourceFields.slice((offset - 1) * limit, offset * limit)
    }, [offset, limit, sourceFields])

    const showPushFields = useMemo(() => {
        return pushFields.slice((offset - 1) * limit, offset * limit)
    }, [offset, limit, pushFields])

    useImperativeHandle(ref, () => ({
        validate: () => validate(),
    }))

    const validateRule = {
        technical_name: {
            pattern: excelTechnicalNameReg,
            message: __('技术名称不能使用\\ /:*?"<>|，且不能使用大写字母'),
            nullMsg: isCreate ? __('输入不能为空') : __('请选择'),
        },
        data_type: {},
        //  isCreate
        //     ? {
        //           nullMsg: __('请选择数据类型'),
        //       }
        //     : {},
        data_length: {},
        // isCreate
        //     ? {
        //           decimal: {
        //               pattern: /^([1-9]|[1-2][0-9]|3[0-8])$/,
        //               message: __('请输入1~38之间的整数'),
        //               nullMsg: __('输入不能为空'),
        //           },
        //           char: {
        //               pattern:
        //                   /^([1-9]|[1-9][0-9]{1,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
        //               message: __('请输入1～65535之间的整数'),
        //           },
        //       }
        //     : {},
        comment: {},
    }

    const checkDuplicateName = (
        val: string,
        key: string,
        currentId: string,
        fieldList: any[] = pushFields,
    ) => {
        return fieldList
            .filter((item) => item.selected_flag)
            .some(
                (item) =>
                    item[key] === val && item.source_field_id !== currentId,
            )
    }

    const setErrorText = (
        key: string,
        val: any,
        record?: any,
        fieldList: any[] = pushFields,
    ) => {
        const type = getCommonDataType(record?.data_type)

        // 非空校验
        if (!val && val !== 0) {
            if (key === 'data_length') {
                return validateRule?.[key]?.[type]?.nullMsg
            }
            return validateRule?.[key]?.nullMsg
        }

        // 选择已有表只进行非空校验
        if (!isCreate) {
            return ''
        }

        // 英文名称重复校验
        if (
            key === 'technical_name' &&
            checkDuplicateName(val, key, record?.source_field_id, fieldList)
        ) {
            return __('该英文名称名称已存在，请重新输入')
        }

        // 正则校验
        if (
            validateRule?.[key]?.pattern &&
            !validateRule?.[key]?.pattern?.test(val)
        ) {
            return validateRule?.[key]?.message
        }
        if (
            key === 'data_length' &&
            validateRule?.[key]?.[type]?.pattern &&
            !validateRule?.[key]?.[type]?.pattern?.test(val)
        ) {
            return validateRule?.[key]?.[type]?.message
        }
        return ''
    }

    const getErrInfo = (list: any[]) => {
        const sumArr = list.map((item) => {
            return Object.values(item?.errorTips || {})?.filter((it) => it)
                ?.length
        })
        const total = sumArr.reduce((pre, cur) => pre + cur, 0)
        return total
    }

    const validate = () => {
        const requiredKeys = Object.keys(validateRule)
        const list = pushFields.map((item) => {
            let errorTips: any = {}
            requiredKeys.forEach((it) => {
                errorTips = {
                    ...errorTips,
                    [it]: item.selected_flag
                        ? setErrorText(it, item[it], item)
                        : '',
                }
            })
            const noErr = isEmpty(errorTips)
            return noErr
                ? item
                : {
                      ...item,
                      errorTips,
                  }
        })
        setPushFields(list)
        return {
            validateStatus: getErrInfo(list) === 0,
            list,
        }
    }

    // 箭头数组
    const arrowArr = useMemo(
        () => Array(showSourceFields.length).fill('⇀'),
        [showSourceFields],
    )

    const getRuleList = async () => {
        try {
            const res = await getDesensitizationRule({
                limit: 2000,
                offset: 1,
                sort: 'updated_at',
                direction: 'desc',
                keyword: '',
            })
            setPrivacyRule(res?.entries || [])
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        if (!ignoreRule) {
            getRuleList()
        }
    }, [ignoreRule])

    const methodNum = (rule: any) => {
        if (rule.method === 'middle') {
            return __('（中间脱敏${num}位）', { num: rule.middle_bit })
        }
        if (rule.method === 'head-tail') {
            return __('（首部脱敏${num1}位，尾部脱敏${num2}位）', {
                num1: rule.head_bit,
                num2: rule.tail_bit,
            })
        }
        return ''
    }

    const ruleOptions = useMemo(() => {
        return privacyRule.map((item) => ({
            ...item,
            value: item.id,
            label: (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: 40,
                        justifyContent: 'center',
                        rowGap: 6,
                    }}
                >
                    <div
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                        }}
                        title={item.name}
                    >
                        {item.name}
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: 'rgb(0 0 0 / 45%)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1,
                        }}
                        title={`${__('脱敏方式：')}${
                            methodMap[item.method]
                        }${methodNum(item)}`}
                    >
                        {`${__('脱敏方式：')}${
                            methodMap[item.method]
                        }${methodNum(item)}`}
                    </div>
                </div>
            ),
        }))
    }, [privacyRule])

    useEffect(() => {
        setSelectedRowKeys(
            pushFields
                .filter((item) => item.selected_flag)
                .map((item) => item.source_field_id),
        )
        setEditItem(undefined)
    }, [pushFields])

    // // 修改滚动同步处理函数
    // const handleTableScroll = (e: Event, isSource: boolean) => {
    //     const { scrollTop } = e.target as HTMLElement
    //     if (isSource && targetTableRef.current) {
    //         const targetBody = targetTableRef.current?.querySelector(
    //             '.any-fabric-ant-table-body',
    //         )
    //         if (targetBody) {
    //             targetBody.scrollTop = scrollTop
    //         }
    //         if (arrowArrRef.current) {
    //             arrowArrRef.current.scrollTop = scrollTop
    //         }
    //     } else if (!isSource && sourceTableRef.current) {
    //         const sourceBody = sourceTableRef.current?.querySelector(
    //             '.any-fabric-ant-table-body',
    //         )
    //         if (sourceBody) {
    //             sourceBody.scrollTop = scrollTop
    //         }
    //         if (arrowArrRef.current) {
    //             arrowArrRef.current.scrollTop = scrollTop
    //         }
    //     }
    // }

    // // 添加滚动事件监听
    // useEffect(() => {
    //     const sourceBody = sourceTableRef?.current?.querySelector(
    //         '.any-fabric-ant-table-body',
    //     )
    //     const targetBody = targetTableRef?.current?.querySelector(
    //         '.any-fabric-ant-table-body',
    //     )
    //     if (sourceBody) {
    //         sourceBody.addEventListener('scroll', (e) =>
    //             handleTableScroll(e, true),
    //         )
    //     }
    //     if (targetBody) {
    //         targetBody.addEventListener('scroll', (e) =>
    //             handleTableScroll(e, false),
    //         )
    //     }
    //     return () => {
    //         if (sourceBody) {
    //             sourceBody.removeEventListener('scroll', (e) =>
    //                 handleTableScroll(e, true),
    //             )
    //         }
    //         if (targetBody) {
    //             targetBody.removeEventListener('scroll', (e) =>
    //                 handleTableScroll(e, false),
    //             )
    //         }
    //     }
    // }, [sourceFields, targetFields])

    // 来源表列
    const sourceColumns = [
        {
            title: __('字段名称'),
            dataIndex: 'field_name',
            key: 'field_name',
            width: '22%',
            render: (value, record) => {
                const { business_name, technical_name, primary_key } = record
                return (
                    <div className={styles.twoLine}>
                        <div className={styles.name_desc}>
                            <span
                                className={styles.firstLine}
                                title={business_name}
                            >
                                {business_name}
                            </span>
                            {primary_key && (
                                <span className={styles.primaryKey}>
                                    {__('主键')}
                                </span>
                            )}
                        </div>
                        <span
                            className={styles.secondLine}
                            title={technical_name}
                        >
                            {technical_name || '--'}
                        </span>
                    </div>
                )
            },
        },
        // {
        //     title: __('数据类型'),
        //     dataIndex: 'data_type',
        //     key: 'data_type',
        //     ellipsis: true,
        //     render: (value) => getDataTypeByStr(value)?.label || '--',
        // },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            width: '16%',
            render: (value) => value?.toLowerCase() || '--',
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            width: '16%',
            render: (value) => value || '--',
        },
        {
            title: __('注释'),
            dataIndex: 'comment',
            key: 'comment',
            ellipsis: true,
            width: '18%',
            render: (value) => value || '--',
        },
        {
            title: __('引用脱敏规则'),
            dataIndex: 'desensitization_rule_id',
            key: 'desensitization_rule_id',
            render: (_, record, index) => {
                const findItem = pushFields.find(
                    (item) => item.source_field_id === record.id,
                )
                const name = findItem?.desensitization_rule_name
                const value = name
                    ? findItem?.desensitization_rule_id
                    : undefined
                const statusText = value && !name ? __('引用规则已不存在') : ''
                return (
                    <div className={styles.deRuleWrap}>
                        <ErrorTips errorText={statusText}>
                            <Select
                                style={{
                                    width: `calc(100% - ${name ? 34 : 0}px)`,
                                }}
                                showSearch
                                allowClear
                                value={value}
                                placeholder={__('请选择')}
                                options={ruleOptions}
                                disabled={!desensitizationRule}
                                onSelect={(val, option) => {
                                    onFieldsChange(
                                        [
                                            'desensitization_rule_id',
                                            'desensitization_rule_name',
                                        ],
                                        [val, option?.name],
                                        {
                                            ...record,
                                            source_field_id: record.id,
                                        },
                                    )
                                }}
                                onClear={() => {
                                    onFieldsChange(
                                        [
                                            'desensitization_rule_id',
                                            'desensitization_rule_name',
                                        ],
                                        ['', ''],
                                        {
                                            ...record,
                                            source_field_id: record.id,
                                        },
                                    )
                                }}
                                dropdownStyle={{
                                    minWidth: 300,
                                }}
                                optionFilterProp="name"
                                optionLabelProp="name"
                                status={statusText ? 'error' : ''}
                                notFoundContent={
                                    ruleOptions.length === 0 ? (
                                        <NotFoundContent />
                                    ) : (
                                        <NotFoundContent
                                            text={__('抱歉，没有找到相关内容')}
                                        />
                                    )
                                }
                            />
                        </ErrorTips>
                        {name && (
                            <PreviewBtn
                                fieldData={{
                                    ...record,
                                    desensitization_rule_id: value,
                                }}
                            />
                        )}
                    </div>
                )
            },
        },
    ]

    const fieldOptions = useMemo(() => {
        const selectedFields = pushFields
            .map((item) => item.technical_name)
            .filter((item) => item)
        return targetFields.map((item) => {
            const isSelected = selectedFields.includes(item.technical_name)
            return {
                disabled: isSelected,
                value: item.technical_name,
                label: (
                    <span className={classnames(styles.targetFieldOption)}>
                        <span className={styles.fieldInfo}>
                            <FieldTypeIcon dataType={item.data_type} />
                            <span className={styles.fieldName}>
                                {item.technical_name}
                            </span>
                        </span>
                        {isSelected && (
                            <span className={styles.selectedTips}>
                                {__('已关联')}
                            </span>
                        )}
                    </span>
                ),
            }
        })
    }, [targetFields, pushFields])

    const onFieldsChange = (key: string | string[], val: any, record?: any) => {
        const list = pushFields.map((item) => {
            const isCurrent = item.source_field_id === record?.source_field_id
            let info = {
                ...item,
            }
            if (Array.isArray(key)) {
                key.forEach((it, idx) => {
                    info[it] = isCurrent ? val[idx] : item[it]
                })
            } else {
                info[key] = isCurrent ? val : item[key]
            }
            if (isCurrent) {
                if (isCreate && key === 'data_type') {
                    if (['char', 'decimal'].includes(val)) {
                        info.errorTips = {
                            ...info.errorTips,
                            data_length: info.selected_flag
                                ? setErrorText(
                                      'data_length',
                                      info.data_length,
                                      info,
                                  )
                                : '',
                        }
                    } else {
                        info.data_length = ''
                        info.errorTips = {
                            ...info.errorTips,
                            data_length: '',
                        }
                    }
                }
                if (!isCreate && key === 'technical_name') {
                    if (val) {
                        const findTargetField: any = targetFields.find(
                            (item2) => item2.technical_name === val,
                        )
                        if (findTargetField) {
                            info = {
                                ...info,
                                ...findTargetField,
                                business_name: sourceFields.find(
                                    (item2) =>
                                        item2.id === record?.source_field_id,
                                )?.business_name,
                            }
                        }
                    } else {
                        info = {
                            ...pick(info, [
                                'source_field_id',
                                'business_name',
                                'desensitization_rule_id',
                                'desensitization_rule_name',
                            ]),
                        }
                    }
                }
            }

            const errorTips = {
                ...info?.errorTips,
            }
            if (Array.isArray(key)) {
                errorTips[key[0]] = info.selected_flag
                    ? setErrorText(key[0], val[0], info)
                    : ''
            } else {
                errorTips[key] = info.selected_flag
                    ? setErrorText(key, val, info)
                    : ''
            }
            const noErr = isEmpty(errorTips)
            return !noErr && isCurrent
                ? {
                      ...info,
                      errorTips,
                  }
                : info
        })
        setPushFields(list)
    }

    const redDot = (
        <span
            style={{
                color: '#F5222D',
                fontFamily: 'SimSun, sans-serif',
                marginRight: 4,
            }}
        >
            *
        </span>
    )

    // 目标表列
    const targetColumns = [
        {
            title: (
                <span>
                    {redDot}
                    {__('英文名称')}
                </span>
            ),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
            render: (value, record) => (
                <ErrorTips errorText={record?.errorTips?.technical_name}>
                    {isCreate ? (
                        <SearchInput
                            showIcon={false}
                            allowClear={false}
                            style={{
                                width: '100%',
                            }}
                            value={value}
                            status={
                                record?.errorTips?.technical_name ? 'error' : ''
                            }
                            autoComplete="off"
                            placeholder={__('请输入')}
                            onBlur={(e) => {
                                onFieldsChange(
                                    'technical_name',
                                    e.target?.value?.trim(),
                                    record,
                                )
                            }}
                        />
                    ) : (
                        <Select
                            style={{ width: '100%' }}
                            showSearch
                            allowClear
                            options={fieldOptions}
                            placeholder={__('请选择')}
                            onSelect={(val, option) => {
                                onFieldsChange('technical_name', val, record)
                            }}
                            onClear={() => {
                                onFieldsChange('technical_name', '', record)
                            }}
                            status={
                                record?.errorTips?.technical_name ? 'error' : ''
                            }
                            optionLabelProp="value"
                            value={value}
                            notFoundContent={
                                fieldOptions.length === 0 ? (
                                    <NotFoundContent />
                                ) : (
                                    <NotFoundContent
                                        text={__('抱歉，没有找到相关内容')}
                                    />
                                )
                            }
                        />
                    )}
                </ErrorTips>
            ),
        },
        {
            title: (
                <span>
                    {redDot}
                    {__('数据类型')}
                </span>
            ),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            width: '16%',
            render: (value, record) =>
                // isCreate ? (
                //     <ErrorTips errorText={record?.errorTips?.data_type}>
                //         <Select
                //             style={{ width: '100%' }}
                //             allowClear
                //             options={typeOptoins
                //                 .slice(0, typeOptoins.length - 1)
                //                 .map((item) => ({
                //                     value: item.strValue,
                //                     label: item.label,
                //                 }))}
                //             placeholder={__('请选择')}
                //             onSelect={(val, option) => {
                //                 onFieldsChange('data_type', val, record)
                //             }}
                //             status={record?.errorTips?.data_type ? 'error' : ''}
                //             value={value}
                //         />
                //     </ErrorTips>
                // ) : (
                value?.toLowerCase() || '--',
            // getDataTypeByStr(getCommonDataType(value))?.label || '--',
            // ),
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            width: '16%',
            render: (value, record) => {
                const { data_type } = record
                return value || '--'
                // return isCreate ? (
                //     <ErrorTips errorText={record?.errorTips?.data_length}>
                //         <NumberInput
                //             type={NumberType.PositiveInteger}
                //             status={
                //                 record?.errorTips?.data_length ? 'error' : ''
                //             }
                //             disabled={!['char', 'decimal'].includes(data_type)}
                //             style={{ width: '100%' }}
                //             placeholder={
                //                 data_type === 'decimal'
                //                     ? __('请输入（必填）')
                //                     : __('请输入')
                //             }
                //             value={
                //                 editItem?.source_field_id ===
                //                 record.source_field_id
                //                     ? editItem?.data_length
                //                     : value || ''
                //             }
                //             onChange={(val) =>
                //                 setEditItem({
                //                     ...record,
                //                     data_length: val,
                //                 })
                //             }
                //             onBlur={(val) => {
                //                 onFieldsChange('data_length', val, record)
                //                 setEditItem(undefined)
                //             }}
                //         />
                //     </ErrorTips>
                // ) : (
                //     value || '--'
                // )
            },
        },
        {
            title: __('注释'),
            dataIndex: 'comment',
            key: 'comment',
            ellipsis: true,
            render: (value, record, index) =>
                isCreate ? (
                    <SearchInput
                        showIcon={false}
                        placeholder={__('请输入')}
                        allowClear
                        value={value}
                        autoComplete="off"
                        maxLength={300}
                        onBlur={(e) => {
                            onFieldsChange(
                                'comment',
                                e.target?.value?.trim(),
                                record,
                            )
                        }}
                    />
                ) : (
                    value || '--'
                ),
        },
        Table.SELECTION_COLUMN,
    ]

    // 行选择变更
    const onRowSelectionChange = (selected: boolean, keys: React.Key[]) => {
        const newSelectedRowKeys = selected
            ? [...selectedRowKeys, ...keys]
            : [...selectedRowKeys].filter((item) => !keys.includes(item))
        setSelectedRowKeys(newSelectedRowKeys)
        const list = pushFields.map((item) => {
            const isSelected = newSelectedRowKeys.includes(item.source_field_id)
            const info = {
                ...item,
                selected_flag: isSelected,
            }
            return info
        })
        setPushFields(
            list.map((item) => {
                const info = item
                Object.keys(validateRule).forEach((it) => {
                    const errorTips = {
                        ...info?.errorTips,
                        [it]: info.selected_flag
                            ? setErrorText(it, info[it], info, list)
                            : '',
                    }
                    info.errorTips = errorTips
                })
                return info
            }),
        )
    }

    const confirmText = () =>
        confirm({
            icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
            focusTriggerAfterClose: false, // 取消后不触发按钮聚焦
            okText: __('确定'),
            cancelText: __('取消'),
            keyboard: false,
            title: __('确定关闭吗？'),
            content: __('关闭隐私数据保护，可能导致隐私数据泄露。'),
            onOk() {
                setDesensitizationRule(false)
            },
            onCancel() {},
        })

    return (
        <div
            className={classnames(styles.pushField, {
                [styles.stickyPushField]: sticky,
            })}
        >
            <div className={styles.pushFieldTableWrap}>
                <div className={styles.fieldSourceTable}>
                    <span className={styles.fieldTableTitle}>
                        <span>
                            {__('来源表字段')}（
                            {
                                pushFields.filter((item) => item.selected_flag)
                                    .length
                            }
                            /{sourceFields.length}）
                        </span>
                        {!ignoreRule && (
                            <span className={styles.privacyProtection}>
                                {__('隐私数据保护')}
                                <PrivacyProtectionTooltip />
                                <Switch
                                    style={{ marginLeft: 4 }}
                                    size="small"
                                    checked={desensitizationRule}
                                    onChange={(checked) => {
                                        if (!checked) {
                                            confirmText()
                                        } else {
                                            setDesensitizationRule(true)
                                        }
                                    }}
                                />
                            </span>
                        )}
                    </span>
                    <Table
                        ref={sourceTableRef}
                        dataSource={showSourceFields}
                        columns={
                            ignoreRule
                                ? sourceColumns.slice(0, -1)
                                : sourceColumns
                        }
                        rowKey="id"
                        rowClassName={styles.tableRow}
                        className={styles.pushFieldTable}
                        pagination={false}
                        locale={{
                            emptyText: renderEmpty(0, 104),
                        }}
                    />
                </div>
                <div className={styles.arrowArr} ref={arrowArrRef}>
                    <div className={styles.place} />
                    <div className={styles.arrows}>
                        {arrowArr.map((item, index) => (
                            <span key={index} className={styles.arrowItem}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={styles.fieldTargetTable}>
                    <span className={styles.fieldTableTitle}>
                        {__('目标表字段')}（
                        {isCreate
                            ? `${
                                  pushFields.filter(
                                      (item) => item.selected_flag,
                                  ).length
                              }/${sourceFields.length}`
                            : `${
                                  pushFields.filter(
                                      (item) => item.technical_name,
                                  ).length
                              }/${targetFields.length}`}
                        ）
                    </span>
                    <Table
                        ref={targetTableRef}
                        dataSource={showPushFields}
                        columns={targetColumns}
                        rowKey="source_field_id"
                        rowClassName={styles.tableRow}
                        className={styles.pushFieldTable}
                        rowSelection={{
                            fixed: 'right',
                            selectedRowKeys,
                            onSelect: (record, selected) => {
                                onRowSelectionChange(selected, [
                                    record.source_field_id,
                                ])
                            },
                            onSelectAll: (
                                selected,
                                selectedRows,
                                changeRows,
                            ) => {
                                onRowSelectionChange(
                                    selected,
                                    changeRows.map(
                                        (item) => item.source_field_id,
                                    ),
                                )
                            },
                        }}
                        pagination={false}
                        locale={{
                            emptyText: renderEmpty(0, 104),
                        }}
                    />
                </div>
            </div>
            {sourceFields.length > DEFAULT_LIMIT && (
                <div className={styles.paginationTable}>
                    <ListPagination
                        listType={ListType.WideList}
                        queryParams={{
                            offset,
                            limit,
                        }}
                        totalCount={sourceFields.length}
                        onChange={(page, pageSize) => {
                            setOffset(page)
                            setLimit(pageSize)
                        }}
                        hideOnSinglePage={sourceFields.length <= DEFAULT_LIMIT}
                    />
                </div>
            )}
        </div>
    )
})

export default PushField
