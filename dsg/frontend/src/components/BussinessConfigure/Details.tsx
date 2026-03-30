import React, { useState, useEffect, forwardRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
    Button,
    Collapse,
    Form,
    Input,
    Tag,
    Table,
    Cascader,
    Select,
    DatePicker,
    Tooltip,
    message,
    Space,
} from 'antd'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import moment from 'moment'
import classnames from 'classnames'
import { useGetState } from 'ahooks'
import {
    AddOutlined,
    BusinessFormOutlined,
    DeleteOutLined,
    RefreshOutlined,
} from '@/icons'
import styles from './styles.module.less'
import { OptionModel } from '../MetricModel/const'
import {
    FieldTypes,
    FieldInfos,
    groupOptions,
    limitNumber,
    limitList,
    BelongList,
    limitString,
    beforeTime,
    currentTime,
    limitAndBelongList,
    limitDateRanger,
    beforeDateOptions,
    currentDateOptions,
    beforeDateTimeOptions,
    currentDataTimeOptions,
} from './const'
import __ from './locale'
import {
    validateEmpty,
    validateLimitNumber,
    validateLimitString,
    validateCascader,
    validateGroupCascader,
} from '@/utils/validate'
import { checkNormalInput, getQueryData, combUrl } from '../FormGraph/helper'
import {
    checkCurrentGroupExist,
    checkCurrentMeasureExist,
    checkCurrentWhereExist,
    formDefaultValue,
    measureItems,
} from './helper'
import {
    getIndicatorList,
    getIndicatorDetails,
    createIndicator,
    editIndicator,
    formatError,
    getCodeTableDetail,
    viewIndicator,
} from '@/core'
import IndicatorSelect from './IndicatorSelect'
import Icons from './Icons'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'

const { RangePicker } = DatePicker
const { Panel } = Collapse

interface DetailsType {
    mode: OptionModel
    onClose: () => void
    graphData: any
    modelId: string
    indicatorId?: string
    ref?: any
    form: any
    dataTypeOptions: any
}
const Details: React.FC<DetailsType> = forwardRef((props: any, ref) => {
    const {
        mode,
        onClose,
        graphData,
        modelId,
        indicatorId,
        form,
        dataTypeOptions,
    } = props
    // casder面板只展示最后一级目录
    const displayRender = (labels: string[]) => {
        if (labels && labels[0] && labels[1]) {
            return (
                <div className={styles.ellipsis}>
                    {labels[labels.length - 1]}
                </div>
            )
        }
        return (
            <span style={{ color: 'rgba(0, 0, 0, 0.35)' }}>
                {__('请选择字段名称')}
            </span>
        )
    }
    const [cascaderOption, setCascaderOption] = useState([])
    const [limitAndGroupOptions, setLimitAndGroupOptions] = useState([])
    const [fieldList, setFieldList] = useState<any>([])
    const [fieldMap, setFieldMap] = useState<any>({})
    const [metricOption, setMetricOption] = useState<any>([])
    const [viewColumns, setViewColumns] = useState([])
    const [viewData, setViewData] = useState([])
    const [newGraphData, setNewGraphData] = useState<any>([])
    const [loading, setLoading] = useState(false)
    const [isDisabled, setIsDisabled] = useState(false)
    const [formData, setFormData] = useState<any>(formDefaultValue)
    const [tableList, setTableList] = useState<any>([])
    const [indicatorList, setIndicatorList] = useState<any>([])
    const [metricObj, setMetricObj] = useState<any>({})
    const navigator = useNavigate()
    const { search } = useLocation()
    const [queryData, setQueryData] = useState<any>(getQueryData(search))
    const [viewIndicatorStatus, setViewIndicatorStatus] =
        useState<boolean>(false)

    const [resetMeasureStatus, setResetMeasureStatus] = useState<boolean>(false)
    const [viewIndicatorErrorStatus, setViewIndicatorErrorStatus] =
        useState<string>('')
    const [groupData, setGroupData, getGroupData] = useGetState<any | null>(
        null,
    )
    const [searchParams, setSearchParams] = useSearchParams()

    useEffect(() => {
        getFieldData()
    }, [])

    useEffect(() => {
        if (fieldList && fieldList.length > 0) {
            getMetricList()
        }
    }, [modelId, fieldList])

    useEffect(() => {
        // 编辑模式下才查看详情接口
        if (Object.keys(fieldMap).length > 0 && mode === 'editMetric') {
            getMetricDetail()
        }
    }, [indicatorId, fieldMap])

    // 编辑指标
    const getMetricDetail = async () => {
        try {
            if (indicatorId) {
                const res = await getIndicatorDetails(indicatorId)
                const { desc, name, rule } = res
                const { group, where, measure } = rule
                // 过滤掉被删除的字段  fieldList是表示目前画布中包含的所有字段
                const fieldArr = measure?.member?.map((item) => {
                    if (
                        fieldList.find(
                            (fieldItem) =>
                                fieldItem.field_id ===
                                item.object.field_id?.[1],
                        )
                    ) {
                        return {
                            type: item.type,
                            field_id: item.object.field_id,
                        }
                    }
                    return ''
                })
                handerLimitAndGroupFn(fieldArr)
                const newWhere: any = []
                const newLimit: any = []
                //  对限定数据进行转换
                where.forEach((item) => {
                    const { member, relation } = item
                    const newMember: any = []
                    member.forEach(async (subItem) => {
                        let subObj: any = {
                            field_id: subItem.field_id,
                            operator: subItem.operator,
                            value: subItem.value,
                        }
                        if (beforeTime.includes(subItem.operator)) {
                            let newUnit = ''
                            const newArr = subItem.value?.split(' ')
                            if (newArr.length === 2) {
                                newUnit = `${subItem.value.split(' ')[1]}`
                            }
                            if (newArr.length === 3) {
                                newUnit = `${subItem.value.split(' ')[1]} ${
                                    subItem.value.split(' ')[2]
                                }`
                            }
                            subObj = {
                                field_id: subItem.field_id,
                                operator: subItem.operator,
                                dateNumber: subItem.value.split(' ')[0],
                                unit: newUnit,
                            }
                        } else if (currentTime.includes(subItem.operator)) {
                            subObj = {
                                field_id: subItem.field_id,
                                operator: subItem.operator,
                                dateNumber: '',
                                unit: subItem.value,
                            }
                        } else if (limitDateRanger.includes(subItem.operator)) {
                            const time = subItem.value.split(',')
                            const newValue = time.map((timeValue) =>
                                moment(timeValue),
                            )
                            subObj = {
                                field_id: subItem.field_id,
                                operator: subItem.operator,
                                value: newValue,
                            }
                        } else if (
                            limitAndBelongList.includes(subItem.operator)
                        ) {
                            subObj = {
                                field_id: subItem.field_id,
                                operator: subItem.operator,
                                value: subItem.value.split(','),
                            }
                        }
                        newMember.push(subObj)
                        newLimit.push(subItem)
                    })
                    newWhere.push({
                        relation,
                        member: newMember,
                    })
                })
                const objArr: any = []
                await Promise.all(
                    newLimit.map((items) => setCodeTableValue(items, objArr)),
                )
                form.setFieldsValue({
                    desc,
                    name,
                    group: group.map((g) => {
                        return { ...g, format: g.format || undefined }
                    }),
                    where: newWhere,
                    measure,
                })
                const notExistMember = checkCurrentMeasureExist(
                    measure,
                    cascaderOption,
                    indicatorList,
                )
                if (notExistMember.length) {
                    notExistMember.forEach((currentIndex) => {
                        form.setFields([
                            {
                                name: [
                                    'measure',
                                    'member',
                                    currentIndex.index,
                                    'object',
                                    currentIndex.type === 'field'
                                        ? 'field_id'
                                        : 'parent_indicator',
                                ],
                                errors: [__('已被删除，请重新选择')],
                                value: null,
                            },
                        ])
                    })
                }
                const notExistWhere = checkCurrentWhereExist(
                    newWhere,
                    cascaderOption,
                )
                if (notExistWhere.length) {
                    notExistWhere.forEach((currentIndex) => {
                        form.setFields([
                            {
                                name: [
                                    'where',
                                    currentIndex[0],
                                    'member',
                                    currentIndex[1],
                                    'field_id',
                                ],
                                errors: [__('已被删除，请重新选择')],
                                value: null,
                            },
                        ])
                    })
                }
                const notExitGroup = checkCurrentGroupExist(
                    group,
                    cascaderOption,
                )
                if (notExitGroup.length) {
                    notExitGroup.forEach((currentIndex) => {
                        form.setFields([
                            {
                                name: ['group', currentIndex, 'field_id'],
                                errors: [__('已被删除，请重新选择')],
                                value: null,
                            },
                        ])
                    })
                }
                setFormData({
                    desc,
                    name,
                    group: group.map((g) => {
                        return { ...g, format: g.format || undefined }
                    }),
                    where: newWhere,
                    measure,
                })
                setDeleteDisabled(measure)
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    // 为不同字段设置码表的下拉选项
    const setCodeTableValue = async (memberItme, objArr) => {
        // 针对码表的选项
        let obj: any = {}
        const { field_id, operator } = memberItme
        if (operator === 'in list') {
            const [table_id, fieldId] = Array.isArray(field_id)
                ? field_id
                : ['', '']
            const { code_table_code } = fieldList.find(
                (field) => field.field_id === fieldId,
            )
            const { enums } = await getCodeTableDetail(code_table_code)
            obj = {
                fieldId,
                options: enums.map((table) => ({
                    label: table.code,
                    value: table.code,
                })),
            }
            objArr.push(obj)
            setTableList(objArr)
        }
    }
    // 根据模型获取指标列表
    const getMetricList = async () => {
        try {
            if (modelId) {
                const res = await getIndicatorList(modelId)
                if (res && res.length) {
                    const obj: any = {}
                    res.forEach((item) => {
                        obj[item.indicator_id] = item.name
                    })
                    setMetricObj(obj)
                    const optionArr: any = res.map((item) => ({
                        label: item.name,
                        value: item.indicator_id,
                    }))
                    setMetricOption(optionArr)
                    const newArr = await Promise.all(
                        optionArr.map((option) =>
                            fetchMetricOptions(option, obj),
                        ),
                    )
                    setIndicatorList(
                        newArr.filter(
                            (item) =>
                                item?.rule.where.length === 0 &&
                                item?.rule.group.length === 0,
                        ),
                    )
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    // 生成渲染指标列表数据
    const fetchMetricOptions = async (option, obj) => {
        const { value } = option
        const res = await getIndicatorDetails(value)
        const { rule, name, indicator_id } = res
        const { measure, where, group } = rule
        const { operator } = measure
        const newMeasure: any = []
        measure.member.forEach((item) => {
            if (item.type === 'field') {
                const newobj = fieldList.find(
                    (subItem) =>
                        subItem?.field_id === item.object.field_id?.[1],
                )
                newMeasure.push({
                    ...newobj,
                    type: item.type,
                    field_id: item.object.field_id,
                    aggregate: item.object.aggregate,
                })
            } else {
                newMeasure.push({
                    type: item.type,
                    name: obj[item.object.parent_indicator],
                    parent_indicator: item.object.parent_indicator,
                })
            }
        })
        return {
            name,
            indicator_id,
            rule: {
                where,
                group,
                measure: {
                    member: newMeasure,
                    operator,
                },
            },
        }
    }
    // 通过画布数据拿到字段信息
    const getFieldData = () => {
        if (graphData && graphData.length > 0) {
            const newData: any = []
            const newFieldList: any = []
            const mapObj = {}
            const newGraphArr: any = []
            graphData.forEach((item) => {
                const obj: any = {
                    value: '',
                    label: '',
                    children: [],
                }
                const newObj: any = {
                    table_id: item.data.fid,
                    formInfo: item.data.formInfo,
                    formAttr: item?.data?.formAttr,
                    items: item?.data?.items,
                    relations: item?.data?.relationData?.relations,
                }
                obj.value = item.data.formInfo.id
                obj.label = (
                    <div
                        className={styles.selectedOption}
                        title={item.data.formInfo.name}
                    >
                        <BusinessFormOutlined />
                        <div className={styles.seletedOptionsName}>
                            {item.data.formInfo.name}
                        </div>
                    </div>
                )
                let fieldObj: any = {}
                item?.data.items.forEach((subitem) => {
                    fieldObj = {
                        name: subitem.name,
                        field_id: subitem.id,
                        data_type:
                            dataTypeOptions.length > 0 &&
                            dataTypeOptions.find((it) => {
                                return it.value_en === subitem.data_type
                            })?.value,
                        code_table_code: subitem.code_table_code,
                        code_table: subitem.code_table,
                        standard_status: subitem.standard_status,
                    }
                    mapObj[subitem.id] =
                        dataTypeOptions.length > 0 &&
                        dataTypeOptions.find((it) => {
                            return it.value_en === subitem.data_type
                        })?.value
                    newFieldList.push(fieldObj)
                    if (subitem.data_type !== 'binary') {
                        const zhDataType = dataTypeOptions.find((it) => {
                            return it.value_en === subitem.data_type
                        })
                        obj.children.push({
                            value: subitem.id,
                            label: (
                                <div
                                    className={styles.selectedOption}
                                    title={subitem.name}
                                >
                                    <Icons type={zhDataType.value || ''} />
                                    <div className={styles.seletedOptionsName}>
                                        {subitem.name}
                                    </div>
                                </div>
                            ),
                        })
                    }
                })
                newGraphArr.push(newObj)
                if (obj.children.length) {
                    newData.push(obj)
                } else {
                    obj.children.push({
                        value: '-1',
                        label: (
                            <div
                                style={{
                                    color: 'rgba(0,0,0,45%)',
                                    fontSize: 12,
                                }}
                            >
                                {__('暂无数据')}
                            </div>
                        ),
                        disabled: true,
                    })
                    newData.push(obj)
                }
            })
            setFieldMap(mapObj)
            setFieldList(newFieldList)
            setNewGraphData(newGraphArr)
            setCascaderOption(newData)
        }
    }
    // 删除一项度量数据
    const removeMeasure = (index) => {
        const values = form.getFieldsValue()
        values?.measure?.member.splice(index, 1)
        const newMember = values?.measure?.member
        const operator = values?.measure?.operator
        form.setFieldsValue({
            ...values,
            measure: {
                member: newMember,
                operator,
            },
        })
        setFormData({
            ...values,
            measure: {
                member: newMember,
                operator,
            },
        })
        const newFieldValue = {
            ...values,
            measure: {
                member: newMember,
                operator,
            },
        }
        const fieldArr = newMember?.map((item) => ({
            type: item.type,
            field_id: item.object.field_id,
        }))
        handerLimitAndGroupFn(fieldArr, newFieldValue)
    }
    // 删除限定数据
    const removeWhere = (i, j) => {
        const values = form.getFieldsValue()
        const newWhere = values?.where
        if (newWhere[i].member.length === 1) {
            newWhere.splice(i, 1)
        } else {
            newWhere[i].member.splice(j, 1)
        }
        form.setFieldsValue({
            ...values,
            where: newWhere,
        })
        setFormData({
            ...values,
            where: newWhere,
        })
    }
    // 监听表单字段变化
    const onValuesChange = async (currentValue: any, allValues: any) => {
        const key = Object.keys(currentValue)[0]
        const value = currentValue[Object.keys(currentValue)[0]]
        if (key === 'measure') {
            const fieldArr = allValues?.measure?.member?.map((item) => ({
                type: item.type,
                field_id: item.object.field_id,
            }))
            handerLimitAndGroupFn(fieldArr)
            setDeleteDisabled(allValues.measure)
        }
        setFormData(allValues)
    }
    // 根据选择的度量字段，判断是否需要添加限定或者分组，判断分组和限定的Cascader的下拉选项（在画布中必须是同一组，有连线或者单个表）
    const handerLimitAndGroupFn = (fieldArr, newFieldValue?) => {
        if (newGraphData && Object.keys(newGraphData).length > 0) {
            const values = form.getFieldsValue()
            // 字段中包含指标类型
            if (fieldArr.find((item) => item?.type === 'indicator')) {
                setIsDisabled(true)
                if (newFieldValue && Object.keys(newFieldValue).length > 0) {
                    form.setFieldsValue({
                        ...newFieldValue,
                        where: [],
                        group: [],
                    })
                    setFormData({
                        ...newFieldValue,
                        where: [],
                        group: [],
                    })
                } else {
                    form.setFieldsValue({
                        ...values,
                        where: [],
                        group: [],
                    })
                    setFormData({
                        ...values,
                        where: [],
                        group: [],
                    })
                }

                return
            }
            const usefullField: any = []
            // usefullField是最终确定的，去重复的数组，同一张表的放在第一种处理了
            fieldArr.forEach((fieldItem) => {
                if (
                    fieldItem &&
                    fieldItem.field_id &&
                    fieldItem.field_id?.[0] !== '' &&
                    fieldItem.field_id?.[1] !== ''
                ) {
                    if (
                        !usefullField.find(
                            (item) =>
                                item.field_id[0] === fieldItem.field_id[0],
                        )
                    ) {
                        usefullField.push(fieldItem)
                    }
                }
            })
            // 不包含指标类型，只选定了一个字段，或者两个字段是属于同一个表
            if (usefullField?.length === 1) {
                const [table_id, field_id] = usefullField[0].field_id
                const { formAttr, items } = newGraphData.find(
                    (item) => item.table_id === table_id,
                )
                if (formAttr && formAttr === 'inForm') {
                    const { relations } = newGraphData.find(
                        (item) => item.table_id === table_id,
                    )
                    const src_fields = relations?.reduce((prev, cur) => {
                        prev.push(cur.src_field)
                        return prev
                    }, [])
                    const tableIdList: any = [table_id]
                    src_fields.forEach((src_field) => {
                        newGraphData.forEach((subItem, index) => {
                            if (
                                subItem.items.find(
                                    (field) => field.id === src_field,
                                )
                            ) {
                                tableIdList.push(subItem.table_id)
                            }
                        })
                    })

                    const finalGraph: any = []
                    newGraphData.forEach((item) => {
                        if (tableIdList.includes(item.table_id)) {
                            finalGraph.push(item)
                        }
                    })
                    setOptionsByFinal(finalGraph, values)
                }
                if (formAttr && formAttr === 'outForm' && field_id) {
                    const tableIdList: any = [table_id]
                    newGraphData.forEach((graph) => {
                        const { relations } = graph
                        if (relations && relations.length === 1) {
                            const { src_field, target_field } = relations[0]
                            if (
                                items.find(
                                    (outItem) => outItem.id === src_field,
                                )
                            ) {
                                tableIdList.push(graph.table_id)
                            }
                        }
                    })
                    const finalGraph: any = []
                    newGraphData.forEach((item) => {
                        if (tableIdList.includes(item.table_id)) {
                            finalGraph.push(item)
                        }
                    })
                    setOptionsByFinal(finalGraph, values)
                }
            }
            // 选择了两个不同表格的字段
            if (usefullField.length === 2) {
                handerDifFieldtable(usefullField, values)
            }
        }
    }
    // 针对两个字段是不同表格的处理，一定是一个出表，一个入表
    const handerDifFieldtable = (usefullField, values) => {
        const firstTableId =
            usefullField[0].field_id && usefullField[0].field_id[0]
        const secondTableId =
            usefullField[1].field_id && usefullField[1].field_id[0]
        const firstGraph = newGraphData.find(
            (item) => item.table_id === firstTableId,
        )
        const secondGraph = newGraphData.find(
            (item) => item.table_id === secondTableId,
        )
        // 对数据进行出入表排序，只要考虑一种情况
        const sortGraphArr = [firstGraph, secondGraph].sort(charArrSort)
        const [firstT, secondT] = sortGraphArr
        if (firstT?.formAttr === 'inForm' && secondT?.formAttr === 'outForm') {
            let tableIdList: any = []
            const { relations } = firstT
            const src_fields = relations?.reduce((prev, cur) => {
                prev.push(cur.src_field)
                return prev
            }, [])
            src_fields.forEach((src_field) => {
                if (secondT.items.find((field) => field.id === src_field)) {
                    tableIdList = [firstT.table_id, secondT.table_id]
                }
            })
            const finalGraph: any = []
            newGraphData.forEach((item) => {
                if (tableIdList.includes(item.table_id)) {
                    finalGraph.push(item)
                }
            })
            setOptionsByFinal(finalGraph, values)
        } else {
            setIsDisabled(true)
            form.setFieldsValue({
                ...values,
                where: [],
                group: [],
            })
            setFormData({
                ...values,
                where: [],
                group: [],
            })
        }
    }
    // 对数据进行字母表排序
    const charArrSort = (a, b) => {
        // 获取原字母与转小写字母后的2倍ascii码
        const a1 = 2 * a.formAttr.charCodeAt()
        const b1 = 2 * b.formAttr.charCodeAt()
        let a2 = 2 * a.formAttr.toLowerCase().charCodeAt()
        let b2 = 2 * b.formAttr.toLowerCase().charCodeAt()
        // 如果原字母大写则结果+1
        a2 = a1 === a2 ? a2 : a2 + 1
        b2 = b1 === b2 ? b2 : b2 + 1
        return a2 - b2
    }
    // 根据找到的table去渲染限定和分组的级联选择器
    const setOptionsByFinal = (finalGraph, values) => {
        if (finalGraph && finalGraph.length > 0) {
            setIsDisabled(false)
            const newData: any = []
            finalGraph.forEach((item) => {
                const obj: any = {
                    value: '',
                    label: '',
                    children: [],
                }
                obj.value = item.formInfo.id
                obj.label = (
                    <div
                        className={styles.selectedOption}
                        title={item.formInfo.name}
                    >
                        <BusinessFormOutlined />
                        <div className={styles.seletedOptionsName}>
                            {item.formInfo.name}
                        </div>
                    </div>
                )
                item?.items.forEach((subitem) => {
                    if (subitem.data_type !== 'binary') {
                        const zhDataType = dataTypeOptions.find((it) => {
                            return it.value_en === subitem.data_type
                        })
                        obj.children.push({
                            value: subitem.id,
                            label: (
                                <div
                                    className={styles.selectedOption}
                                    title={subitem.name}
                                >
                                    <Icons type={zhDataType.value || ''} />
                                    <div className={styles.seletedOptionsName}>
                                        {subitem.name}
                                    </div>
                                </div>
                            ),
                        })
                    }
                })
                newData.push(obj)
            })
            setLimitAndGroupOptions(newData)
        } else {
            // 没找到最终的表字段的话就置空数据
            setIsDisabled(true)
            form.setFieldsValue({
                ...values,
                where: [],
                group: [],
            })
            setFormData({
                ...values,
                where: [],
                group: [],
            })
        }
    }
    // 获取度量、限定、分组部分的入参数据（改造数据）
    const getParams = (values?: any) => {
        const value = form.getFieldsValue() || values
        const { name, desc, measure, group, where } = value
        const newMeasureArr: any = []
        measure.member?.forEach((item) => {
            let obj: any = {}
            if (item.type === 'field') {
                obj = {
                    type: item.type,
                    object: {
                        aggregate: item.object.aggregate,
                        field_id: item.object.field_id,
                    },
                }
            } else {
                obj = {
                    type: item.type,
                    object: {
                        parent_indicator: item.object.parent_indicator,
                    },
                }
            }
            newMeasureArr.push(obj)
        })
        const newMeasure = { ...measure, member: newMeasureArr }
        const newWhere: any = []
        where.forEach((item) => {
            const { member, relation } = item
            const newMember: any = []
            member.forEach((subItem) => {
                let subObj: any = {
                    field_id: subItem.field_id,
                    operator: subItem.operator,
                    value: subItem.value,
                }
                if (beforeTime.includes(subItem.operator)) {
                    subObj = {
                        field_id: subItem.field_id,
                        operator: subItem.operator,
                        value: `${subItem.dateNumber} ${subItem.unit}`,
                    }
                } else if (currentTime.includes(subItem.operator)) {
                    subObj = {
                        field_id: subItem.field_id,
                        operator: subItem.operator,
                        value: subItem.unit,
                    }
                } else if (limitDateRanger.includes(subItem.operator)) {
                    const newValue = subItem.value
                        .map((dateItem) => dateItem.format('YYYY-MM-DD HH:mm'))
                        .join(',')
                    subObj = {
                        field_id: subItem.field_id,
                        operator: subItem.operator,
                        value: newValue,
                    }
                } else if (limitAndBelongList.includes(subItem.operator)) {
                    subObj = {
                        field_id: subItem.field_id,
                        operator: subItem.operator,
                        value: subItem.value.join(','),
                    }
                }
                newMember.push(subObj)
            })
            newWhere.push({
                relation,
                member: newMember,
            })
        })

        const newGroup: any = []
        group.forEach((item) => {
            let obj: any = {
                field_id: item.field_id,
            }
            const { field_id } = item
            const [table_id, fieldId] = field_id
            //  如果是日期型型的分组 则加上format
            if (
                [
                    FieldTypes.DATE,
                    FieldTypes.DATETIME,
                    FieldTypes.TIMESTAMP,
                ].includes(fieldMap[fieldId])
            ) {
                obj = {
                    field_id: item.field_id,
                    format: item.format,
                }
            }
            newGroup.push(obj)
        })
        const params = {
            name,
            desc,
            rule: {
                measure: newMeasure,
                group: newGroup,
                where: newWhere,
            },
        }
        return params
    }
    // 保存指标和模型
    const onFinish = async (values) => {
        try {
            if (modelId) {
                const params = getParams(values)
                if (indicatorId && mode === 'editMetric') {
                    await editIndicator(indicatorId, params)
                    message.success('编辑成功')
                } else {
                    await createIndicator(modelId, params)
                    form.setFieldsValue(formDefaultValue)
                    message.success('新建成功')
                }
                setFormData(formDefaultValue)
                setViewData([])
                setViewColumns([])
                if (searchParams.get('jumpMode') === 'win') {
                    navigator(combUrl(queryData))
                    return
                }
                navigator(combUrl(queryData))
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    // 重置限定
    const resetLimit = () => {
        const values = form.getFieldsValue()
        form.setFieldsValue({
            ...values,
            where: [],
        })
        setFormData({
            ...values,
            where: [],
        })
    }

    // 重置分组
    const resetGroup = () => {
        const values = form.getFieldsValue()
        form.setFieldsValue({
            ...values,
            group: [],
        })
        setFormData({
            ...values,
            group: [],
        })
    }
    // 根据度量类型渲染右侧不同节点
    const rendermeasureType = (newForm, index) => {
        if (newForm) {
            const value = newForm.getFieldsValue()

            if (
                value &&
                value.measure &&
                value.measure.member &&
                value.measure.member[index]
            ) {
                return value.measure.member[index].type === 'field'
            }
        }
        return true
    }
    // 渲染度量下拉框options
    const renderMeasureOptions = (newForm, index) => {
        if (newForm) {
            const value = newForm.getFieldsValue()
            if (value && value.measure && value.measure.member?.[index]) {
                const { field_id } = value.measure.member[index].object
                if (field_id && field_id[0] && field_id[1]) {
                    const [table_id, fieldId] = field_id
                    if (fieldMap[fieldId]) {
                        return FieldInfos[fieldMap[fieldId] as FieldTypes]
                            .polymerizationOptions
                    }
                }
            }
        }
        return []
    }
    //  判断分组的数据格式
    const renderGroupBoolean = (fieldId) => {
        return [
            FieldTypes.DATE,
            FieldTypes.DATETIME,
            FieldTypes.TIMESTAMP,
        ].includes(fieldMap[fieldId])
    }

    // 切换码表的时候,把后面的数据置空
    const changeTableOptions = async (value, i, j) => {
        const newvalue = form.getFieldsValue()
        form.validateFields()
        if (value === 'in list') {
            if (newvalue && newvalue.where && newvalue.where[i].member[j]) {
                const { field_id } = newvalue.where[i].member[j]
                if (field_id && field_id[0] && field_id[1]) {
                    const [table_id, fieldId] = field_id
                    const { code_table_code } = fieldList.find(
                        (field) => field.field_id === fieldId,
                    )
                    const { enums } = await getCodeTableDetail(code_table_code)
                    setTableList([
                        ...tableList,
                        {
                            fieldId,
                            options: enums.map((table) => ({
                                label: table.code,
                                value: table.code,
                            })),
                        },
                    ])
                }
            }
        }
        clearLimitValue(i, j, value, newvalue)
    }
    // 切换限定下拉框的时候，清空或者改变后续的值
    const clearLimitValue = (i, j, value, newvalue) => {
        const { name, desc, measure, group, where } = newvalue
        const newWhere: any = []
        where.forEach((item, outIndex) => {
            const { member, relation } = item
            const newMember: any = []
            member.forEach((subItem, innerIndex) => {
                let subObj: any = {
                    ...subItem,
                }
                // 找到修改的对应项
                if (outIndex === i && innerIndex === j) {
                    if (value === 'in list' || value === 'belong') {
                        subObj = { ...subItem, value: [] }
                    } else if (value === 'current' || value === 'before') {
                        subObj = {
                            ...subItem,
                            dateNumber: '',
                            unit: '',
                            value: '',
                        }
                    } else {
                        subObj = {
                            ...subItem,
                            dateNumber: '',
                            unit: '',
                            value: '',
                        }
                    }
                }
                newMember.push(subObj)
            })
            newWhere.push({
                relation,
                member: newMember,
            })
        })
        form.setFieldsValue({
            desc,
            name,
            group,
            where: newWhere,
            measure,
        })
        setFormData({
            desc,
            name,
            group,
            where: newWhere,
            measure,
        })
    }
    // 渲染限定下拉框options
    const renderLimitOptions = (newForm, i, j) => {
        if (newForm) {
            const value = newForm.getFieldsValue()
            if (value && value.where && value.where[i].member[j]) {
                const { field_id } = value.where[i].member[j]
                if (field_id && field_id[0] && field_id[1]) {
                    const [table_id, fieldId] = field_id
                    if (fieldId && fieldMap) {
                        const findList = fieldList.find(
                            (item) => item.field_id === fieldId,
                        )
                        if (findList) {
                            const { code_table_code } = findList
                            if (code_table_code !== '') {
                                return FieldInfos[
                                    fieldMap[fieldId] as FieldTypes
                                ].LimitListOptions
                            }
                            if (code_table_code === '') {
                                return FieldInfos[
                                    fieldMap[fieldId] as FieldTypes
                                ].LimitOptions
                            }
                        }
                    }
                }
            }
        }
        return []
    }
    // 渲染限定规则的右侧value的类型
    const renderLimitNode = (i, j, newForm, innerField, type) => {
        let fieldType: string = ''
        const booleanNode: any = (
            <Form.Item
                name={[innerField.name, 'value']}
                style={{
                    width: '60%',
                    marginRight: '10px',
                }}
                rules={[
                    {
                        required: false,
                    },
                ]}
            >
                <Input disabled placeholder="限定内容" />
            </Form.Item>
        )
        if (newForm) {
            const formValue = newForm.getFieldsValue()

            if (formValue && formValue.where && formValue.where[i].member[j]) {
                const { field_id, operator } = formValue.where[i].member[j]
                const [table_id, fieldId] = Array.isArray(field_id)
                    ? field_id
                    : ['', '']
                if (fieldId && fieldMap) {
                    fieldType = fieldMap[fieldId]
                    switch (fieldType) {
                        case '数字型':
                            if (limitNumber.includes(operator)) {
                                return (
                                    <Form.Item
                                        name={[innerField.name, 'value']}
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                        rules={[
                                            {
                                                required: true,
                                                validator: (e, value) =>
                                                    validateLimitNumber(
                                                        e,
                                                        value,
                                                        formValue.where[i]
                                                            .member[j],
                                                    ),
                                            },
                                        ]}
                                    >
                                        <Input placeholder="请填写数字" />
                                    </Form.Item>
                                )
                            }
                            if (limitList.includes(operator)) {
                                return (
                                    <Form.Item
                                        name={[innerField.name, 'value']}
                                        rules={[
                                            {
                                                required: true,
                                                message: '请选择',
                                            },
                                        ]}
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Select
                                            mode="multiple"
                                            getPopupContainer={(node) =>
                                                node.parentNode
                                            }
                                            options={
                                                tableList?.find(
                                                    (tableItem) =>
                                                        tableItem.fieldId ===
                                                        fieldId,
                                                )?.options || []
                                            }
                                            notFoundContent="暂无数据"
                                        />
                                    </Form.Item>
                                )
                            }
                            if (BelongList.includes(operator)) {
                                return (
                                    <Form.Item
                                        name={[innerField.name, 'value']}
                                        rules={[
                                            {
                                                required: true,
                                                message: '输入不能为空',
                                            },
                                        ]}
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Select
                                            mode="tags"
                                            getPopupContainer={(node) =>
                                                node.parentNode
                                            }
                                            notFoundContent="暂无数据"
                                        />
                                    </Form.Item>
                                )
                            }
                            return booleanNode
                        case '字符型':
                            if (limitString.includes(operator)) {
                                return (
                                    <Form.Item
                                        name={[innerField.name, 'value']}
                                        rules={[
                                            {
                                                required: true,
                                                validator: (e, value) =>
                                                    validateLimitString(
                                                        e,
                                                        value,
                                                        formValue.where[i]
                                                            .member[j],
                                                    ),
                                            },
                                        ]}
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Input placeholder="请输入值" />
                                    </Form.Item>
                                )
                            }
                            if (limitList.includes(operator)) {
                                return (
                                    <Form.Item
                                        name={[innerField.name, 'value']}
                                        rules={[
                                            {
                                                required: true,
                                                message: '请选择',
                                            },
                                        ]}
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Select
                                            getPopupContainer={(node) =>
                                                node.parentNode
                                            }
                                            maxTagCount={2}
                                            maxTagTextLength={140}
                                            mode="multiple"
                                            placeholder="请选择"
                                            options={
                                                tableList?.find(
                                                    (tableItem) =>
                                                        tableItem.fieldId ===
                                                        fieldId,
                                                )?.options || []
                                            }
                                            notFoundContent="暂无数据"
                                        />
                                    </Form.Item>
                                )
                            }
                            if (BelongList.includes(operator)) {
                                return (
                                    <Form.Item
                                        name={[innerField.name, 'value']}
                                        rules={[
                                            {
                                                required: true,
                                                message: '输入不能为空',
                                            },
                                        ]}
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Select
                                            mode="tags"
                                            placeholder="请选择"
                                            maxTagTextLength={130}
                                            maxTagCount={2}
                                            style={{ width: '100%' }}
                                            getPopupContainer={(node) =>
                                                node.parentNode
                                            }
                                            notFoundContent="暂无数据"
                                        />
                                    </Form.Item>
                                )
                            }
                            return booleanNode
                        case '布尔型':
                            return booleanNode
                        case '日期型':
                            if (beforeTime.includes(operator)) {
                                return (
                                    <Space.Compact
                                        block
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Form.Item
                                            name={[
                                                innerField.name,
                                                'dateNumber',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    validator: (e, value) =>
                                                        validateLimitNumber(
                                                            e,
                                                            value,
                                                            formValue.where[i]
                                                                .member[j],
                                                        ),
                                                },
                                            ]}
                                            style={{
                                                width: '80%',
                                            }}
                                        >
                                            <Input placeholder="请填写数字" />
                                        </Form.Item>
                                        <Form.Item
                                            name={[innerField.name, 'unit']}
                                            style={{ width: '20%' }}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: '请选择',
                                                },
                                            ]}
                                        >
                                            <Select
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                placeholder="请选择"
                                                options={
                                                    beforeTime.includes(
                                                        operator,
                                                    )
                                                        ? beforeDateOptions
                                                        : currentDateOptions
                                                }
                                                notFoundContent="暂无数据"
                                            />
                                        </Form.Item>
                                    </Space.Compact>
                                )
                            }
                            if (currentTime.includes(operator)) {
                                return (
                                    <Space.Compact
                                        block
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Form.Item
                                            name={[
                                                innerField.name,
                                                'dateNumber',
                                            ]}
                                            rules={[
                                                {
                                                    required: false,
                                                },
                                            ]}
                                            style={{
                                                width: '75%',
                                            }}
                                        >
                                            <Input
                                                placeholder="请填写数字"
                                                disabled
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            name={[innerField.name, 'unit']}
                                            style={{ width: '25%' }}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: '请选择',
                                                },
                                            ]}
                                        >
                                            <Select
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                placeholder="请选择"
                                                options={
                                                    beforeTime.includes(
                                                        operator,
                                                    )
                                                        ? beforeDateOptions
                                                        : currentDateOptions
                                                }
                                                notFoundContent="暂无数据"
                                            />
                                        </Form.Item>
                                    </Space.Compact>
                                )
                            }
                            return (
                                <Form.Item
                                    name={[innerField.name, 'value']}
                                    style={{
                                        width: '60%',
                                        marginRight: '10px',
                                    }}
                                    rules={[
                                        {
                                            required: true,
                                            message: '请选择',
                                        },
                                    ]}
                                >
                                    <RangePicker
                                        showTime={{ format: 'HH:mm' }}
                                        format="YYYY-MM-DD"
                                    />
                                </Form.Item>
                            )
                        case '时间戳型':
                        case '日期时间型':
                            if (beforeTime.includes(operator)) {
                                return (
                                    <Space.Compact
                                        block
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Form.Item
                                            name={[
                                                innerField.name,
                                                'dateNumber',
                                            ]}
                                            rules={[
                                                {
                                                    required: true,
                                                    validator: (e, value) =>
                                                        validateLimitNumber(
                                                            e,
                                                            value,
                                                            formValue.where[i]
                                                                .member[j],
                                                        ),
                                                },
                                            ]}
                                            style={{
                                                width: '75%',
                                            }}
                                        >
                                            <Input placeholder="请填写数字" />
                                        </Form.Item>
                                        <Form.Item
                                            name={[innerField.name, 'unit']}
                                            style={{ width: '25%' }}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: '请选择',
                                                },
                                            ]}
                                        >
                                            <Select
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                placeholder="请选择"
                                                options={
                                                    beforeTime.includes(
                                                        operator,
                                                    )
                                                        ? beforeDateTimeOptions
                                                        : currentDataTimeOptions
                                                }
                                                notFoundContent="暂无数据"
                                            />
                                        </Form.Item>
                                    </Space.Compact>
                                )
                            }
                            if (currentTime.includes(operator)) {
                                return (
                                    <Space.Compact
                                        block
                                        style={{
                                            width: '60%',
                                            marginRight: '10px',
                                        }}
                                    >
                                        <Form.Item
                                            name={[
                                                innerField.name,
                                                'dateNumber',
                                            ]}
                                            rules={[
                                                {
                                                    required: false,
                                                },
                                            ]}
                                            style={{
                                                width: '80%',
                                            }}
                                        >
                                            <Input
                                                placeholder="请填写数字"
                                                disabled
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            style={{ width: '20%' }}
                                            name={[innerField.name, 'unit']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: '请选择',
                                                },
                                            ]}
                                        >
                                            <Select
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                                placeholder="请选择"
                                                options={
                                                    beforeTime.includes(
                                                        operator,
                                                    )
                                                        ? beforeDateTimeOptions
                                                        : currentDataTimeOptions
                                                }
                                                notFoundContent="暂无数据"
                                            />
                                        </Form.Item>
                                    </Space.Compact>
                                )
                            }
                            return (
                                <Form.Item
                                    name={[innerField.name, 'value']}
                                    rules={[
                                        {
                                            required: true,
                                            message: '请选择',
                                        },
                                    ]}
                                    style={{
                                        width: '60%',
                                        marginRight: '10px',
                                    }}
                                >
                                    <RangePicker
                                        showTime={{ format: 'HH:mm' }}
                                        format="YYYY-MM-DD HH:mm"
                                    />
                                </Form.Item>
                            )
                        default:
                            return (
                                <Form.Item
                                    name={[innerField.name, 'value']}
                                    rules={[
                                        {
                                            required: true,
                                            message: '请选择',
                                        },
                                    ]}
                                    style={{
                                        width: '60%',
                                        marginRight: '10px',
                                    }}
                                >
                                    <Input placeholder="请输入" />
                                </Form.Item>
                            )
                    }
                }
            }
        }
        return booleanNode
    }
    // 指标预览
    const changeColKey = async (key: string | string[]) => {
        try {
            if (key.includes('3')) {
                form.validateFields()
                    .then(async (values) => {
                        setViewData([])
                        setViewColumns([])
                        const params = {
                            ...getParams(),
                            indicator_model: modelId,
                        }
                        setLoading(true)
                        const res = await viewIndicator(params)
                        const { columns } = res
                        const dataSource =
                            res.data.length > 20
                                ? res.data.slice(0, 20)
                                : res.data
                        setViewColumns(
                            columns.map((item, index) => ({
                                key: index,
                                dataIndex: item.name,
                                title: item.name,
                                render: (text) => (
                                    <div
                                        className={styles.ellipsis}
                                        title={text}
                                    >
                                        {text}
                                    </div>
                                ),
                            })),
                        )
                        const newViewData: any = []
                        dataSource.forEach((outItem, i) => {
                            const obj: any = {}
                            outItem.forEach((innerItem, j) => {
                                const value = columns[j].name
                                obj.key = i
                                obj[value] = innerItem
                            })
                            newViewData.push(obj)
                        })
                        setViewData(newViewData)
                        setLoading(false)
                        setViewIndicatorErrorStatus('')
                    })
                    .catch((errors) => {
                        setViewIndicatorErrorStatus(errors?.data?.code || '')
                        setLoading(false)
                    })
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    // 重置度量数据
    const resetMeasure = () => {
        const values = form.getFieldsValue()
        form.setFieldsValue({
            ...values,
            measure: {
                member: [
                    {
                        type: 'field',
                        object: {
                            field_id: undefined,
                            aggregate: undefined,
                            parent_indicator: undefined,
                        },
                    },
                ],
                operator: '+',
            },
        })
        setFormData({
            ...values,
            measure: {
                member: [
                    {
                        type: undefined,
                        object: {
                            field_id: undefined,
                            aggregate: undefined,
                            parent_indicator: undefined,
                        },
                    },
                ],
                operator: '+',
            },
        })
        setResetMeasureStatus(false)
    }

    const getExpandIcon = (panelProps) => {
        return panelProps.isActive ? (
            <CaretDownOutlined className={styles.arrowIcon} />
        ) : (
            <CaretRightOutlined className={styles.arrowIcon} />
        )
    }

    const getAddDisabled = (measure) => {
        // 度量中存在已有指标时 不能新增限定与分组
        if (measure.member.find((item) => item.type === 'indicator'))
            return true
        // 模型中业务表字段是否配置完整
        const isComplete = measure.member
            .filter((item) => item.type === 'field')
            .every((item) => item.object.aggregate && item.object.field_id?.[0])
        return !isComplete
    }

    const setDeleteDisabled = (measure) => {
        if (measure.member.length) {
            setResetMeasureStatus(true)
        } else {
            setResetMeasureStatus(false)
        }
    }

    return (
        <div className={styles.ConfigDetails}>
            <div className={styles.content}>
                <Form
                    form={form}
                    onFinish={onFinish}
                    initialValues={formData}
                    name="validateOnly"
                    layout="vertical"
                    autoComplete="off"
                    onValuesChange={onValuesChange}
                >
                    <Collapse
                        defaultActiveKey={['1', '2']}
                        bordered={false}
                        ghost
                        onChange={(key) => {
                            if (key.includes('3') && !viewIndicatorStatus) {
                                setViewIndicatorStatus(true)
                                changeColKey(key)
                            } else if (!key.includes('3')) {
                                setViewIndicatorStatus(false)
                            }
                        }}
                        expandIcon={getExpandIcon}
                    >
                        <Panel header="基本信息" key="1">
                            <Form.Item
                                label={__('业务指标名称')}
                                required
                                name="name"
                                validateFirst
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        required: true,
                                        validator:
                                            validateEmpty('输入不能为空'),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入业务指标名称')}
                                    autoComplete="off"
                                    maxLength={128}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('描述')}
                                name="desc"
                                validateFirst
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        validateTrigger: ['onBlur'],
                                        validator: (e, value) =>
                                            checkNormalInput(e, value),
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder={__('请输入描述')}
                                    style={{
                                        height: `100px`,
                                        resize: 'none',
                                    }}
                                    autoComplete="off"
                                    maxLength={255}
                                    autoSize={false}
                                />
                            </Form.Item>
                        </Panel>
                        <Panel header="指标规则" key="2">
                            <div className={styles.title}>
                                <span> {__('度量')}</span>
                                <Button
                                    disabled={!resetMeasureStatus}
                                    onClick={() => resetMeasure()}
                                    icon={<DeleteOutLined />}
                                    type="text"
                                />
                            </div>
                            <Form.Item name="measure" noStyle>
                                <div className={styles.measureWrap}>
                                    <Form.Item noStyle>
                                        {formData?.measure?.member?.length ===
                                            2 && (
                                            <div className={styles.operator}>
                                                <Form.Item
                                                    name={[
                                                        'measure',
                                                        'operator',
                                                    ]}
                                                    noStyle
                                                >
                                                    <Select
                                                        bordered={false}
                                                        showArrow
                                                        className={
                                                            styles.operation
                                                        }
                                                        options={measureItems}
                                                        suffixIcon={
                                                            <CaretDownOutlined />
                                                        }
                                                        dropdownMatchSelectWidth={
                                                            50
                                                        }
                                                    />
                                                </Form.Item>
                                            </div>
                                        )}
                                    </Form.Item>
                                    <Form.List name={['measure', 'member']}>
                                        {(fields, { add }) => (
                                            <div
                                                className={styles.measureRight}
                                            >
                                                {fields.map(
                                                    (measureField, index) => (
                                                        <div
                                                            key={
                                                                measureField.key
                                                            }
                                                            className={
                                                                styles.measureItem
                                                            }
                                                        >
                                                            <Form.Item
                                                                style={{
                                                                    width: '24%',
                                                                    marginRight:
                                                                        '16px',
                                                                }}
                                                                name={[
                                                                    measureField.name,
                                                                    'type',
                                                                ]}
                                                                required
                                                                validateFirst
                                                                validateTrigger={[
                                                                    'onChange',
                                                                    'onBlur',
                                                                ]}
                                                                rules={[
                                                                    {
                                                                        required:
                                                                            true,
                                                                        message:
                                                                            '请选择度量类型',
                                                                    },
                                                                ]}
                                                            >
                                                                <Select
                                                                    getPopupContainer={(
                                                                        node,
                                                                    ) =>
                                                                        node.parentNode
                                                                    }
                                                                    placeholder="度量类型"
                                                                    options={[
                                                                        {
                                                                            value: 'field',
                                                                            label: '模型中业务表字段',
                                                                        },
                                                                        {
                                                                            value: 'indicator',
                                                                            label: '模型中已有指标',
                                                                        },
                                                                    ]}
                                                                />
                                                            </Form.Item>
                                                            {rendermeasureType(
                                                                form,
                                                                index,
                                                            ) ? (
                                                                <Space.Compact
                                                                    block
                                                                    style={{
                                                                        width: '76%',
                                                                        marginRight:
                                                                            '10px',
                                                                    }}
                                                                >
                                                                    <Form.Item
                                                                        style={{
                                                                            width: '70%',
                                                                        }}
                                                                        name={[
                                                                            measureField.name,
                                                                            'object',
                                                                            'field_id',
                                                                        ]}
                                                                        rules={[
                                                                            {
                                                                                required:
                                                                                    true,
                                                                                validator:
                                                                                    validateCascader(),
                                                                            },
                                                                        ]}
                                                                    >
                                                                        <Cascader
                                                                            options={
                                                                                cascaderOption
                                                                            }
                                                                            getPopupContainer={(
                                                                                node,
                                                                            ) =>
                                                                                node.parentNode
                                                                            }
                                                                            displayRender={
                                                                                displayRender
                                                                            }
                                                                            notFoundContent="暂无数据"
                                                                            className={
                                                                                styles.cascaderWrapper
                                                                            }
                                                                            placeholder={__(
                                                                                '请选择字段名称',
                                                                            )}
                                                                            allowClear={
                                                                                false
                                                                            }
                                                                        />
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        shouldUpdate={(
                                                                            prevValues,
                                                                            curValues,
                                                                        ) => {
                                                                            if (
                                                                                prevValues
                                                                                    .measure
                                                                                    ?.member[
                                                                                    index
                                                                                ]
                                                                                    ?.object
                                                                                    ?.field_id
                                                                                    ?.length &&
                                                                                curValues
                                                                                    .measure
                                                                                    ?.member[
                                                                                    index
                                                                                ]
                                                                                    ?.object
                                                                                    ?.field_id
                                                                                    ?.length
                                                                            ) {
                                                                                if (
                                                                                    prevValues
                                                                                        .measure
                                                                                        .member[
                                                                                        index
                                                                                    ]
                                                                                        .object
                                                                                        .field_id?.[0] ===
                                                                                    ''
                                                                                ) {
                                                                                    return false
                                                                                }
                                                                                const newDataFields =
                                                                                    curValues.measure.member[
                                                                                        index
                                                                                    ].object.field_id?.filter(
                                                                                        (
                                                                                            currentField,
                                                                                        ) =>
                                                                                            prevValues.measure.member[
                                                                                                index
                                                                                            ].object.field_id?.includes(
                                                                                                currentField,
                                                                                            ),
                                                                                    )
                                                                                if (
                                                                                    newDataFields.length ===
                                                                                    2
                                                                                ) {
                                                                                    return false
                                                                                }
                                                                                form.setFieldValue(
                                                                                    [
                                                                                        'measure',
                                                                                        'member',
                                                                                        index,
                                                                                        'object',
                                                                                        'aggregate',
                                                                                    ],
                                                                                    undefined,
                                                                                )
                                                                                return true
                                                                            }
                                                                            return false
                                                                        }}
                                                                        noStyle
                                                                    >
                                                                        {() => {
                                                                            return (
                                                                                <Form.Item
                                                                                    style={{
                                                                                        width: '30%',
                                                                                    }}
                                                                                    name={[
                                                                                        measureField.name,
                                                                                        'object',
                                                                                        'aggregate',
                                                                                    ]}
                                                                                    rules={[
                                                                                        {
                                                                                            required:
                                                                                                true,
                                                                                            message:
                                                                                                '请选择',
                                                                                        },
                                                                                    ]}
                                                                                >
                                                                                    <Select
                                                                                        getPopupContainer={(
                                                                                            node,
                                                                                        ) =>
                                                                                            node.parentNode
                                                                                        }
                                                                                        placeholder="聚合方式"
                                                                                        options={renderMeasureOptions(
                                                                                            form,
                                                                                            index,
                                                                                        )}
                                                                                        notFoundContent="暂无数据"
                                                                                    />
                                                                                </Form.Item>
                                                                            )
                                                                        }}
                                                                    </Form.Item>
                                                                </Space.Compact>
                                                            ) : (
                                                                <Form.Item
                                                                    style={{
                                                                        width: '76%',
                                                                        marginRight:
                                                                            '10px',
                                                                    }}
                                                                    name={[
                                                                        measureField.name,
                                                                        'object',
                                                                        'parent_indicator',
                                                                    ]}
                                                                    validateTrigger={[
                                                                        'onChange',
                                                                    ]}
                                                                    rules={[
                                                                        {
                                                                            required:
                                                                                true,
                                                                            message:
                                                                                '请选择指标',
                                                                        },
                                                                    ]}
                                                                >
                                                                    <Select
                                                                        getPopupContainer={(
                                                                            node,
                                                                        ) =>
                                                                            node.parentNode
                                                                        }
                                                                        placeholder="请选择"
                                                                        optionLabelProp="label"
                                                                        notFoundContent="暂无数据"
                                                                    >
                                                                        {indicatorList?.map(
                                                                            (
                                                                                item,
                                                                            ) => (
                                                                                <Select.Option
                                                                                    key={
                                                                                        item.indicator_id
                                                                                    }
                                                                                    value={
                                                                                        item.indicator_id
                                                                                    }
                                                                                    label={
                                                                                        item.name
                                                                                    }
                                                                                    getPopupContainer={(
                                                                                        node,
                                                                                    ) =>
                                                                                        node.parentNode
                                                                                    }
                                                                                >
                                                                                    <IndicatorSelect
                                                                                        indicatorList={
                                                                                            item
                                                                                        }
                                                                                    />
                                                                                </Select.Option>
                                                                            ),
                                                                        )}
                                                                    </Select>
                                                                </Form.Item>
                                                            )}
                                                            <DeleteOutLined
                                                                style={{
                                                                    margin: '8px 12px 0 0 ',
                                                                    color: resetMeasureStatus
                                                                        ? 'inherit'
                                                                        : 'rgba(0, 0, 0, 0.3)',
                                                                }}
                                                                onClick={() => {
                                                                    if (
                                                                        fields.length ===
                                                                        1
                                                                    ) {
                                                                        resetMeasure()
                                                                    } else {
                                                                        removeMeasure(
                                                                            measureField.key,
                                                                        )
                                                                    }
                                                                }}
                                                            />
                                                            {fields.length <
                                                                2 && (
                                                                <AddOutlined
                                                                    style={{
                                                                        margin: '8px 4px 0 0 ',
                                                                    }}
                                                                    onClick={() => {
                                                                        const newItem =
                                                                            {
                                                                                type: 'field',
                                                                                object: {
                                                                                    field_id:
                                                                                        undefined,
                                                                                    aggregate:
                                                                                        undefined,
                                                                                    parent_indicator:
                                                                                        undefined,
                                                                                },
                                                                            }
                                                                        add(
                                                                            newItem,
                                                                        )
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </Form.List>
                                </div>
                            </Form.Item>

                            <div className={styles.title}>
                                <span>{__('过滤')} </span>
                                {formData.where?.length > 0 && (
                                    <DeleteOutLined
                                        onClick={() => resetLimit()}
                                        style={{ cursor: 'pointer' }}
                                    />
                                )}
                            </div>

                            <Form.List name="where">
                                {(fields, { add }) => (
                                    <>
                                        <div className={styles.limitWrap}>
                                            {fields.length > 1 && (
                                                <div
                                                    className={styles.operator}
                                                >
                                                    <Tag
                                                        className={classnames(
                                                            styles.operation,
                                                            styles.operationAnd,
                                                        )}
                                                    >
                                                        {__('且')}
                                                    </Tag>
                                                </div>
                                            )}
                                            <div className={styles.limitRight}>
                                                {fields?.map(
                                                    (outField, outIndex) => (
                                                        <div
                                                            className={
                                                                styles.limitItem
                                                            }
                                                            key={outField.key}
                                                        >
                                                            {formData?.where[
                                                                outIndex
                                                            ]?.member.length ===
                                                                2 && (
                                                                <div
                                                                    className={
                                                                        styles.operator
                                                                    }
                                                                >
                                                                    <Form.Item
                                                                        name={[
                                                                            outField.name,
                                                                            'relation',
                                                                        ]}
                                                                        noStyle
                                                                    >
                                                                        <Select
                                                                            getPopupContainer={(
                                                                                node,
                                                                            ) =>
                                                                                node.parentNode
                                                                            }
                                                                            bordered={
                                                                                false
                                                                            }
                                                                            showArrow
                                                                            className={
                                                                                styles.operation
                                                                            }
                                                                            options={[
                                                                                {
                                                                                    value: 'and',
                                                                                    label: '且',
                                                                                },
                                                                                {
                                                                                    value: 'or',
                                                                                    label: '或',
                                                                                },
                                                                            ]}
                                                                            suffixIcon={
                                                                                <CaretDownOutlined />
                                                                            }
                                                                            dropdownMatchSelectWidth={
                                                                                50
                                                                            }
                                                                        />
                                                                    </Form.Item>
                                                                </div>
                                                            )}

                                                            <Form.List
                                                                name={[
                                                                    outField.name,
                                                                    'member',
                                                                ]}
                                                            >
                                                                {(
                                                                    subfields,
                                                                    {
                                                                        add: addInside,
                                                                    },
                                                                ) => (
                                                                    <div
                                                                        className={
                                                                            styles.innerWrap
                                                                        }
                                                                    >
                                                                        {subfields.map(
                                                                            (
                                                                                innerField,
                                                                                innerIndex,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        innerField.key
                                                                                    }
                                                                                    className={
                                                                                        styles.innerList
                                                                                    }
                                                                                >
                                                                                    <Form.Item
                                                                                        name={[
                                                                                            innerField.name,
                                                                                            'field_id',
                                                                                        ]}
                                                                                        rules={[
                                                                                            {
                                                                                                required:
                                                                                                    true,
                                                                                                validator:
                                                                                                    validateCascader(),
                                                                                            },
                                                                                        ]}
                                                                                        style={{
                                                                                            width: '20%',
                                                                                            marginRight:
                                                                                                '10px',
                                                                                            minWidth:
                                                                                                '150px',
                                                                                        }}
                                                                                    >
                                                                                        <Cascader
                                                                                            options={
                                                                                                limitAndGroupOptions
                                                                                            }
                                                                                            getPopupContainer={(
                                                                                                node,
                                                                                            ) =>
                                                                                                node.parentNode
                                                                                            }
                                                                                            displayRender={
                                                                                                displayRender
                                                                                            }
                                                                                            notFoundContent="暂无数据"
                                                                                            allowClear={
                                                                                                false
                                                                                            }
                                                                                            placeholder={__(
                                                                                                '请选择字段名称',
                                                                                            )}
                                                                                            className={
                                                                                                styles.cascaderWrapper
                                                                                            }
                                                                                        />
                                                                                    </Form.Item>
                                                                                    <Form.Item
                                                                                        name={[
                                                                                            innerField.name,
                                                                                            'operator',
                                                                                        ]}
                                                                                        style={{
                                                                                            width: '25%',
                                                                                            marginRight:
                                                                                                '16px',
                                                                                        }}
                                                                                        rules={[
                                                                                            {
                                                                                                required:
                                                                                                    true,
                                                                                                message:
                                                                                                    '请选择',
                                                                                            },
                                                                                        ]}
                                                                                    >
                                                                                        <Select
                                                                                            onChange={(
                                                                                                value,
                                                                                            ) =>
                                                                                                changeTableOptions(
                                                                                                    value,
                                                                                                    outIndex,
                                                                                                    innerIndex,
                                                                                                )
                                                                                            }
                                                                                            getPopupContainer={(
                                                                                                node,
                                                                                            ) =>
                                                                                                node.parentNode
                                                                                            }
                                                                                            options={renderLimitOptions(
                                                                                                form,
                                                                                                outIndex,
                                                                                                innerIndex,
                                                                                            )}
                                                                                            notFoundContent="暂无数据"
                                                                                            placeholder="请选择"
                                                                                        />
                                                                                    </Form.Item>
                                                                                    {renderLimitNode(
                                                                                        outIndex,
                                                                                        innerIndex,
                                                                                        form,
                                                                                        innerField,
                                                                                        'value',
                                                                                    )}
                                                                                    <DeleteOutLined
                                                                                        style={{
                                                                                            margin: '8px 4px 0 0',
                                                                                        }}
                                                                                        onClick={() =>
                                                                                            removeWhere(
                                                                                                outIndex,
                                                                                                innerIndex,
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    {subfields.length <
                                                                                        2 && (
                                                                                        <Form.Item
                                                                                            shouldUpdate={(
                                                                                                pre,
                                                                                                cur,
                                                                                            ) =>
                                                                                                pre
                                                                                                    .where[
                                                                                                    outIndex
                                                                                                ]
                                                                                                    ?.member !==
                                                                                                cur
                                                                                                    .where[
                                                                                                    outIndex
                                                                                                ]
                                                                                                    ?.member
                                                                                            }
                                                                                            noStyle
                                                                                        >
                                                                                            {({
                                                                                                getFieldValue,
                                                                                            }) => {
                                                                                                const whereItemData =
                                                                                                    getFieldValue(
                                                                                                        [
                                                                                                            'where',
                                                                                                            outIndex,
                                                                                                            'member',
                                                                                                            innerIndex,
                                                                                                        ],
                                                                                                    )
                                                                                                const disabledStatus =
                                                                                                    !(
                                                                                                        whereItemData.field_id &&
                                                                                                        whereItemData.operator &&
                                                                                                        whereItemData.value
                                                                                                    )
                                                                                                return (
                                                                                                    <AddOutlined
                                                                                                        style={{
                                                                                                            margin: '8px 4px 0 0',
                                                                                                            color: !disabledStatus
                                                                                                                ? 'inherit'
                                                                                                                : 'rgba(0, 0, 0, 0.3)',
                                                                                                            cursor: !disabledStatus
                                                                                                                ? 'pointer'
                                                                                                                : 'not-allowed',
                                                                                                        }}
                                                                                                        onClick={() => {
                                                                                                            if (
                                                                                                                !disabledStatus
                                                                                                            ) {
                                                                                                                const newItem =
                                                                                                                    {
                                                                                                                        field_id:
                                                                                                                            undefined,
                                                                                                                        operator:
                                                                                                                            undefined,
                                                                                                                        value: undefined,
                                                                                                                    }
                                                                                                                addInside(
                                                                                                                    newItem,
                                                                                                                )
                                                                                                            }
                                                                                                        }}
                                                                                                    />
                                                                                                )
                                                                                            }}
                                                                                        </Form.Item>
                                                                                    )}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Form.List>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className={styles.addLimit}
                                            // 最多三组限定
                                            hidden={fields.length === 3}
                                        >
                                            <Form.Item
                                                noStyle
                                                shouldUpdate={(pre, cur) =>
                                                    pre.measure !== cur.measure
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const isAddLimitDisabled =
                                                        getAddDisabled(
                                                            getFieldValue(
                                                                'measure',
                                                            ),
                                                        )

                                                    return (
                                                        <Button
                                                            type="link"
                                                            size="middle"
                                                            disabled={
                                                                isAddLimitDisabled
                                                            }
                                                            onClick={() => {
                                                                const newItem =
                                                                    {
                                                                        member: [
                                                                            {
                                                                                field_id:
                                                                                    undefined,
                                                                                operator:
                                                                                    undefined,
                                                                                value: undefined,
                                                                                dateNumber:
                                                                                    undefined,
                                                                                unit: undefined,
                                                                            },
                                                                        ],
                                                                        relation:
                                                                            'and',
                                                                    }
                                                                add(newItem)
                                                            }}
                                                            icon={
                                                                <AddOutlined />
                                                            }
                                                        >
                                                            {__('新增过滤')}
                                                        </Button>
                                                    )
                                                }}
                                            </Form.Item>
                                        </div>
                                    </>
                                )}
                            </Form.List>
                            <div className={styles.title}>
                                <span> {__('分组')}</span>
                                {formData.group?.length > 0 && (
                                    <DeleteOutLined
                                        onClick={() => resetGroup()}
                                        style={{ cursor: 'pointer' }}
                                    />
                                )}
                            </div>
                            <Form.List name="group">
                                {(groupFields, { add, remove }) => (
                                    <>
                                        <div
                                            className={styles.groupWrap}
                                            hidden={groupFields.length === 0}
                                        >
                                            {groupFields.map(
                                                (groupField, index) => (
                                                    <div
                                                        key={groupField.key}
                                                        className={
                                                            styles.groupItem
                                                        }
                                                    >
                                                        <Form.Item
                                                            noStyle
                                                            shouldUpdate={(
                                                                pre,
                                                                cur,
                                                            ) =>
                                                                pre.group[index]
                                                                    ?.field_id !==
                                                                cur.group[index]
                                                                    ?.field_id
                                                            }
                                                        >
                                                            {({
                                                                getFieldValue,
                                                            }) => {
                                                                const isTimeType =
                                                                    renderGroupBoolean(
                                                                        getFieldValue(
                                                                            'group',
                                                                        )[index]
                                                                            ?.field_id?.[1],
                                                                    )

                                                                return isTimeType ? (
                                                                    <>
                                                                        <Form.Item
                                                                            style={{
                                                                                width: 250,
                                                                            }}
                                                                            name={[
                                                                                groupField.name,
                                                                                'field_id',
                                                                            ]}
                                                                            rules={[
                                                                                {
                                                                                    required:
                                                                                        true,
                                                                                    validator:
                                                                                        validateGroupCascader(
                                                                                            form,
                                                                                            index,
                                                                                        ),
                                                                                },
                                                                            ]}
                                                                            className={
                                                                                styles.selectLeftComboBox
                                                                            }
                                                                        >
                                                                            <Cascader
                                                                                getPopupContainer={(
                                                                                    node,
                                                                                ) =>
                                                                                    node.parentNode
                                                                                }
                                                                                options={
                                                                                    limitAndGroupOptions
                                                                                }
                                                                                displayRender={
                                                                                    displayRender
                                                                                }
                                                                                placeholder={__(
                                                                                    '请选择字段名称',
                                                                                )}
                                                                                notFoundContent="暂无数据"
                                                                                allowClear={
                                                                                    false
                                                                                }
                                                                                className={
                                                                                    styles.cascaderWrapper
                                                                                }
                                                                            />
                                                                        </Form.Item>
                                                                        <Form.Item
                                                                            style={{
                                                                                width: 100,
                                                                            }}
                                                                            name={[
                                                                                groupField.name,
                                                                                'format',
                                                                            ]}
                                                                            rules={[
                                                                                {
                                                                                    required:
                                                                                        true,
                                                                                    message:
                                                                                        '请选择',
                                                                                },
                                                                            ]}
                                                                            className={
                                                                                styles.selectRightComboBox
                                                                            }
                                                                        >
                                                                            <Select
                                                                                getPopupContainer={(
                                                                                    node,
                                                                                ) =>
                                                                                    node.parentNode
                                                                                }
                                                                                placeholder="请选择"
                                                                                options={
                                                                                    groupOptions
                                                                                }
                                                                            />
                                                                        </Form.Item>
                                                                    </>
                                                                ) : (
                                                                    <Form.Item
                                                                        style={{
                                                                            width: 350,
                                                                        }}
                                                                        name={[
                                                                            groupField.name,
                                                                            'field_id',
                                                                        ]}
                                                                        rules={[
                                                                            {
                                                                                required:
                                                                                    true,
                                                                                validator:
                                                                                    validateGroupCascader(
                                                                                        form,
                                                                                        index,
                                                                                    ),
                                                                            },
                                                                        ]}
                                                                    >
                                                                        <Cascader
                                                                            getPopupContainer={(
                                                                                node,
                                                                            ) =>
                                                                                node.parentNode
                                                                            }
                                                                            options={
                                                                                limitAndGroupOptions
                                                                            }
                                                                            displayRender={
                                                                                displayRender
                                                                            }
                                                                            placeholder={__(
                                                                                '请选择字段名称',
                                                                            )}
                                                                            notFoundContent="暂无数据"
                                                                            allowClear={
                                                                                false
                                                                            }
                                                                            className={
                                                                                styles.cascaderWrapper
                                                                            }
                                                                        />
                                                                    </Form.Item>
                                                                )
                                                            }}
                                                        </Form.Item>

                                                        <DeleteOutLined
                                                            style={{
                                                                margin: '8px 4px 0 10px ',
                                                            }}
                                                            onClick={() => {
                                                                if (
                                                                    form.getFieldsValue()
                                                                        .group
                                                                        ?.length ===
                                                                    1
                                                                ) {
                                                                    resetGroup()
                                                                } else {
                                                                    remove(
                                                                        groupField.name,
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                        {groupFields.length <
                                                            2 && (
                                                            <AddOutlined
                                                                style={{
                                                                    margin: '8px 4px 0 0 ',
                                                                }}
                                                                onClick={() => {
                                                                    const newItem =
                                                                        {
                                                                            format: undefined,
                                                                            field_id:
                                                                                undefined,
                                                                        }
                                                                    add(newItem)
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <div
                                            className={styles.addGroupBtn}
                                            hidden={groupFields.length === 2}
                                        >
                                            <Form.Item
                                                noStyle
                                                shouldUpdate={(pre, cur) =>
                                                    pre.measure !== cur.measure
                                                }
                                            >
                                                {({ getFieldValue }) => {
                                                    const isAddDisabled =
                                                        getAddDisabled(
                                                            getFieldValue(
                                                                'measure',
                                                            ),
                                                        )
                                                    return (
                                                        <Button
                                                            type="link"
                                                            size="middle"
                                                            disabled={
                                                                isAddDisabled
                                                            }
                                                            onClick={() => {
                                                                const newItem =
                                                                    {
                                                                        field_id:
                                                                            undefined,
                                                                        format: undefined,
                                                                    }
                                                                add(newItem)
                                                            }}
                                                            icon={
                                                                <AddOutlined />
                                                            }
                                                        >
                                                            {__('新增分组')}
                                                        </Button>
                                                    )
                                                }}
                                            </Form.Item>
                                        </div>
                                    </>
                                )}
                            </Form.List>
                        </Panel>

                        <Panel
                            header={
                                <div className={styles.dataPreviewTitle}>
                                    <div className={styles.titleBar}>
                                        <div>{__('数据预览')}</div>
                                        <Tooltip
                                            placement="bottom"
                                            title={__('刷新')}
                                        >
                                            <div
                                                className={classnames(
                                                    styles.titleBtn,
                                                    loading && styles.revolve,
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    changeColKey(['3'])
                                                    setLoading(true)
                                                }}
                                            >
                                                <RefreshOutlined />
                                            </div>
                                        </Tooltip>
                                    </div>
                                    <div>
                                        <span
                                            className={styles.dataPreviewTips}
                                        >
                                            {__('（仅展示部分数据）')}
                                        </span>
                                    </div>
                                </div>
                            }
                            key="3"
                        >
                            {viewData.length > 0 || loading ? (
                                <Table
                                    loading={loading}
                                    columns={viewColumns}
                                    dataSource={viewData}
                                    pagination={false}
                                />
                            ) : (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={
                                        resetMeasureStatus ? (
                                            viewIndicatorErrorStatus ===
                                            'BusinessGrooming.Indicator.FormNotProcess' ? (
                                                <div
                                                    className={styles.emptyDesc}
                                                >
                                                    <div>
                                                        指标规则中存在字段所属业务表未加工
                                                    </div>
                                                    <div>无法进行数据预览</div>
                                                </div>
                                            ) : (
                                                __('暂无数据')
                                            )
                                        ) : (
                                            __('暂无数据，请先配置指标规则')
                                        )
                                    }
                                />
                            )}
                        </Panel>
                    </Collapse>
                </Form>
            </div>
        </div>
    )
})

export default Details
