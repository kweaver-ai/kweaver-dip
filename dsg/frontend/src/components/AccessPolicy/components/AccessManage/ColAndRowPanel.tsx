import { Form, Input, Select, Space } from 'antd'
import { FormInstance } from 'antd/es/form'
import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { trim } from 'lodash'
import RowAndColFilter from '@/components/RowAndColFilter/RowAndColFilter'
import { AssetTypeEnum, IDatasheetField, ISubView, formatError } from '@/core'
import { keyboardCharactersReg } from '@/utils'
import __ from '../../locale'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { DefaultAuthID, ScopeType, ScopeTypeIcon } from '../../const'

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

export type IScopeItem = {
    key?: string
    label: string
    value: string
    type: ScopeType
    data?: ISubView
}

/**
 * 配置授权规则
 */
interface IColAndRowPanel {
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
    onlyAllocate?: boolean
}

export const labelTextMap = {
    [AssetTypeEnum.SubView]: {
        name: __('授权行/列规则名称'),
        namePlaceholder: __('请输入授权行/列规则名称'),
        scope: __('授权范围'),
        scopePlaceholder: __('请选择授权范围'),
        colTitle: __('限定列'),
        colDesc: __('勾选赋予权限的列字段'),
        rowTitle: __('限定行'),
        rowDesc: __('配置赋予权限的行数据'),
        addTitle: __('新增限定'),
        addFile1: __('请选择字段名称'),
        addFile2: __('过滤条件'),
        addFile3: __('限定内容'),
    },
    [AssetTypeEnum.Dim]: {
        name: __('授权维度规则名称'),
        namePlaceholder: __('请输入授权维度规则名称'),
        scope: __('授权范围'),
        scopePlaceholder: __('请选择授权范围'),
        colTitle: __('限定分析维度'),
        colDesc: __('勾选赋予权限的维度字段'),
        rowTitle: __('限定维度值'),
        rowDesc: __('配置赋予权限的维度数据'),
        addTitle: __('新增过滤'),
        addFile1: __('请选择分析维度'),
        addFile2: __('过滤条件'),
        addFile3: __('限定内容'),
    },
    [AssetTypeEnum.SubService]: {
        name: __('授权限定规则名称'),
        namePlaceholder: __('请输入授权限定规则名称'),
        scope: __('授权范围'),
        scopePlaceholder: __('请选择授权范围'),
        rowTitle: __('限定范围'),
        rowDesc: __('配置赋予权限的数据查询范围'),
        addTitle: __('新增过滤'),
        addFile1: __('请选择字段名称'),
        addFile2: __('过滤条件'),
        addFile3: __('限定内容'),
    },
}

const ColAndRowPanel = forwardRef(
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
            onlyAllocate,
            type = AssetTypeEnum.SubView,
        }: IColAndRowPanel,
        ref,
    ) => {
        const { microWidgetProps } = useContext(MicroWidgetPropsContext)
        const [ruleName, setRuleName] = useState<string>('')
        const [scopeId, setScopeId] = useState<string>('')
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
                // curFields = undefined
                curFields = fields
            }
            setScopeFields(curFields)
            setScopeWhere(scopeItemDetail?.row_filters)
        }, [currentScope, fields])

        const handleSure = async ({ name, auth_scope_id }) => {
            const isPass = await filterRef.current?.onValidateFilter()
            const detail = await filterRef.current?.onFinish()
            const values = { name, detail, auth_scope_id }
            if (onFinish) {
                onFinish(values, isPass)
            }
        }

        const init = () => {
            const { name, auth_scope_id, detail } = value || {}
            setRuleName(name || '')
            // 缺失 默认取第一个选项(默认第一个为视图、接口、指标)
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
            // 存在默认scope 且为规则(非整表)  则获取scope_fields 与 fixed_row_filters  而不获取最新关联scopeId的信息
            if (auth_scope_id && scopeItem?.type === ScopeType.Rule) {
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
                    formatError(error, microWidgetProps?.components?.toast)
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                    }
                                }}
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
                                onChange={(val) => {
                                    const scopeItem = scopeOptions.find(
                                        (item) => item.value === val,
                                    )
                                    setCurrentScope(scopeItem)
                                }}
                                showSearch
                                filterOption={(input, option) => {
                                    if (!option?.name) return false
                                    return option.name
                                        .toLowerCase()
                                        .includes(input.toLowerCase())
                                }}
                                optionFilterProp="name"
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
                                            <span
                                                className={
                                                    styles.selectIconWrapper
                                                }
                                            >
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
                                            <span
                                                style={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={option.label}
                                            >
                                                {option.label}
                                            </span>
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
                    canEditExtend={!onlyAllocate}
                    type={type}
                    col={
                        type === AssetTypeEnum.SubService
                            ? undefined
                            : {
                                  title: headerRender(
                                      labelTextMap[type].colTitle,
                                      labelTextMap[type].colDesc,
                                  ),
                                  field: { name: 'business_name' },
                                  value: (fields as any) || [],
                                  loading: fields === undefined,
                                  onChange: handleChange,
                              }
                    }
                    row={{
                        title: headerRender(
                            labelTextMap[type].rowTitle,
                            labelTextMap[type].rowDesc,
                        ),
                        value: (fields as any) || [],
                        loading: fields === undefined,
                        onChange: handleChange,
                        exampleData,
                        openProbe,
                    }}
                />
            </div>
        )
    },
)

export default ColAndRowPanel
