import { Button, Form } from 'antd'
import classnames from 'classnames'
import {
    PropsWithRef,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { debounce, isEqualWith } from 'lodash'
import { AddOutlined } from '@/icons'
import { IDatasheetField } from '@/core'
import AttrIcon from '../AttrIcon'
import __ from '../locale'
import { MAX_COUNT_LIMIT, RelationOperator, RowInnerLine } from './CommonItem'
import styles from './styles.module.less'
import { Loader } from '@/ui'
import { useDataViewContext } from '@/components/DatasheetView/DataViewProvider'
import { DATA_TYPE_MAP } from '@/utils'

type IRowFieldItem = IDatasheetField

export interface IRowFilter extends PropsWithRef<any> {
    value: IRowFieldItem[]
    canAdd?: boolean
    initValues?: any
    onChange?: () => void
    exampleData?: any
    loading?: boolean
    addBtnText?: string
    // 是否开启探查结果展示
    openProbe?: boolean
    commonItemWidth?: {
        selectWidt?: number
        operatorWidth?: number
        limitWidth?: number
    }
    isTemplateCustom?: boolean
    isExplorationModal?: boolean
}

const RowFilter = forwardRef(
    (
        {
            initValues,
            canAdd = true,
            value,
            onChange,

            loading,
            addBtnText = __('新增限定'),

            exampleData,
            openProbe,
            commonItemWidth,
            isTemplateCustom,
            isExplorationModal,
        }: IRowFilter,
        ref,
    ) => {
        const { isTemplateConfig } = useDataViewContext()

        const [form] = Form.useForm()
        const [fields, setFields] = useState<IRowFieldItem[]>([])
        // 组间条件
        const [groupRelation, setGroupRelation] = useState<string>('and')
        // 组内条件
        const [memberRelation, setMemberRelation] = useState<string[]>([])

        const [fieldOptions, setFieldOptions] = useState<any[]>([])
        const [errors, setErrors] = useState<string[]>([])
        const lastOrigin = useRef<any>()
        useEffect(() => {
            setFields(value)
        }, [value])

        useEffect(() => {
            onChange?.()
        }, [groupRelation, memberRelation])

        const checkError = async () => {
            // 处理字段变更引起的问题
            const errs: any[] = []
            ;(initValues.where || []).forEach((item, i) => {
                ;(item?.member || []).forEach((it, j) => {
                    const res = value?.find((o) => o.id === it.id)
                    if (!res && !isTemplateCustom) {
                        errs.push([i, j, __('字段变更请重新选择')])
                    }
                    if (
                        res &&
                        res.data_type !== it.data_type &&
                        !isTemplateCustom
                    ) {
                        errs.push([i, j, __('字段类型变更'), it.id])
                    }
                })
            })
            if (errs?.length) {
                form.setFields(
                    errs?.map((it) => {
                        onFieldChange(it[0], it[1])
                        return {
                            name: ['where', it[0], 'member', it[1], 'id'],
                            value:
                                it[2] === __('字段变更请重新选择')
                                    ? undefined
                                    : it[3],
                            errors: [it[2]],
                        }
                    }),
                )

                setErrors(errs?.map((it) => `${it[0]},${it[1]}`))
            }
        }

        const resetError = () => {
            if (errors?.length) {
                form.setFields(
                    errors?.map((it) => {
                        const [i, j] = (it || '').split(',')
                        return {
                            name: ['where', i, 'member', j, 'id'],

                            errors: [],
                        }
                    }),
                )

                setErrors([])
            }
        }

        useEffect(() => {
            if (initValues) {
                if (
                    isEqualWith(lastOrigin.current?.initValues, initValues) &&
                    isEqualWith(lastOrigin.current?.value, value)
                )
                    return
                lastOrigin.current = { initValues, value }
                resetError()
                // 使用 nextTick 确保 Form.List 已完全渲染
                Promise.resolve().then(() => {
                    form.setFieldsValue({ where: initValues.where })
                })
                setGroupRelation(initValues.where_relation)
                setMemberRelation(
                    initValues.where?.map((item) => item.relation),
                )
                if (isTemplateConfig && !value?.length) return
                checkError()
            } else {
                form.setFieldsValue({ where: [] })
                setGroupRelation('and')
                setMemberRelation([])
            }
        }, [initValues, value])

        useImperativeHandle(ref, () => ({
            onFinish,
            getSnapshot,
            onValidateFields,
        }))

        const onValidateFields = async () => {
            const values = await form.validateFields()

            return values
        }

        const getSnapshot = async () => {
            const values = await form.getFieldsValue()
            values.where = values.where?.map((item, index: number) => ({
                relation: memberRelation?.[index],
                member: item?.member?.map((m) => {
                    const targetField: IDatasheetField = fields.find(
                        (f: IDatasheetField) => f.id === m?.id,
                    )!
                    return {
                        ...m,
                        name_en: targetField?.technical_name,
                        data_type: targetField?.data_type,
                        name: targetField?.business_name,
                    }
                }),
            }))
            values.where_relation = groupRelation

            return values
        }

        const onFinish = async () => {
            const values = await form.validateFields()

            if (!values.where) {
                return {}
            }
            values.where = values.where?.map((item, index: number) => {
                const obj = {
                    relation: memberRelation?.[index],
                    member: item.member?.map((m) => {
                        const targetField: IDatasheetField = fields.find(
                            (f: IDatasheetField) => f.id === m.id,
                        )!
                        return {
                            ...m,
                            name_en: targetField?.technical_name,
                            data_type: targetField?.data_type,
                            name: isTemplateConfig
                                ? m?.id
                                : targetField?.business_name,
                        }
                    }),
                }
                return obj
            })
            values.where_relation = groupRelation
            return values
        }

        useEffect(() => {
            setFieldOptions(
                fields.map((field) => {
                    const disabled = DATA_TYPE_MAP.time.includes(
                        field.data_type,
                    )
                    return {
                        label: (
                            <span
                                title={
                                    disabled
                                        ? __('当前不支持选择此类型的字段')
                                        : ''
                                }
                                className={styles['option-label']}
                            >
                                <AttrIcon type={field.data_type} size={16} />
                                <span
                                    className={classnames(
                                        styles['option-label-name'],
                                        disabled && styles.disabled,
                                    )}
                                    title={
                                        disabled
                                            ? __('当前不支持选择此类型的字段')
                                            : field.business_name
                                    }
                                >
                                    {field.business_name}
                                </span>
                            </span>
                        ),
                        value: field.id,
                        disabled,
                    }
                }),
            )
        }, [fields])

        const onFieldChange = (i, j) => {
            if (errors?.includes(`${i},${j}`)) {
                form.setFields([
                    {
                        name: ['where', i, 'member', j, 'id'],
                        errors: [],
                    },
                ])
                setErrors((prev) => prev.filter((o) => o !== `${i},${j}`))
            }

            if (!isTemplateCustom) {
                form.setFieldValue(
                    ['where', i, 'member', j, 'operator'],
                    undefined,
                )
                form.setFieldValue(
                    ['where', i, 'member', j, 'value'],
                    undefined,
                )
                form.setFields([
                    {
                        name: ['where', i, 'member', j, 'operator'],
                        errors: [],
                    },
                    {
                        name: ['where', i, 'member', j, 'value'],
                        errors: [],
                    },
                ])
            }
        }

        const onConditionChange = (i, j) => {
            if (!isTemplateCustom) {
                form.setFieldValue(
                    ['where', i, 'member', j, 'value'],
                    undefined,
                )
                form.setFields([
                    {
                        name: ['where', i, 'member', j, 'value'],
                        errors: [],
                    },
                ])
            }
        }

        return (
            <div className={styles['row-filter']}>
                {loading ? (
                    <div style={{ height: '100px' }}>
                        <Loader />
                    </div>
                ) : (
                    <Form
                        form={form}
                        onFinish={onFinish}
                        autoComplete="off"
                        onValuesChange={onChange}
                    >
                        <Form.List name="where">
                            {(
                                outerFields,
                                { add: addGroup, remove: removeGroup },
                            ) => {
                                return (
                                    <>
                                        <div
                                            className={
                                                styles['row-filter-outer']
                                            }
                                        >
                                            {outerFields.length > 1 && (
                                                <RelationOperator
                                                    value={groupRelation}
                                                    onChange={(val) => {
                                                        setGroupRelation(val)
                                                    }}
                                                />
                                            )}
                                            <div
                                                className={classnames(
                                                    styles['groups-container'],
                                                    outerFields.length > 1 &&
                                                        styles[
                                                            'groups-container-with-operator'
                                                        ],
                                                )}
                                            >
                                                {outerFields.map(
                                                    (outerItem, outerIdx) => {
                                                        return (
                                                            <RowInnerLine
                                                                key={outerIdx}
                                                                data={fields}
                                                                outerFields={
                                                                    outerFields
                                                                }
                                                                memberRelation={
                                                                    memberRelation
                                                                }
                                                                setMemberRelation={
                                                                    setMemberRelation
                                                                }
                                                                outerItem={
                                                                    outerItem
                                                                }
                                                                outerIdx={
                                                                    outerIdx
                                                                }
                                                                options={
                                                                    fieldOptions
                                                                }
                                                                onConditionChange={
                                                                    onConditionChange
                                                                }
                                                                onFieldChange={
                                                                    onFieldChange
                                                                }
                                                                exampleData={
                                                                    exampleData
                                                                }
                                                                openProbe={
                                                                    openProbe
                                                                }
                                                                removeGroup={
                                                                    removeGroup
                                                                }
                                                                commonItemWidth={
                                                                    commonItemWidth
                                                                }
                                                                isExplorationModal={
                                                                    isExplorationModal
                                                                }
                                                                isTemplateCustom={
                                                                    isTemplateCustom
                                                                }
                                                                isTemplateConfig={
                                                                    isTemplateConfig
                                                                }
                                                            />
                                                        )
                                                    },
                                                )}
                                            </div>
                                        </div>
                                        {canAdd && (
                                            <Button
                                                onClick={() => addGroup()}
                                                type="link"
                                                icon={<AddOutlined />}
                                                className={
                                                    styles['row-filter-add']
                                                }
                                                disabled={
                                                    outerFields.length ===
                                                    MAX_COUNT_LIMIT
                                                }
                                            >
                                                {addBtnText}
                                            </Button>
                                        )}
                                    </>
                                )
                            }}
                        </Form.List>
                    </Form>
                )}
            </div>
        )
    },
)

export default RowFilter
