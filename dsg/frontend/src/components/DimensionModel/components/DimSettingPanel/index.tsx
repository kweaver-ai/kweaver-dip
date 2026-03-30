import { DownOutlined, InfoCircleFilled } from '@ant-design/icons'
import { Button } from 'antd'
import { memo, useCallback, useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import classnames from 'classnames'
import { useSearchParams } from 'react-router-dom'
import { useGraphContext } from '@/context'
import { transferConf, useCatalogColumn } from '../../helper'
import __ from '../../locale'
import { OptDimType, useDimConfContext } from './DimConfProvider'
import DimensionFileds from './DimensionFileds'
import FieldDragableList from './FieldDragableList'
import styles from './styles.module.less'
import { NodeType } from '../Nodes'
import { changeFormatToType } from '@/components/IndicatorManage/const'

export type IFieldMeta = any
type IDimSettingPanel = any

export const DragDropType = 'FactFieldBindDimension'

export enum OptType {
    CREATE,
    REMOVE,
}

/**
 * 校验事实表
 */
const validateFact = (item) => ({ success: !!item.id && !!item.cnName })

/**
 * 校验维度表
 */
const validateDimension = (items: any[]) => {
    const errors = (items || [])?.filter(
        (item) =>
            !item.id ||
            !item.cnName ||
            !item.dimFieldId ||
            !item.dimFieldCNName,
    )
    return {
        success: errors?.length === 0,
        errors,
    }
}
/**
 * 校验类型
 */
const validateFieldType = (conf?: any[]) => {
    return (conf || [])?.some(
        (o) =>
            changeFormatToType(o.dimFieldType) !==
            changeFormatToType(o.factFieldType),
    )
}

/**
 * 维度模型配置
 * @returns
 */
function DimSettingPanel(props: IDimSettingPanel) {
    const {
        expand,
        config,
        setMeta,
        setConfig,
        setExpand,
        setIsPanelChanged,
        checkAndUpdateFields,
        setErrorTypeFields,
        hasErrorSure,
        setHasErrorSure,
    } = useGraphContext()
    const {
        factConf,
        dimConf,
        setDimConf,
        setFactConf,
        setFieldArr,
        optDimConf,
        setError,
        isDimChanged,
        setLastDimConfig,
    } = useDimConfContext()
    const [factFields, setFactFields] = useState<IFieldMeta[]>()
    const [searchParams] = useSearchParams()
    const { loading, getColumnsById } = useCatalogColumn()
    const isCreate = searchParams.get('item')
    // 创建模式下 第一次确认
    const [firstSure, setFirstSure] = useState<boolean>(true)

    const getFields = async (tableId: string) => {
        const result = await getColumnsById(tableId)
        const columns = result.data

        setFactFields(columns)
        setFieldArr(columns)
        checkAndUpdateFields(tableId, NodeType.Fact, columns)
    }

    useEffect(() => {
        setIsPanelChanged(isDimChanged)
    }, [isDimChanged])

    const initPanel = (conf: any) => {
        if (conf) {
            const { dim_field_config, ...factTable } = conf
            const factConfig = {
                cnName: factTable.fact_table_cn_name,
                enName: factTable.fact_table_en_name,
                path: factTable.fact_table_full_path,
                id: factTable.fact_table_id,
            }
            setFactConf(factConfig)

            const dimConfigs = (dim_field_config || [])?.map((it) => ({
                cnName: it.dim_table_cn_name,
                enName: it.dim_table_en_name,
                path: it.dim_table_full_path,
                id: it.dim_table_id,
                dimFieldCNName: it.dim_table_join_field_cn_name,
                dimFieldENName: it.dim_table_join_field_en_name,
                dimFieldId: it.dim_table_join_field_id,
                dimFieldType: it.dim_table_join_field_data_format,
                factFieldCNName: it.fact_table_join_field_cn_name,
                factFieldENName: it.fact_table_join_field_en_name,
                factFieldId: it.fact_table_join_field_id,
                factFieldType: it.fact_table_join_field_data_format,
            }))

            setDimConf(dimConfigs)
            setLastDimConfig({
                factConf: factConfig,
                dimConf: dimConfigs,
            })
        } else {
            setFactConf(undefined)
            setDimConf(undefined)
            setLastDimConfig({
                factConf: undefined,
                dimConf: undefined,
            })
        }
    }

    useEffect(() => {
        initPanel(config)
    }, [config])

    useEffect(() => {
        if (!factConf) {
            setFactFields([])
        } else if (expand) {
            getFields(factConf?.id)
        }
    }, [factConf, expand])

    const handleOptBind = useCallback(
        (optType: OptDimType, item: any, id?: string) => {
            optDimConf(optType, item, id)
        },
        [optDimConf],
    )

    const closePanel = () => {
        setExpand(false)
        if (hasErrorSure && !dimConf?.length) {
            setHasErrorSure(false)
        }
    }

    const handleCancel = () => {
        closePanel()
        initPanel(config)
        setError({})
    }

    const handleValidateToSure = () => {
        const validateFactResult = validateFact(factConf)
        const validateDimResult = validateDimension(dimConf || [])
        if (
            validateFactResult.success &&
            validateDimResult.success &&
            !validateFieldType(dimConf)
        ) {
            // 更新数据
            setConfig(transferConf(factConf, dimConf))

            setLastDimConfig({
                factConf,
                dimConf,
            })
            // 重置错误
            setErrorTypeFields([])
            setHasErrorSure(false)
            // 重置选中
            setMeta([])
            closePanel()
            if (firstSure) {
                setFirstSure(false)
            }
        } else {
            if (hasErrorSure) {
                setExpand(true)
            }
            setHasErrorSure(true)
            // 提示错误
            setError({
                fact: validateFactResult,
                dimension: validateDimResult,
            })
        }
    }

    const handlePanelToggle = () => {
        if (expand) {
            closePanel()
        } else {
            setExpand(true)
        }
    }

    return (
        <div className={styles['setting-panel']}>
            <div className={styles['setting-panel-header']}>
                <div className={styles['setting-panel-header-left']}>
                    <span className={styles['setting-panel-header-left-title']}>
                        {__('配置维度模型')}
                    </span>
                    <span className={styles['setting-panel-header-left-tip']}>
                        <InfoCircleFilled />
                        <span className={styles.text}>
                            {__(
                                '您可直接拖拽事实表字段、或批量勾选后拖拽至右侧作为维度字段',
                            )}
                        </span>
                    </span>
                </div>
                <div className={styles['setting-panel-header-right']}>
                    <span
                        className={classnames({
                            [styles['setting-panel-header-right-expand']]: true,
                            [styles['is-panel-expand']]: expand,
                        })}
                        onClick={() => handlePanelToggle()}
                    >
                        <DownOutlined />
                    </span>
                    <div className={styles['setting-panel-header-right-btns']}>
                        <Button
                            type="default"
                            onClick={(e) => handleCancel()}
                            disabled={
                                !(
                                    isDimChanged ||
                                    (expand && isCreate && firstSure)
                                )
                            }
                        >
                            {__('取消')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => handleValidateToSure()}
                            disabled={
                                !(
                                    isDimChanged ||
                                    (expand && isCreate && firstSure)
                                )
                            }
                        >
                            {__('确定')}
                        </Button>
                    </div>
                </div>
            </div>
            <DndProvider backend={HTML5Backend}>
                <div className={styles['setting-panel-content']}>
                    <div className={styles['setting-panel-content-left']}>
                        <FieldDragableList
                            data={factFields || []}
                            bindItems={dimConf}
                            handleBind={handleOptBind}
                        />
                    </div>
                    <div className={styles['setting-panel-content-right']}>
                        <DimensionFileds
                            bindItems={dimConf}
                            handleBind={handleOptBind}
                        />
                    </div>
                </div>
            </DndProvider>
        </div>
    )
}

export default memo(DimSettingPanel)
