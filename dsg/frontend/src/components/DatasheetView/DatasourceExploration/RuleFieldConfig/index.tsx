import React, {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
    memo,
} from 'react'
import __ from '../locale'
import {
    getDatasheetViewDetails,
    formatError,
    dataTypeMapping,
    getVirtualEngineExample,
} from '@/core'
import { ruleExpressionWhereList } from '../const'
import { useDataViewContext } from '../../DataViewProvider'
import RowFilter from '@/components/RowAndColFilter/RowFilter'

interface IRuleFieldConfig {
    // 编辑规则信息
    value?: any
    onChange?: (val: any) => void
    formViewId?: string
    commonItemWidth?: any
    isTemplateCustom?: boolean
}

const RuleFieldConfig = forwardRef((props: IRuleFieldConfig, ref) => {
    const { value, onChange, isTemplateCustom, formViewId, commonItemWidth } =
        props
    const { explorationData, isTemplateConfig, setExplorationData } =
        useDataViewContext()
    const [fieldList, setFieldList] = useState<any[]>([])
    const [exampleData, setExampleData] = useState<any>({})
    const rowFilterRef = useRef<any>(null)
    const [relations, setRelations] = useState<any>()

    useImperativeHandle(ref, () => ({
        onFinish,
        getRowFilterData,
    }))

    useEffect(() => {
        if (explorationData?.dataViewId || formViewId) {
            const id = explorationData?.dataViewId || formViewId || ''
            getFormViewDetails(id)
        }
    }, [formViewId])

    useEffect(() => {
        if (value) {
            setRelations(value)
        }
    }, [value])

    const getFormViewDetails = async (id: string) => {
        try {
            const res = await getDatasheetViewDetails(id)

            const [catalog, schema] = res.view_source_catalog_name.split('.')
            const exampleRes = await getVirtualEngineExample({
                catalog,
                schema,
                table: res?.technical_name,
                limit: 10,
            })
            const exaData = {}
            const { columns, data } = exampleRes
            columns.forEach((item, index) => {
                exaData[item.name] = Array.from(
                    new Set(data.map((it) => it[index])),
                )
            })
            setExampleData(exaData)
            // 过滤已删除、二进制字段
            const list = res?.fields
                ?.filter(
                    (item) =>
                        item.status !== 'delete' &&
                        !dataTypeMapping.binary.includes(item.data_type),
                )
                ?.map((item) => {
                    return {
                        ...item,
                        checked: false,
                    }
                })
            setExplorationData((pre) => ({
                ...pre,
                fieldList: list,
            }))
            setFieldList(list)
        } catch (err) {
            formatError(err)
        }
    }

    const onFinish = async () => {
        let detail
        try {
            const rule_expression = await rowFilterRef.current?.onFinish()
            detail = { rule_expression }
        } catch (error) {
            if (!error?.errorFields) {
                formatError(error)
            }
        }
        const list: any[] = ruleExpressionWhereList(
            detail?.rule_expression?.where,
        )
        return !isTemplateConfig && list.some((o) => o?.id?.length !== 36)
            ? {}
            : detail
    }
    const getRowFilterData = async () => {
        let detail
        try {
            const data = await rowFilterRef?.current?.getSnapshot()
            // if (isEqual(data, relations)) return
            // onChange?.(data)
            detail = data
        } catch (err) {
            //
        }
        return detail
    }
    return (
        <RowFilter
            ref={rowFilterRef}
            initValues={relations}
            value={fieldList || []}
            addBtnText={__('新增一组过滤')}
            exampleData={exampleData}
            commonItemWidth={
                commonItemWidth || {
                    selectWidt: 140,
                    operatorWidth: 120,
                    // limitWidth: 140,
                }
            }
            isTemplateCustom={isTemplateCustom}
            isExplorationModal
        />
    )
})

export default memo(RuleFieldConfig)
