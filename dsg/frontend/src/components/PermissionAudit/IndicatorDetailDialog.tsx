import React, { FC, useEffect, useMemo, useState } from 'react'
import { Drawer, Tabs } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import TabVisitor from './TabVisitor'
import { AssetTypeEnum, formatError, getIndicatorAuthRequest } from '@/core'
import { Loader } from '@/ui'
import {
    IndicatorDimensionTab,
    IndicatorTabActives,
    IndicatorTabs,
    IndicatorTypes,
} from './const'
import IndicatorDetailContent from '../IndicatorManage/IndicatorDetailContent'
import IndicatorIcons from '../IndicatorManage/IndicatorIcons'
import RowColView from '../RowAndColFilter/RowColView'

// 定义DetailIndicatorDialog组件的Props类型
interface DetailIndicatorDialogProps {
    id: string // 必填，唯一标识
    type: 'data_view' | 'sub_view' // 必填，类型限定为'data_view'或'sub_view'
    open: boolean // 必填，表示抽屉是否打开
    onCancel: () => void // 必填，取消事件处理函数
    showSampleData?: boolean // 可选，默认为false，表示是否显示示例数据
    indicatorType: string
}
const DetailIndicatorDialog: FC<DetailIndicatorDialogProps> = ({
    id,
    type,
    open,
    onCancel,
    showSampleData = false,
    indicatorType,
}) => {
    // 定义一个状态变量loading，用于指示加载状态
    const [loading, setLoading] = useState<boolean>(false)

    // 定义一个状态变量data，用于存储动态数据，初始值为空
    const [data, setData] = useState<any>()

    // 定义一个状态变量activeKey，用于管理标签页的激活状态，初始值为DETAILS
    const [activeKey, setActiveKey] = useState<IndicatorTabActives>(
        IndicatorTabActives.DETAILS,
    )
    /**
     * 取消事件处理函数
     *
     * 调用传入的取消回调函数，用于执行取消操作相关的逻辑
     *
     * @remarks
     * 该函数不接受任何参数，并且不返回任何值
     * 它的存在是为了提供一种标准化的方式来处理界面或其他场景中的取消操作
     *
     * @param {none} 无参数
     * @returns {void} 无返回值
     */
    const handleCancel = () => {
        onCancel()
    }

    const currentTabs = useMemo(() => {
        const curTabs = [...IndicatorTabs]
        curTabs.splice(1, 0, IndicatorDimensionTab)
        return data?.spec?.rule ? curTabs : IndicatorTabs
    }, [data])

    /**
     * Asynchronously fetches data when the component loads
     * This function is responsible for initiating the loading state, fetching data through the API, and updating the component state with the fetched data
     * If an error occurs during data fetching, it will be caught and processed
     */
    const onLoad = async () => {
        try {
            // Set the loading state to true, indicating that data fetching has started
            setLoading(true)
            // Call the API to fetch data, where `id` and `showSampleData` are used as parameters to customize the request
            const ret = await getIndicatorAuthRequest({
                id,
                reference: true,
                preview: showSampleData,
            })
            // Update component data with fetched data
            setData(ret)
        } catch (error) {
            // Process exceptions, such as network errors or server errors
            formatError(error)
        } finally {
            // Regardless of the success or failure of the request, set the loading state to false
            setLoading(false)
        }
    }

    useEffect(() => {
        onLoad()
    }, [id, showSampleData])

    // 使用useMemo钩子来优化性能，避免不必要的重新渲染
    const titleBox = useMemo(() => {
        // 构建一个标题框，包括图标和文本，用于显示权限申请的类型和详情
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: '8px',
                    fontSize: '16px',
                }}
            >
                <IndicatorIcons
                    type={indicatorType}
                    style={{ fontSize: '20px' }}
                />

                <div style={{ fontWeight: 'bold' }}>
                    {__('${type}权限申请详情', {
                        type: IndicatorTypes[indicatorType],
                    })}
                </div>
            </div>
        )
    }, [id, indicatorType])
    // 使用useMemo钩子来优化性能，只在相关依赖项改变时重新计算
    const contents = useMemo(() => {
        // 提取数据中的引用和访问者信息
        const reference = data?.references
        const visitors = data?.spec?.policies
        const rulesObj = reference?.filter(
            (o) => o?.indicator_dimensional_rule,
        )?.[0]
        let rules: any
        let ruleInfo: any
        let ruleFields: any = []
        if (rulesObj) {
            rules = rulesObj?.indicator_dimensional_rule?.spec
            ruleFields = (rules?.fields || []).map((o) => ({
                ...o,
                business_name: o?.name,
                technichal_name: o?.name_en,
            }))
            ruleInfo = {
                detail: JSON.stringify({
                    fields: ruleFields,
                    row_filters: rules?.row_filters,
                }),
                name: rules?.name,
            }
        }

        // 返回一个对象，根据不同的标签页活性显示不同的内容
        return {
            // 如果有详细信息，则显示详细内容组件，否则显示空白
            [IndicatorTabActives.DETAILS]: data?.spec?.id ? (
                <div className={styles.indicatorDetailContainer}>
                    <IndicatorDetailContent
                        indicatorId={data.spec.id}
                        indicatorType={indicatorType}
                        isMarket
                        allowJump={false}
                    />
                </div>
            ) : (
                ''
            ),
            [IndicatorTabActives.RULE]: rules ? (
                <div className={styles.indicatorRuleContainer}>
                    <RowColView
                        fields={ruleFields}
                        value={ruleInfo}
                        type={AssetTypeEnum.Dim}
                    />
                </div>
            ) : (
                ''
            ),
            // 显示访问者内容组件
            [IndicatorTabActives.VISITORS]: (
                <div className={styles.modalContent}>
                    <div>
                        <TabVisitor
                            data={visitors}
                            reference={reference}
                            type={AssetTypeEnum.Indicator}
                        />
                    </div>
                </div>
            ),
        }
    }, [type, data, showSampleData])

    return (
        <Drawer
            placement="right"
            open={open}
            width="80%"
            maskClosable
            title={
                <div className={styles['drawer-header']}>
                    <div className={styles['drawer-header-title']}>
                        {titleBox}
                    </div>
                    <div className={styles['drawer-header-tabs']}>
                        {!loading && (
                            <Tabs
                                defaultActiveKey={IndicatorTabActives.DETAILS}
                                onChange={(key) =>
                                    setActiveKey(key as IndicatorTabActives)
                                }
                                items={currentTabs}
                                centered
                            />
                        )}
                    </div>
                </div>
            }
            headerStyle={{ padding: '0 24px' }}
            onClose={handleCancel}
        >
            {loading ? (
                <div style={{ paddingTop: '20vh' }}>
                    <Loader />
                </div>
            ) : (
                contents[activeKey]
            )}
        </Drawer>
    )
}

export default DetailIndicatorDialog
