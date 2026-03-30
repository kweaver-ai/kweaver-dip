import { Form, Tabs, TabsProps } from 'antd'
import {
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
    useEffect,
} from 'react'
import { useSetState } from 'ahooks'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import FieldFilter from './FieldFilter'
import DataFilter from './DataFilter'
import __ from './locale'
import styles from './styles.module.less'
import {
    formatError,
    getDatasheetViewDetails,
    getVirtualEngineExample,
} from '@/core'

export enum Filter {
    FIELD = 'field',
    DATA = 'data',
}

export interface QueryProps {
    tabBarExtraContent?: TabsProps['tabBarExtraContent']
    showEmpty?: boolean
    resourceId?: string
    fieldConfig: any
    dataConfig: any
    fields: any[]
    onFieldChange?: (fields: any[]) => void
}

const QueryConfig = (props: QueryProps, ref) => {
    const {
        tabBarExtraContent,
        fieldConfig,
        dataConfig,
        showEmpty = false,
        fields,
        resourceId,
        onFieldChange: onFieldChangeFP,
    } = props
    const [activeKey, setActiveKey] = useState(Filter.FIELD)
    const [configValue, setConfigValue] = useSetState({
        fields: [] as any[],
        filters: '',
        dataValues: {} as any,
    })
    const dataFilterRef = useRef<{
        onFinish: { (): Promise<any> }
        onReset: () => void
    }>(null)
    const fieldFilterRef = useRef<{
        getFieldList: { (): any }
        onReset: () => void
    }>(null)
    const [exampleData, setExampleData] = useState<any>({})
    const [form] = Form.useForm()

    const DefaultEmpty = (
        <div className={styles.empty} style={{ flex: '1' }}>
            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        </div>
    )

    const onFieldChange = (value) => {
        setConfigValue({ fields: value })
        if (onFieldChangeFP) {
            onFieldChangeFP(value.filter((f) => f.isChecked))
        }
    }

    const onDataChange = (value) => {
        const formatData =
            value &&
            value.where &&
            value.where.length &&
            value.where.every((item) => item.member.length)
                ? JSON.stringify({
                      rule_expression: value,
                  })
                : ''
        setConfigValue({ filters: formatData, dataValues: value })
    }

    const getExampleData = async (id: string) => {
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
        } catch (error) {
            formatError(error)
        }
    }

    const filterOpts = [
        {
            label: __('字段过滤'),
            key: Filter.FIELD,
            forceRender: true,
            children: showEmpty ? (
                DefaultEmpty
            ) : (
                <FieldFilter
                    {...fieldConfig}
                    fields={fields}
                    onConfigChange={onFieldChange}
                    ref={fieldFilterRef}
                />
            ),
        },
        {
            label: __('数据过滤'),
            key: Filter.DATA,
            forceRender: true,
            children: showEmpty ? (
                DefaultEmpty
            ) : (
                <DataFilter
                    {...dataConfig}
                    fieldList={fields}
                    onConfigChange={onDataChange}
                    form={form}
                    exampleData={exampleData}
                    ref={dataFilterRef}
                />
            ),
        },
    ]

    const onConfigReset = () => {
        if (fieldFilterRef.current) {
            fieldFilterRef.current.onReset()
        }
        if (dataFilterRef.current) {
            dataFilterRef.current.onReset()
        }
    }

    const onConfigChange = async () => {
        try {
            // 如果数据过滤的条件都为空，允许查询
            // 每一个条件全部为空，允许查询
            // 每一个条件中存在部分值，不允许查询
            const { dataValues } = configValue
            if (
                !dataValues.where ||
                dataValues.where.every((item) => !item.member.length) ||
                dataValues.where.every(
                    (item) =>
                        item.member &&
                        item.member.every(
                            (mem) =>
                                (mem.id && mem.operator && mem.value) ||
                                !(mem.id || mem.operator || mem.value),
                        ),
                )
            ) {
                return configValue
            }
            await form.validateFields()
        } catch {
            return null
        }

        return configValue
    }

    useImperativeHandle(ref, () => {
        return {
            activeKey,
            onConfigChange,
            onConfigReset,
        }
    })

    useEffect(() => {
        if (resourceId) {
            getExampleData(resourceId)
        }
    }, [resourceId])

    return (
        <Tabs
            centered
            activeKey={activeKey}
            tabBarExtraContent={tabBarExtraContent}
            className={styles.queryConfigWrapper}
            items={filterOpts}
            onChange={(val: string) => {
                setActiveKey(val as Filter)
            }}
        />
    )
}

export default forwardRef(QueryConfig)
