import { Form, Input, message, Select, Space } from 'antd'
import { FormInstance } from 'antd/es/form'
import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { trim } from 'lodash'
import RowAndColFilter from '@/components/RowAndColFilter/RowAndColFilter'
import { AssetTypeEnum, IDatasheetField, ISubView, formatError } from '@/core'
import { keyboardCharactersReg } from '@/utils'
import __ from '../../locale'
import styles from './styles.module.less'
import {
    DefaultAuthID,
    ScopeType,
    ScopeTypeIcon,
    SubviewMode,
} from '../../const'
import { MicroWidgetPropsContext } from '@/context'
import { IScopeItem, labelTextMap } from '../AccessManage/ColAndRowPanel'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

/**
 * 文本合法性校验
 * @param reg RegExp 校验规则
 * @param msg string 错误信息
 * @param emptyMsg string 空值错误信息
 * @returns
 */
export const validateTextSubViewName = (
    names: string[],
    reg: RegExp,
    msg: string,
    emptyMsg: string,
) => {
    return (_: any, value: string) => {
        return new Promise((resolve, reject) => {
            const trimValue = trim(value)
            if (!trimValue) {
                reject(new Error(emptyMsg))
            }

            if (names?.includes(trimValue)) {
                reject(new Error(__('该行/列规则名称已存在，请重新输入')))
            }

            if (!reg.test(trimValue)) {
                reject(new Error(msg))
            }
            resolve(1)
        })
    }
}

// 标题
const headerRender = (title: string, desc: string) => {
    return (
        <div className={styles['filter-header']}>
            <span className={styles['filter-header-title']}>{title}</span>
            <span className={styles['filter-header-desc']}>({desc})</span>
        </div>
    )
}
type IAttr = Pick<ISubView, 'name' | 'detail' | 'auth_scope_id'>

/**
 * 配置申请规则
 */
interface IColRowPanel {
    value: IAttr
    names: string[]
    fields?: IDatasheetField[]
    form: FormInstance<IAttr>
    onFinish: (vaues: IAttr, isPass: boolean) => void
    onDataChange: () => void
    exampleData?: any
    openProbe?: boolean
    type?: AssetTypeEnum
    scopeOptions?: IScopeItem[]
}

const ColRowPanel = forwardRef(
    (
        {
            value,
            fields,
            form,
            names,
            scopeOptions = [],
            onFinish,
            onDataChange,
            exampleData,
            openProbe,
            type = AssetTypeEnum.SubView,
        }: IColRowPanel,
        ref,
    ) => {
        const { microWidgetProps } = useContext(MicroWidgetPropsContext)

        const [scopeId, setScopeId] = useState<string>('')
        const [ruleName, setRuleName] = useState<string>('')
        const [ruleFilter, setRuleFilter] = useState<string>()
        const [currentScope, setCurrentScope] = useState<IScopeItem>()
        const [scopeFields, setScopeFields] = useState<any>()
        const [scopeWhere, setScopeWhere] = useState<any>()
        const filterRef = useRef<any>()

        useEffect(() => {
            const scopeItemDetail = JSON.parse(
                currentScope?.data?.detail || '{}',
            )
            let curFields: unknown
            // 选中授权范围为子视图 scopeFields 为依赖授权范围的字段选中项
            if (currentScope && currentScope.type === ScopeType.Rule) {
                // 当前可选字段范围为授权范围勾选字段
                curFields = fields?.filter((o) =>
                    scopeItemDetail?.fields?.some((f) => f.id === o.id),
                )
            } else {
                // 授权范围为整表  则默认不存储字段  即使用整表字段  兼容原逻辑
                curFields = undefined
            }
            setScopeFields(curFields)
            setScopeWhere(scopeItemDetail?.row_filters)
        }, [currentScope, fields])

        const toast = useMemo(() => {
            return microWidgetProps?.components?.toast || message
        }, [microWidgetProps])

        const handleSure = async ({ name, auth_scope_id }) => {
            const isPass = await filterRef.current?.onValidateFilter()
            const detail = await filterRef.current?.onFinish()
            const values = { name, detail, auth_scope_id }
            if (onFinish) {
                onFinish(values, isPass)
            }
        }

        const init = () => {
            const { name, detail, auth_scope_id } = value || {}
            setRuleName(name || '')
            let sId = auth_scope_id
            if (!sId || sId === DefaultAuthID) {
                sId = scopeOptions?.[0]?.value
            }

            setScopeId(sId || '')
            form.setFields([
                {
                    name: 'name',
                    value: name,
                    errors: [],
                },
                {
                    name: 'auth_scope_id',
                    value: sId,
                    errors: [],
                },
            ])
            const scopeItem = scopeOptions?.find((o) => o.value === sId)
            // 存在默认scope  则获取scope_fields 与 fixed_row_filters  而不获取最新关联scopeId的信息
            if (auth_scope_id) {
                const jsonDetail = JSON.parse(detail || '{}')
                const curFields = fields?.filter((o) =>
                    jsonDetail?.scope_fields?.includes(o.id),
                )
                setScopeFields(curFields)
                setScopeWhere(jsonDetail?.fixed_row_filters)
            } else {
                setCurrentScope(scopeItem)
            }
            setRuleFilter(detail || '')
        }

        useEffect(() => {
            init()
        }, [value, fields])

        const reset = () => {
            init()
            filterRef.current?.reset()
        }

        const getRule = async (isValidate?: boolean) => {
            const isPass = isValidate ? await onValidateRule() : true
            const name = form.getFieldValue('name')
            const auth_scope_id = form.getFieldValue('auth_scope_id')
            const detail = await filterRef.current?.onSnapshot()
            return {
                data: { name, detail, auth_scope_id },
                isPass,
            }
        }

        const onValidateRule = async () => {
            let isPass = await filterRef.current?.onValidateFilter()
            try {
                await form.validateFields()
            } catch (error) {
                if (!error.errorFields) {
                    formatError(error, toast)
                }
                isPass = false
            }
            return isPass
        }

        useImperativeHandle(ref, () => ({
            getRule,
            reset,
        }))

        const handleChange = () => {
            onDataChange?.()
        }

        return (
            <div className={styles['process-filter']}>
                <Form
                    form={form}
                    initialValues={{ name: ruleName, auth_scope_id: scopeId }}
                    autoComplete="off"
                    scrollToFirstError
                    onFinish={handleSure}
                    onValuesChange={(values) => {
                        onDataChange()
                    }}
                >
                    <Space size={32} direction="horizontal">
                        <Form.Item
                            name="name"
                            label={labelTextMap[type].name}
                            required
                            validateFirst
                            rules={[
                                {
                                    validator: validateTextSubViewName(
                                        names,
                                        keyboardCharactersReg,
                                        __(
                                            '仅支持中英文、数字、及键盘上的特殊字符',
                                        ),
                                        __('输入不能为空'),
                                    ),
                                },
                            ]}
                        >
                            <Input
                                placeholder={labelTextMap[type].namePlaceholder}
                                maxLength={128}
                                style={{ width: '280px' }}
                            />
                        </Form.Item>
                        <Form.Item
                            name="auth_scope_id"
                            label={labelTextMap[type].scope}
                            required
                            rules={[
                                {
                                    required: true,
                                    message:
                                        labelTextMap[type].scopePlaceholder,
                                },
                            ]}
                        >
                            <Select
                                placeholder={
                                    labelTextMap[type].scopePlaceholder
                                }
                                style={{ width: '280px' }}
                                disabled // 申请暂不允许更改
                            >
                                {scopeOptions.map((option) => (
                                    <Select.Option
                                        key={option.key}
                                        value={option.value}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: 32,
                                        }}
                                        name={option.label}
                                    >
                                        <span
                                            style={{
                                                columnGap: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <span style={{ lineHeight: 1 }}>
                                                <FontIcon
                                                    name={
                                                        ScopeTypeIcon[
                                                            option.type
                                                        ]
                                                    }
                                                    type={IconType.COLOREDICON}
                                                    className={styles.icon}
                                                    style={{
                                                        fontSize: 20,
                                                    }}
                                                />
                                            </span>
                                            {option.label}
                                        </span>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Space>
                </Form>
                <RowAndColFilter
                    ref={filterRef}
                    value={ruleFilter}
                    scopeFields={scopeFields}
                    extend={scopeWhere}
                    canEditExtend
                    col={{
                        title: headerRender(
                            labelTextMap[type].colTitle,
                            labelTextMap[type].colDesc,
                        ),
                        field: { name: 'business_name' },
                        value: (fields as any) || [],
                        loading: fields === undefined,
                        onChange: handleChange,
                    }}
                    row={{
                        title: headerRender(
                            labelTextMap[type].rowTitle,
                            labelTextMap[type].rowDesc,
                        ),
                        value: (fields as any) || [],
                        onChange: handleChange,
                        loading: fields === undefined,
                        exampleData,
                        openProbe,
                    }}
                />
            </div>
        )
    },
)

export default ColRowPanel
