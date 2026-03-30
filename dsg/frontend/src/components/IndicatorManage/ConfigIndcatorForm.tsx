import { FC, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    FormInstance,
    Form,
    Input,
    Row,
    Col,
    Select,
    Spin,
    Table,
    Tooltip,
    Button,
    message,
    Anchor,
    AutoComplete,
} from 'antd'
import {
    CaretDownOutlined,
    CaretRightOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'
import { debounce, noop, uniq, trim } from 'lodash'
import moment from 'moment'
import styles from './styles.module.less'
import {
    TabsKey,
    atomsExpressionRegx,
    compositeExpressionRegx,
    changedRestrictData,
    ExpressionStatus,
    RestrictType,
    atomsFuncRegx,
    numberValueRegx,
    checkCompositeParamsRegx,
    FormatTypeTXT,
    ownerRoleId,
    updateCycle,
    indicatorLevel,
} from './const'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import {
    createAtomicIndicator,
    createCompositeIndicator,
    createDerivedIndicator,
    editAtomicIndicator,
    editCompositeIndicator,
    editDerivedIndicator,
    formatError,
    getCategoriesDetails,
    getIndicatorDetail,
    getIndictorList,
    reqBusinObjField,
    runAtomicIndicator,
    runCompositeIndicator,
    runDerivedIndicator,
    getDimensionModels,
    getDimensionModelDetail,
    getCoreBusinessIndicatorDetail,
    getUsedBusinessIndicatorsId,
    DimModelConfig,
} from '@/core'
import ExpressionConfig from './ExpressionConfig'
import {
    FormDataType,
    checkIndicatorCode,
    checkIndicatorName,
    UnitOptions,
} from './helper'
import { codeIDReg, nameReg, getActualUrl, useQuery } from '@/utils'
import { useCatalogColumn } from '../DimensionModel/helper'
import BusinessIndictorSelector from './BusinessIndictorSelector'
import { TaskInfoContext } from '@/context'
import IndicatorView from './IndicatorView'
import DataOwnerCompositeComponent from '../DataOwnerCompositeComponent'
import { CombinedComponentType } from '../DataOwnerCompositeComponent/const'
import AnalysisDimensions from './AnalysisDimensions'
import { getPolicyFields } from '@/components/SceneAnalysis/UnitForm/helper'
import { dataTypeMapping } from '../DataConsanguinity/const'

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 2000,
    keyword: '',
    indicator_type: TabsKey.ATOMS,
}

interface ConfigIndcatorFormType {
    form: FormInstance<any>
    indicatorType: TabsKey
    onChange?: () => void
    domainId?: string
    modelId?: string
    onFinish?: (value?: any) => void
    indicatorId?: string
}
const ConfigIndcatorForm: FC<ConfigIndcatorFormType> = ({
    form,
    indicatorType,
    onChange = noop,
    domainId = '',
    modelId = '',
    onFinish = noop,
    indicatorId = '',
}) => {
    // 所有主题域
    const [allDomains, setAllDomains] = useState<Array<any>>([])

    // 主题域下拉选项
    const [domainsOptions, setDomainsOptions] = useState<Array<any>>([])

    // 主题域搜索关键字
    const [domainKeyword, setDomainKeyword] = useState<string>('')

    // 主题域加载状态
    const [domainLoading, setDomainLoading] = useState<boolean>(true)

    // 获取所有维度模型
    const [modelsOptions, setModelsOptions] = useState<Array<any>>([])

    // 维度模型搜索关键字
    const [modelKeyword, setModelKeyword] = useState<string>('')

    // 维度模型搜索关键字
    const [modelTotalCount, setModelTotalCount] = useState<number>(0)

    // 维度模型加载状态
    const [modelLoading, setModelLoading] = useState<boolean>(true)

    // 获取所有原子指标
    const [allAtoms, setAllAtoms] = useState<Array<any>>([])

    // 获取所有维度模型
    const [atomsOptions, setAtomsOptions] = useState<Array<any>>([])

    // 维度模型搜索关键字
    const [atomsKeyword, setAtomsKeyword] = useState<string>('')

    // 维度模型加载状态
    const [atomsLoading, setAtomsLoading] = useState<boolean>(true)

    // 预览数据表头
    const [column, setColumns] = useState<Array<any>>([])

    // 预览数据表头
    const [viewData, setViewData] = useState<Array<any>>([])

    // 普通限定的数据
    const [normalDataOptions, setNormalDataOptions] = useState<
        Array<FormDataType>
    >([])

    const [atomicDimModelId, setAtomicDimModelId] = useState<string>('')

    // 维度表数据
    const [dimFormsData, setDimFormData] = useState<Array<any>>([])
    // 维度表数据
    const [dimFormsDataLoading, setDimFormsDataLoading] =
        useState<boolean>(false)

    const [timeDataOptions, setTimeDataOptions] = useState<Array<FormDataType>>(
        [],
    )

    const [defualtSubject, setDefultSubject] = useState<string>('')

    const [expressionStatus, setExpressStatus] = useState<ExpressionStatus>(
        ExpressionStatus.NORMAL,
    )

    const [allIndictorData, setAllIndictorData] = useState<Array<any>>([])
    const [viewLoading, setViewLoading] = useState<boolean>(false)
    const { loading, getColumnsById } = useCatalogColumn()

    const container = useRef<any>(null)
    // 绑定的业务指标详情
    const [businessIndicatorDetail, setBusinessIndicatorDetail] =
        useState<any>(null)

    const [businessIndicatorError, setBusinessIndicatorError] =
        useState<boolean>(false)
    const [usedBusinessIndicatorsId, setUsedBusinessIndicatorsId] = useState<
        Array<string>
    >([])

    // 分析对象列表
    const [analysisDimensionsOptions, setAnalysisDimensionsOptions] = useState<
        Array<any>
    >([])

    const query = useQuery()

    const departId = query.get('departmentId') || ''
    const domId = query.get('domainId') || ''
    const [searchParams, setSearchParams] = useSearchParams()
    // 指标管理-天辰
    const navigate = useNavigate()
    const [searchOwnerValue, setSearchOwnerValue] = useState('')
    const [departmentId, setDepartmentId] = useState<string | undefined>(
        undefined,
    )
    const [dimensionalModelIdVal, setDimensionalModelIdVal] = useState('')
    const [atomicIndicatorIdVal, setAtomicIndicatorIdVal] = useState<
        string | undefined
    >(undefined)
    const [viewDetailId, setViewDetailId] = useState<string | undefined>(
        undefined,
    )
    const [currDomainId, setCurrDomainId] = useState<string>('')

    const { taskInfo } = useContext(TaskInfoContext)

    const { Link } = Anchor
    const [policyFieldsInfo, setPolicyFieldsInfo] = useState<any>([])

    useEffect(() => {
        getAtomicIndictors()
        getInitModelData([])
    }, [])

    useEffect(() => {
        if (departId) {
            setDepartmentId(departId)
            searchParams.delete('departmentId')
            setSearchParams(searchParams)
        }

        if (domId) {
            setCurrDomainId(domId)
            setDefultSubject(domId)
            searchParams.delete('domainId')
            setSearchParams(searchParams)
        }
    }, [departId, domId])

    // useEffect(() => {
    //     if (domainId) {
    //         getInitDomainDetail(domainId)
    //     }
    // }, [domainId])

    useEffect(() => {
        if (indicatorType) {
            form.resetFields()
            form.setFieldValue('type', indicatorType)
        }
        if (indicatorType === TabsKey.RECOMBINATION) {
            getAllIndictors()
        }
    }, [indicatorType, modelId])

    // 画布内的表单
    const isGraphForm = useMemo(() => {
        return [TabsKey.ATOMS, TabsKey.DERIVE].includes(indicatorType)
    }, [indicatorType])

    useEffect(() => {
        if (indicatorId) {
            getIndictorDetail(indicatorId)
        } else {
            getUsedIndicatorIds()
        }
    }, [indicatorId])

    // 获取指标详情
    const getIndictorDetail = async (currentId) => {
        try {
            const detailData = await getIndicatorDetail(currentId)
            if (detailData.domain_id) {
                try {
                    const domainDetail = await getCategoriesDetails(
                        detailData.domain_id,
                    )
                } catch (ex) {
                    formatError(ex)
                }
            }
            const managementDepartmentId =
                detailData?.management_department_id === ''
                    ? undefined
                    : detailData?.management_department_id
            setDefultSubject(detailData?.domain_id || '')
            setDepartmentId(managementDepartmentId)
            setAtomicIndicatorIdVal(detailData?.atomic_indicator_id || '')
            setCurrDomainId(detailData.domain_id)
            const formViewIds = uniq(
                detailData?.analysis_dimensions?.map((item) => item.table_id),
            )

            const fieldsInfoRes = await Promise.all(
                formViewIds.map((id) => getPolicyFields(id)),
            )
            setPolicyFieldsInfo(fieldsInfoRes)
            const policyFields =
                fieldsInfoRes.reduce((prev: any, curr: any) => {
                    return [...prev, ...curr.fields]
                }, []) || []
            form.setFieldValue(
                'analysis_dimensions',
                detailData?.analysis_dimensions?.map((item) => ({
                    ...item,
                    isPolicy: policyFields
                        ?.map((o) => o.id)
                        ?.includes(item.field_id),
                })) || [],
            )
            if (indicatorType === TabsKey.DERIVE) {
                getDimFormsData(detailData.atomic_indicator_id, false)

                form.setFieldsValue({
                    ...detailData,
                    domain_id: detailData.domain_id || null,
                    time_restrict: changedRestrictData(
                        detailData.time_restrict,
                    ),
                    modifier_restrict: changedRestrictData(
                        detailData.modifier_restrict,
                    ),
                    businessIndicator: {
                        business_indicator_id: detailData.business_indicator_id,
                        business_indicator_name:
                            detailData.business_indicator_name,
                    },
                    management_department_id: managementDepartmentId || null,
                    owners:
                        detailData?.owners?.map((item) => item.owner_id) || [],
                })
            } else {
                const { expression, analysis_dimensions, ...rest } = detailData
                let matchExpressData: Array<string> = []
                if (rest.indicator_type === TabsKey.ATOMS) {
                    const expressionSplitData =
                        expression?.match(atomsExpressionRegx) || []
                    matchExpressData =
                        expressionSplitData.length &&
                        (atomsFuncRegx.test(
                            expressionSplitData[expressionSplitData.length - 1],
                        ) ||
                            expressionSplitData[
                                expressionSplitData.length - 1
                            ] === ')')
                            ? [...expressionSplitData, '']
                            : expressionSplitData
                } else {
                    const expressionSplitData =
                        expression?.match(compositeExpressionRegx) || []
                    matchExpressData =
                        expressionSplitData.length &&
                        expressionSplitData[expressionSplitData.length - 1] ===
                            ')'
                            ? [...expressionSplitData, '']
                            : expressionSplitData
                    getCompositeModelDetail(expressionSplitData, false)
                }

                const expressionData = matchExpressData.length
                    ? [...matchExpressData]
                    : ['']
                form.setFieldsValue({
                    ...rest,
                    expression: expressionData,
                    domain_id: detailData.domain_id || null,
                    businessIndicator: {
                        business_indicator_id: detailData.business_indicator_id,
                        business_indicator_name:
                            detailData.business_indicator_name,
                    },
                    management_department_id: managementDepartmentId || null,
                    owners:
                        detailData?.owners?.map((item) => item.owner_id) || [],
                })
            }
            const usedIds = await getUsedBusinessIndicatorsId()
            if (detailData.business_indicator_id) {
                getCurrentBusinessDataDetail(detailData.business_indicator_id)

                setUsedBusinessIndicatorsId(
                    usedIds.filter(
                        (item) => item !== detailData.business_indicator_id,
                    ),
                )
            } else {
                setUsedBusinessIndicatorsId(usedIds)
            }
        } catch (ex) {
            formatError(ex)
            // 直接回退上一个页面了，做一个容错处理
            // onFinish()
        }
    }

    // 查询业务指标
    const getUsedIndicatorIds = async () => {
        const usedIds = await getUsedBusinessIndicatorsId()
        setUsedBusinessIndicatorsId(usedIds)
    }

    // 获取所有指标
    const getAllIndictors = async () => {
        try {
            const { entries, count } = await getIndictorList({
                offset: '1',
                limit: '2000',
            })
            setAllIndictorData(entries)
        } catch (ex) {
            formatError(ex)
        }
    }

    const getDimFormsData = async (atomicId, isSelect = true) => {
        try {
            setDimFormsDataLoading(true)
            const atomicDetail = await getIndicatorDetail(atomicId)
            const policyFields =
                policyFieldsInfo.reduce((prev: any, curr: any) => {
                    return [...prev, ...curr.fields]
                }, []) || []
            const list =
                atomicDetail?.analysis_dimensions?.map((item) => ({
                    ...item,
                    isPolicy: policyFields
                        ?.map((o) => o.id)
                        ?.includes(item.field_id),
                })) || []
            if (isSelect) {
                form.setFieldValue('analysis_dimensions', list || [])
            }

            setAnalysisDimensionsOptions(list || [])
        } catch (ex) {
            form.setFieldValue('time_restrict', [
                {
                    relation: 'and',
                    member: [
                        {
                            field_id: undefined,
                        },
                    ],
                },
            ])
            form.setFieldValue('modifier_restrict', [
                {
                    relation: 'and',
                    member: [
                        {
                            field_id: undefined,
                        },
                    ],
                },
            ])
            formatError(ex)
        } finally {
            setDimFormsDataLoading(false)
        }
    }

    /**
     * 初始获取列表
     * @param params
     */
    const getAtomicIndictors = async () => {
        try {
            setAtomsLoading(true)
            const { entries, count } = await getIndictorList(initialQueryParams)
            setAtomsOptions(
                entries.map((currentData) => ({
                    value: currentData.id,
                    label: currentData.name,
                    detail: entries,
                })),
            )
        } catch (ex) {
            formatError(ex)
        } finally {
            setAtomsLoading(false)
        }
    }

    const getCurrentBusinessDataDetail = async (id) => {
        try {
            const detail = await getCoreBusinessIndicatorDetail(id)
            setBusinessIndicatorDetail(detail)
        } catch (err) {
            if (
                err.data.code ===
                'BusinessGrooming.BusinessIndicator.RecordNotFoundError'
            ) {
                form.setFields([
                    {
                        name: 'businessIndicator',
                        errors: [__('关联业务指标已被删除，请重新选择')],
                        value: null,
                    },
                ])
                setBusinessIndicatorError(true)
                form.setFieldValue('code', '')
                form.setFieldValue('indicator_unit', '')
                setBusinessIndicatorDetail(null)
            } else {
                formatError(err)
            }
        }
    }

    const getInitModelData = async (initData) => {
        try {
            const { entries, total_count } = await getDimensionModels({
                offset: 1,
                limit: 2000,
                keyword: modelKeyword,
            })
            const currentOption = entries.map((currentModel) => ({
                label: currentModel.name,
                value: currentModel.id,
                detail: currentModel,
            }))
            setModelTotalCount(total_count)
            setModelsOptions(currentOption)
        } catch (ex) {
            formatError(ex)
        } finally {
            setModelLoading(false)
        }
    }

    /**
     * 滚动加载信息系统
     * @param e
     */
    const getModelByScroll = (e) => {
        const { target } = e
        if (
            target.scrollTop + target.offsetHeight === target.scrollHeight &&
            modelTotalCount > modelsOptions.length
        ) {
            getInitModelData(modelsOptions)
        }
    }

    /**
     * 原子指标获取分析对象字段列表
     * @param id
     */
    const getAtomsModelDetail = async (id: string, isSelect = true) => {
        try {
            if (id) {
                const { dim_model_config } = await getDimensionModelDetail(id, {
                    show_type: 2,
                })
                const dimModelConfig = dim_model_config as DimModelConfig
                const tableIds = [
                    dimModelConfig.fact_table_id,
                    ...(dimModelConfig?.dim_field_config?.map(
                        (current) => current.dim_table_id,
                    ) || []),
                ]

                const allFormData = await Promise.all(
                    tableIds.map((currentId) => getColumnsById(currentId)),
                )
                if (isSelect) {
                    const policyFields =
                        policyFieldsInfo.reduce((prev: any, curr: any) => {
                            return [...prev, ...curr.fields]
                        }, []) || []
                    const defaultSelectedData = allFormData
                        .map((currentTable, index) => {
                            const tableFields = currentTable.data
                                .filter((currentFields) =>
                                    dataTypeMapping.char.includes(
                                        currentFields.data_type,
                                    ),
                                )
                                .map((currentFields) => ({
                                    table_id: tableIds[index],
                                    field_id: currentFields.id,
                                    business_name: currentFields.business_name,
                                    technical_name:
                                        currentFields.technical_name,
                                    data_type: currentFields.data_type,
                                }))
                            return tableFields
                        })
                        .flat()

                    form.setFieldValue(
                        'analysis_dimensions',
                        defaultSelectedData?.map((item) => ({
                            ...item,
                            isPolicy: policyFields
                                ?.map((o) => o.id)
                                ?.includes(item.field_id),
                        })),
                    )
                }
                setAnalysisDimensionsOptions(
                    allFormData.map((currentTable, index) => ({
                        id: tableIds[index],
                        name: currentTable.technical_name,
                        fields: currentTable.data.map((currentFields) => ({
                            table_id: tableIds[index],
                            field_id: currentFields.id,
                            business_name: currentFields.business_name,
                            technical_name: currentFields.technical_name,
                            data_type: currentFields.data_type,
                        })),
                    })),
                )
            } else {
                form.setFieldValue('analysis_dimensions', [])
                setAnalysisDimensionsOptions([])
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    /**
     * 复合指标获取分析对象字段列表
     * @param expression 表达式
     */
    const getCompositeModelDetail = async (
        expression: string[],
        isSelect = true,
    ) => {
        const expressionIds = expression
            .filter((expressionItem) =>
                checkCompositeParamsRegx.test(expressionItem),
            )
            .map((expressionItem) => expressionItem.replace(/[{}]/g, ''))
        if (expressionIds.length) {
            try {
                const indicatorsDetail: any = await Promise.all(
                    expressionIds.map((currentId) =>
                        getIndicatorDetail(currentId),
                    ),
                )
                const fieldsInfoRes = await Promise.all(
                    indicatorsDetail.map((current) =>
                        getPolicyFields(current.refer_view_id),
                    ),
                )
                setPolicyFieldsInfo(fieldsInfoRes)
                const policyFields =
                    fieldsInfoRes.reduce((prev: any, curr: any) => {
                        return [...prev, ...curr.fields]
                    }, []) || []

                const findEmptyAnalysisDimensions = indicatorsDetail.find(
                    (indictorItem) =>
                        !indictorItem?.analysis_dimensions?.length,
                )
                if (findEmptyAnalysisDimensions) {
                    if (isSelect) {
                        form.setFieldValue('analysis_dimensions', [])
                    }
                    setAnalysisDimensionsOptions([])
                } else if (indicatorsDetail.length === 1) {
                    const list = indicatorsDetail[0]?.analysis_dimensions?.map(
                        (item) => ({
                            ...item,
                            isPolicy: policyFields
                                ?.map((o) => o.id)
                                ?.includes(item.field_id),
                        }),
                    )
                    if (isSelect) {
                        form.setFieldValue('analysis_dimensions', list)
                    }
                    setAnalysisDimensionsOptions(list)
                } else {
                    const FirstDimensions =
                        indicatorsDetail[0]?.analysis_dimensions
                    const others = indicatorsDetail?.slice(1) || []

                    const fields =
                        FirstDimensions.filter((itemData) => {
                            return others?.every((o) =>
                                o?.analysis_dimensions?.some(
                                    (n) => n.field_id === itemData.field_id,
                                ),
                            )
                        })?.map((item) => ({
                            ...item,
                            isPolicy: policyFields
                                ?.map((o) => o.id)
                                ?.includes(item.field_id),
                        })) || []

                    if (isSelect) {
                        form.setFieldValue('analysis_dimensions', fields)
                    }
                    setAnalysisDimensionsOptions(fields)
                }
            } catch (err) {
                noop()
            }
        } else {
            setAnalysisDimensionsOptions([])
            if (isSelect) {
                form.setFieldValue('analysis_dimensions', [])
            }
        }
    }

    const newGetCompositeModelDetail = debounce(getCompositeModelDetail, 500)
    // 展开的按钮
    const getExpandIcon = (panelProps) => {
        return panelProps.isActive ? (
            <CaretDownOutlined className={styles.arrowIcon} />
        ) : (
            <CaretRightOutlined className={styles.arrowIcon} />
        )
    }

    const hasDerivedOrComposite = useMemo(() => {
        return (allIndictorData || []).filter(
            (currentData) => !(indicatorId && indicatorId === currentData.id),
        )?.length
    }, [allIndictorData, indicatorId])

    /**
     *  符合指标 技术属性
     * @returns
     */
    const getIndicatorComponent = () => {
        switch (indicatorType) {
            case TabsKey.RECOMBINATION:
                return (
                    <div>
                        <Row gutter={48}>
                            <Col span={12}>
                                <Form.Item
                                    label={__('更新周期')}
                                    name="update_cycle"
                                    required
                                    validateFirst
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择更新周期'),
                                        },
                                    ]}
                                >
                                    <Select
                                        placeholder={__('请选择更新周期')}
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        allowClear
                                    >
                                        {updateCycle.map((item) => (
                                            <Select.Option
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.label}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            name="expression"
                            label={__('计算公式')}
                            required
                        >
                            {hasDerivedOrComposite ? (
                                <ExpressionConfig
                                    type={indicatorType}
                                    errorStatus={expressionStatus}
                                    onClearStatus={() => {
                                        setExpressStatus(
                                            ExpressionStatus.NORMAL,
                                        )
                                    }}
                                    allIndictor={allIndictorData.filter(
                                        (currentData) =>
                                            !(
                                                indicatorId &&
                                                indicatorId === currentData.id
                                            ),
                                    )}
                                    onChange={(value) => {
                                        newGetCompositeModelDetail(value)
                                    }}
                                />
                            ) : (
                                <div className={styles.emptyExpression}>
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('请先新建衍生/复合指标')}
                                    />
                                </div>
                            )}
                        </Form.Item>
                        <Form.Item
                            shouldUpdate={(prevValues, curValues) =>
                                curValues.expression !== prevValues.expression
                            }
                            noStyle
                            style={{
                                width: '100%',
                                padding: '0 8px',
                            }}
                        >
                            {({ getFieldValue }) => {
                                const expressionText =
                                    getFieldValue('expression') || []
                                const expressionIds = expressionText
                                    .filter((expressionItem) =>
                                        checkCompositeParamsRegx.test(
                                            expressionItem,
                                        ),
                                    )
                                    .map((expressionItem) =>
                                        expressionItem.replace(/[{}]/g, ''),
                                    )
                                return (
                                    <Form.Item
                                        name="analysis_dimensions"
                                        label={
                                            <div>
                                                <span>{__('分析维度')}</span>
                                                <Tooltip
                                                    title={
                                                        <div>
                                                            <div>
                                                                {__(
                                                                    '复合指标分析维度：',
                                                                )}
                                                            </div>

                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: 'rgba(0,0,0,0.65)',
                                                                }}
                                                            >
                                                                {__(
                                                                    '参与计算的指标中的公共分析维度',
                                                                )}
                                                            </div>
                                                        </div>
                                                    }
                                                    color="#fff"
                                                    overlayInnerStyle={{
                                                        color: 'rgba(0,0,0,0.85)',
                                                    }}
                                                    placement="right"
                                                >
                                                    <span
                                                        style={{
                                                            color: 'rgba(0,0,0,0.65)',
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        <InfoCircleOutlined />
                                                    </span>
                                                </Tooltip>
                                            </div>
                                        }
                                    >
                                        <AnalysisDimensions
                                            options={analysisDimensionsOptions}
                                            emptyText={
                                                expressionIds.length
                                                    ? __('暂无可添加字段')
                                                    : __('请先配置计算公式')
                                            }
                                        />
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                    </div>
                )
            default:
                return <div />
        }
    }

    const changeRestrictInfo = (restrictInfo) => {
        return restrictInfo.map((a) => {
            const { member } = a
            return {
                ...a,
                member: member.map((b) => {
                    const { value } = b
                    let realValue = value
                    if (typeof value === 'object') {
                        if (Array.isArray(value)) {
                            realValue = value.join(',')
                        } else {
                            const { dateNumber, unit, date } = value
                            if (date) {
                                realValue = date
                                    .map((c) =>
                                        moment(c).format('YYYY-MM-DD HH:mm:ss'),
                                    )
                                    .join(',')
                            } else {
                                realValue = `${dateNumber} ${unit}`
                            }
                        }
                    }
                    return { ...b, value: realValue }
                }),
            }
        })
    }

    const currentIndictorExist = (currentData) => {
        if (checkCompositeParamsRegx.test(currentData)) {
            const hasExistData = allIndictorData.find(
                (currentIndictor) =>
                    currentIndictor.id === currentData.replace(/[{}]/g, ''),
            )
            if (hasExistData) {
                return true
            }
            return false
        }
        return false
    }

    const checkExpressStatus = (values) => {
        const {
            expression,
            domain_id,
            time_restrict,
            modifier_restrict,
            ...restParams
        } = values
        if (indicatorType === TabsKey.DERIVE) {
            return true
        }
        const expressValue = expression?.join('')
        let errorStatus = false
        if (!expressValue) {
            setExpressStatus(ExpressionStatus.Empty)
            return false
        }
        if (
            indicatorType === TabsKey.ATOMS &&
            expression.length === 2 &&
            expression[1] === ''
        ) {
            if (!atomsFuncRegx.test(expression[0])) {
                errorStatus = true
                setExpressStatus(ExpressionStatus.Error)
            }
        } else if (expression.length === 1) {
            if (!currentIndictorExist(expression[0])) {
                errorStatus = true
                setExpressStatus(ExpressionStatus.Error)
            }
        } else if (indicatorType === TabsKey.ATOMS) {
            const newExpression = expression.filter(
                (currentData) => currentData !== '',
            )
            if (newExpression.length === 2) {
                errorStatus = true
                setExpressStatus(ExpressionStatus.Error)
            } else {
                newExpression.forEach((currentData, index) => {
                    if (index === 0) {
                        if (
                            !(
                                atomsFuncRegx.test(currentData) ||
                                numberValueRegx.test(currentData) ||
                                currentData === '('
                            )
                        ) {
                            if (!errorStatus) {
                                errorStatus = true
                                setExpressStatus(ExpressionStatus.Error)
                            }
                        }
                    } else if (index === newExpression.length - 1) {
                        if (currentData === '') {
                            if (
                                !(
                                    atomsFuncRegx.test(
                                        newExpression[index - 1],
                                    ) ||
                                    numberValueRegx.test(
                                        newExpression[index - 1],
                                    ) ||
                                    newExpression[index - 1] === ')'
                                )
                            ) {
                                if (!errorStatus) {
                                    errorStatus = true
                                    setExpressStatus(ExpressionStatus.Error)
                                }
                            }
                        } else if (
                            !(
                                atomsFuncRegx.test(currentData) ||
                                numberValueRegx.test(currentData) ||
                                currentData === ')'
                            )
                        ) {
                            if (!errorStatus) {
                                errorStatus = true
                                setExpressStatus(ExpressionStatus.Error)
                            }
                        }
                    } else if (/^[+\-*/]{1}$/.test(currentData)) {
                        if (
                            !(
                                atomsFuncRegx.test(newExpression[index - 1]) ||
                                numberValueRegx.test(
                                    newExpression[index - 1],
                                ) ||
                                newExpression[index - 1] === ')'
                            )
                        ) {
                            if (!errorStatus) {
                                errorStatus = true
                                setExpressStatus(ExpressionStatus.Error)
                            }
                        }
                    } else if (currentData === '(') {
                        if (!/^[+\-*/]{1}$/.test(newExpression[index - 1])) {
                            if (!errorStatus) {
                                errorStatus = true
                                setExpressStatus(ExpressionStatus.Error)
                            }
                        }
                    } else if (currentData === ')') {
                        if (
                            !(
                                atomsFuncRegx.test(newExpression[index - 1]) ||
                                numberValueRegx.test(newExpression[index - 1])
                            )
                        ) {
                            if (!errorStatus) {
                                errorStatus = true
                                setExpressStatus(ExpressionStatus.Error)
                            }
                        }
                    } else if (
                        atomsFuncRegx.test(newExpression[index - 1]) ||
                        numberValueRegx.test(newExpression[index - 1])
                    ) {
                        if (!errorStatus) {
                            errorStatus = true
                            setExpressStatus(ExpressionStatus.Error)
                        }
                    }
                })
            }
        } else if (indicatorType === TabsKey.RECOMBINATION) {
            expression.forEach((currentData, index) => {
                if (index === 0) {
                    if (
                        !(
                            currentIndictorExist(currentData) ||
                            numberValueRegx.test(currentData) ||
                            currentData === '('
                        )
                    ) {
                        if (!errorStatus) {
                            errorStatus = true
                            setExpressStatus(ExpressionStatus.Error)
                        }
                    }
                } else if (index === expression.length - 1) {
                    if (currentData === '') {
                        if (expression[index - 1] !== ')') {
                            if (!errorStatus) {
                                errorStatus = true
                                setExpressStatus(ExpressionStatus.Error)
                            }
                        }
                    } else if (
                        !(
                            currentIndictorExist(currentData) ||
                            numberValueRegx.test(currentData)
                        )
                    ) {
                        if (!errorStatus) {
                            errorStatus = true
                            setExpressStatus(ExpressionStatus.Error)
                        }
                    }
                } else if (/^[+\-*/]{1}$/.test(currentData)) {
                    if (
                        !(
                            currentIndictorExist(expression[index - 1]) ||
                            numberValueRegx.test(expression[index - 1]) ||
                            expression[index - 1] === ')'
                        )
                    ) {
                        if (!errorStatus) {
                            errorStatus = true
                            setExpressStatus(ExpressionStatus.Error)
                        }
                    }
                } else if (currentData === '(') {
                    if (!/^[+\-*/]{1}$/.test(expression[index - 1])) {
                        if (!errorStatus) {
                            errorStatus = true
                            setExpressStatus(ExpressionStatus.Error)
                        }
                    }
                } else if (currentData === ')') {
                    if (
                        !(
                            currentIndictorExist(expression[index - 1]) ||
                            numberValueRegx.test(expression[index - 1])
                        )
                    ) {
                        if (!errorStatus) {
                            errorStatus = true
                            setExpressStatus(ExpressionStatus.Error)
                        }
                    }
                }
            })
        }
        return !errorStatus
    }

    const handleFinish = async (values) => {
        if (
            indicatorType === TabsKey.RECOMBINATION &&
            !checkExpressStatus(values)
        ) {
            return
        }
        try {
            const {
                expression,
                domain_id,
                time_restrict,
                modifier_restrict,
                businessIndicator,
                ...restParams
            } = values
            const businessIndictorInfo = businessIndicator || {
                business_indicator_id: '',
                business_indicator_name: '',
            }
            const policyFields =
                policyFieldsInfo.reduce((prev: any, curr: any) => {
                    return [...prev, ...curr.fields]
                }, []) || []
            const policyFieldsValidate = values?.analysis_dimensions?.some(
                (v) => policyFields?.map((o) => o.id)?.includes(v.field_id),
            )
            if (policyFieldsValidate) return
            if ([TabsKey.ATOMS, TabsKey.DERIVE].includes(indicatorType)) {
                onFinish?.({
                    ...restParams,
                    domain_id,
                    type: indicatorType,
                    ...businessIndictorInfo,
                    task_id: taskInfo?.id || '',
                })
                return
            }

            if (indicatorType === TabsKey.RECOMBINATION && indicatorId) {
                await editCompositeIndicator(indicatorId, {
                    ...restParams,
                    domain_id,
                    expression: expression.join(''),
                    type: indicatorType,
                    ...businessIndictorInfo,
                    task_id: taskInfo?.id || '',
                    owners: restParams?.owners?.map((id) => ({ owner_id: id })),
                })
                message.success(__('更新成功'))
            } else {
                await createCompositeIndicator({
                    ...restParams,
                    domain_id,
                    expression: expression.join(''),
                    type: indicatorType,
                    ...businessIndictorInfo,
                    task_id: taskInfo?.id || '',
                    owners: restParams?.owners?.map((id) => ({ owner_id: id })),
                })
                message.success(__('发布成功'))
            }
            setExpressStatus(ExpressionStatus.NORMAL)
            onFinish()
        } catch (ex) {
            if (
                ex.data.code ===
                'indicator-management.Public.VirtualEngineRequestErr'
            ) {
                setExpressStatus(ExpressionStatus.Error)
            } else if (
                ex.data.code ===
                'indicator-management.Indicator.TimeRestrictAndModifierRestrictRequiredOne'
            ) {
                message.error(__('“时间限定”或“业务限定”必填一项'))
            } else {
                formatError(ex)
            }
        }
    }

    /**
     * 运行指标
     */
    const runIndicatorResult = async () => {
        try {
            setViewLoading(true)
            const validateResult = await form.validateFields()
            const values = form.getFieldsValue()
            if (!checkExpressStatus(values)) {
                return
            }
            const {
                expression,
                domain_id,
                time_restrict,
                modifier_restrict,
                owners,
                ...restParams
            } = values
            if (indicatorType === TabsKey.ATOMS) {
                const { columns, data } = await runAtomicIndicator({
                    ...restParams,
                    domain_id,
                    expression: expression.join(''),
                    type: indicatorType,
                    owners: owners?.map((id) => ({ owner_id: id })),
                })
                setViewData(
                    data.map((item) =>
                        Array.isArray(item) && item[0] === null
                            ? ['暂无数据']
                            : item,
                    ),
                )
                setColumns(
                    columns.map((currentData) => ({
                        title: (
                            <div
                                title={currentData.name}
                                className={styles.tableTrContainer}
                            >
                                <div className={styles.itemTitle}>
                                    {currentData.name}
                                </div>
                            </div>
                        ),
                    })),
                )
            } else if (indicatorType === TabsKey.DERIVE) {
                const { columns, data } = await runDerivedIndicator({
                    ...restParams,
                    time_restrict: changeRestrictInfo(time_restrict),
                    modifier_restrict: changeRestrictInfo(modifier_restrict),
                    domain_id,
                    owners: owners?.map((id) => ({ owner_id: id })),
                })
                setViewData(
                    data.map((item) =>
                        Array.isArray(item) && item[0] === null
                            ? ['暂无数据']
                            : item,
                    ),
                )
                setColumns(
                    columns.map((currentData) => ({
                        title: (
                            <div
                                title={currentData.name}
                                className={styles.tableTrContainer}
                            >
                                <div className={styles.itemTitle}>
                                    {currentData.name}
                                </div>
                            </div>
                        ),
                    })),
                )
            } else {
                const { columns, data } = await runCompositeIndicator({
                    ...restParams,
                    domain_id,
                    expression: expression.join(''),
                    type: indicatorType,
                    owners: owners?.map((id) => ({ owner_id: id })),
                })
                setViewData(
                    data.map((item) =>
                        Array.isArray(item) && item[0] === null
                            ? ['暂无数据']
                            : item,
                    ),
                )
                setColumns(
                    columns.map((currentData) => ({
                        title: (
                            <div
                                title={currentData.name}
                                className={styles.tableTrContainer}
                            >
                                <div className={styles.itemTitle}>
                                    {currentData.name}
                                </div>
                            </div>
                        ),
                    })),
                )
            }
            setExpressStatus(ExpressionStatus.NORMAL)
        } catch (ex) {
            if (!ex?.errorFields) {
                if (
                    ex.data.code ===
                    'indicator-management.Public.VirtualEngineRequestErr'
                ) {
                    setExpressStatus(ExpressionStatus.Error)
                } else if (
                    ex.data.code ===
                    'indicator-management.Indicator.TimeRestrictAndModifierRestrictRequiredOne'
                ) {
                    message.error(__('“时间限定”或“业务限定”必填一项'))
                } else {
                    formatError(ex)
                }
            }
            setViewData([])
        } finally {
            setViewLoading(false)
        }
    }

    const handleValueChange = async (changedValues) => {
        const changedKeys = Object.keys(changedValues)

        onChange?.()
    }
    // 监听依赖原子指标变化
    useEffect(() => {
        if (indicatorType === TabsKey.DERIVE) {
            if (atomicIndicatorIdVal) {
                getDimFormsData(atomicIndicatorIdVal)
            } else {
                form.setFieldValue('analysis_dimensions', [])
                setAnalysisDimensionsOptions([])
            }
            form.setFieldValue('time_restrict', [])
            form.setFieldValue('modifier_restrict', [])
        }
    }, [atomicIndicatorIdVal])

    const getManageIndicatorComponent = () => {
        return (
            <div>
                <DataOwnerCompositeComponent
                    form={form}
                    componentsConfig={[
                        {
                            name: 'domain_id',
                            type: CombinedComponentType.THEME_DOMAIN_TREE,
                            label: __('所属主题'),
                            defaultDisplay: defualtSubject,
                        },
                        {
                            name: 'management_department_id',
                            type: CombinedComponentType.DEPARTMENT,
                            label: __('所属部门'),
                            defaultDisplay: departmentId,
                        },
                        {
                            name: 'owners',
                            type: CombinedComponentType.DATAOWNER,
                            mode: 'multiple',
                            perm: 'manageDataResourceAuthorization',
                        },
                    ]}
                    defaultDomainId={currDomainId}
                    numberPerLine={[12, 12, 12]}
                />
            </div>
        )
    }

    return (
        <div ref={container} className={styles.configWrapper}>
            <div className={styles.configContent}>
                <div className={styles.formContainer}>
                    <Form
                        form={form}
                        className={styles.formContent}
                        autoComplete="off"
                        layout="vertical"
                        onValuesChange={(changedValues) => {
                            handleValueChange(changedValues)
                        }}
                        onFinish={handleFinish}
                        scrollToFirstError
                    >
                        <div
                            id="component-indictor-definition"
                            className={styles.formModuleContainer}
                        >
                            <div className={styles.moduleTitle}>
                                <h4>{__('基本属性')}</h4>
                            </div>
                            <div>
                                <Row gutter={48}>
                                    <Col span={12}>
                                        <div
                                            className={
                                                styles.indicatorNameContainer
                                            }
                                        >
                                            <Form.Item
                                                name="name"
                                                label={__('指标名称')}
                                                required
                                                validateFirst
                                                validateTrigger={[
                                                    'onChange',
                                                    'onBlur',
                                                ]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('输入不能为空'),
                                                        transform: (value) =>
                                                            trim(value),
                                                    },
                                                    // {
                                                    //     pattern: nameReg,
                                                    //     message:
                                                    //         __(
                                                    //             '仅支持中英文、数字、下划线及中划线',
                                                    //         ),
                                                    //     transform: (value) =>
                                                    //         trim(value),
                                                    // },
                                                    {
                                                        validateTrigger: [
                                                            'onBlur',
                                                        ],
                                                        validator: (
                                                            ruler,
                                                            value,
                                                        ) => {
                                                            const params =
                                                                indicatorId
                                                                    ? {
                                                                          name: value,
                                                                          id: indicatorId,
                                                                      }
                                                                    : {
                                                                          name: value,
                                                                      }
                                                            return checkIndicatorName(
                                                                ruler,
                                                                params,
                                                            )
                                                        },
                                                    },
                                                ]}
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Input
                                                    maxLength={128}
                                                    placeholder={__(
                                                        '请输入指标名称',
                                                    )}
                                                />
                                            </Form.Item>
                                            <Button
                                                disabled={
                                                    !businessIndicatorDetail
                                                }
                                                className={
                                                    styles.autoNameButton
                                                }
                                                onClick={() => {
                                                    form.setFields([
                                                        {
                                                            name: 'name',
                                                            errors: [],
                                                            value: businessIndicatorDetail.name,
                                                        },
                                                    ])
                                                }}
                                            >
                                                {__('使用业务指标名称')}
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="businessIndicator"
                                            label={__('关联业务指标')}
                                        >
                                            <BusinessIndictorSelector
                                                onChange={(
                                                    newValue,
                                                    detail,
                                                ) => {
                                                    if (detail) {
                                                        setBusinessIndicatorDetail(
                                                            detail,
                                                        )
                                                        form.setFields([
                                                            {
                                                                name: ['code'],
                                                                value: detail.code,
                                                                errors: [],
                                                            },
                                                            {
                                                                name: [
                                                                    'indicator_unit',
                                                                ],
                                                                value: detail.unit,
                                                                errors: [],
                                                            },
                                                            {
                                                                name: ['level'],
                                                                value: detail.level,
                                                                errors: [],
                                                            },
                                                            {
                                                                name: [
                                                                    'businessIndicator',
                                                                ],
                                                                value: newValue,
                                                                errors: [],
                                                            },
                                                        ])
                                                        setBusinessIndicatorError(
                                                            false,
                                                        )
                                                    } else {
                                                        setBusinessIndicatorDetail(
                                                            null,
                                                        )
                                                        form.setFields([
                                                            {
                                                                name: ['code'],
                                                                value: '',
                                                                errors: [],
                                                            },
                                                            {
                                                                name: [
                                                                    'indicator_unit',
                                                                ],
                                                                value: '',
                                                                errors: [],
                                                            },
                                                        ])
                                                    }
                                                }}
                                                isError={businessIndicatorError}
                                                usedBusinessIndicatorsId={
                                                    usedBusinessIndicatorsId
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={48}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="code"
                                            label={__('编码')}
                                            validateFirst
                                            validateTrigger={[
                                                'onBlur',
                                                'onChange',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('输入不能为空'),
                                                    transform: (value) =>
                                                        trim(value),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    pattern: codeIDReg,
                                                    message:
                                                        __(
                                                            '仅支持输入英文、数字、-',
                                                        ),
                                                    transform: (value) =>
                                                        trim(value),
                                                },
                                                {
                                                    validateTrigger: ['onBlur'],
                                                    validator: (
                                                        ruler,
                                                        value,
                                                    ) => {
                                                        if (
                                                            businessIndicatorDetail
                                                        ) {
                                                            return Promise.resolve()
                                                        }
                                                        const params =
                                                            indicatorId
                                                                ? {
                                                                      code: value,
                                                                      id: indicatorId,
                                                                  }
                                                                : {
                                                                      code: value,
                                                                  }
                                                        return checkIndicatorCode(
                                                            ruler,
                                                            params,
                                                        )
                                                    },
                                                },
                                            ]}
                                        >
                                            <Input
                                                maxLength={128}
                                                placeholder={__('请输入编码')}
                                                disabled={
                                                    !!businessIndicatorDetail
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="level"
                                            label={
                                                <div>
                                                    <span>
                                                        {__('指标等级')}
                                                    </span>

                                                    <Tooltip
                                                        title={
                                                            <div>
                                                                <div>
                                                                    {__(
                                                                        '指标等级：',
                                                                    )}
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: 'rgba(0,0,0,0.65)',
                                                                    }}
                                                                >
                                                                    {__(
                                                                        'T1: 最高优先级，可能直接关联到组织的核心目标和战略',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: 'rgba(0,0,0,0.65)',
                                                                    }}
                                                                >
                                                                    {__(
                                                                        'T2: 一般优先级，可能更多地与战术层面的决策相关',
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        color: 'rgba(0,0,0,0.65)',
                                                                    }}
                                                                >
                                                                    {__(
                                                                        'T3: 最低优先级，对于组织的日常运营是重要的，不会直接影响长期战略目标',
                                                                    )}
                                                                </div>
                                                            </div>
                                                        }
                                                        color="#fff"
                                                        overlayInnerStyle={{
                                                            color: 'rgba(0,0,0,0.85)',
                                                        }}
                                                        placement="right"
                                                    >
                                                        <span
                                                            style={{
                                                                color: 'rgba(0,0,0,0.65)',
                                                                marginLeft: 8,
                                                            }}
                                                        >
                                                            <InfoCircleOutlined />
                                                        </span>
                                                    </Tooltip>
                                                </div>
                                            }
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                        >
                                            <Select
                                                placeholder={__(
                                                    '请选择指标等级',
                                                )}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            >
                                                {indicatorLevel.map((item) => (
                                                    <Select.Option
                                                        value={item.value}
                                                        key={item.value}
                                                    >
                                                        {item.label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={48}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="indicator_unit"
                                            label={__('指标单位')}
                                            required
                                            validateFirst
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __(
                                                            '请选择或输入指标单位',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <AutoComplete
                                                options={UnitOptions}
                                                placeholder={__(
                                                    '请选择或输入指标单位',
                                                )}
                                                disabled={
                                                    !!businessIndicatorDetail
                                                }
                                                maxLength={10}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item
                                    name="description"
                                    label={__('指标定义')}
                                >
                                    <Input.TextArea
                                        className={styles.descriptionArea}
                                        maxLength={300}
                                        showCount
                                        placeholder={__('请输入指标定义')}
                                    />
                                </Form.Item>
                            </div>
                        </div>
                        <div
                            id="component-data-manage"
                            className={styles.formModuleContainer}
                        >
                            <div className={styles.moduleTitle}>
                                <h4>{__('管理属性')}</h4>
                            </div>
                            <div>{getManageIndicatorComponent()}</div>
                        </div>
                        <div
                            id="component-develop-config"
                            className={styles.formModuleContainer}
                            hidden={isGraphForm}
                        >
                            <div className={styles.moduleTitle}>
                                <h4>{__('技术属性')}</h4>
                            </div>
                            <div>{getIndicatorComponent()}</div>
                        </div>

                        <div
                            id="component-data-preview"
                            className={styles.formModuleContainer}
                            hidden={isGraphForm}
                        >
                            <div className={styles.moduleTitle}>
                                <div>
                                    <span className={styles.previewTitle}>
                                        {__('数据预览')}
                                    </span>
                                    <Button
                                        type="link"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            runIndicatorResult()
                                        }}
                                    >
                                        {__('刷新数据')}
                                    </Button>
                                </div>
                            </div>
                            <div>
                                {viewLoading ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Spin />
                                    </div>
                                ) : viewData?.length ? (
                                    <Table
                                        columns={column}
                                        dataSource={viewData}
                                        pagination={false}
                                    />
                                ) : (
                                    <div className={styles.viewDataEmpty}>
                                        {__('暂无数据')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Form>
                </div>
                <div className={styles.menuContainer} hidden={isGraphForm}>
                    <Anchor
                        targetOffset={160}
                        getContainer={() =>
                            (container.current as HTMLElement) || window
                        }
                        onClick={(e: any) => e.preventDefault()}
                        className={styles.anchorWrapper}
                    >
                        <Link
                            href="#component-indictor-definition"
                            title={__('基本属性')}
                        />
                        <Link
                            href="#component-data-manage"
                            title={__('管理属性')}
                        />
                        <Link
                            href="#component-develop-config"
                            title={__('技术属性')}
                        />
                        <Link
                            href="#component-data-preview"
                            title={__('数据预览')}
                        />
                    </Anchor>
                </div>
                {viewDetailId && (
                    <IndicatorView
                        onClose={() => {
                            setViewDetailId('')
                        }}
                        mask
                        style={{ position: 'absolute', top: 0 }}
                        IndicatorId={viewDetailId}
                        type={TabsKey.ATOMS}
                    />
                )}
            </div>
        </div>
    )
}
export default ConfigIndcatorForm
