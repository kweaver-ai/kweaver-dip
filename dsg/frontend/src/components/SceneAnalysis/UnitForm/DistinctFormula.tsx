import React, { useEffect, useRef, useState } from 'react'
import { Spin } from 'antd'
import { IFormula, IFormulaFields, messageError } from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import { checkDeWeightFormulaConfig, checkSortAndRenameFields } from '../helper'
import { IFormulaConfigEl, dataEmptyView } from './helper'
import ConfigHeader from './ConfigHeader'
import FieldsDragTable from './FieldsDragTable'
import { FormulaError } from '../const'

/**
 * 去重算子配置
 */
const DistinctFormula = ({
    visible,
    graph,
    node,
    formulaData,
    fieldsData,
    viewSize,
    dragExpand,
    onChangeExpand,
    onClose,
}: IFormulaConfigEl) => {
    const tRef = useRef() as React.MutableRefObject<any>
    const [loading, setLoading] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 字段集合 undefined-前置提示
    const [fieldItems, setFieldItems] = useState<IFormulaFields[]>()

    useEffect(() => {
        if (visible && formulaData && node) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            const res = tRef.current?.getData()
            if (res.hasError) {
                return
            }
            const selectedFields = res.resultFields.filter(
                (info) => info.checked,
            )
            if (selectedFields.length === 0) {
                messageError(__('请至少选择一个字段作为下一个节点/算子的输入'))
            } else {
                const { formula } = node!.data
                // 更新节点内数据
                node!.replaceData({
                    ...node?.data,
                    formula: formula.map((info) => {
                        // 查找当前配置的算子
                        if (info.id === formulaItem?.id) {
                            const tempFl = info
                            delete tempFl.errorMsg
                            return {
                                ...tempFl,
                                config: {
                                    config_fields: res.resultFields,
                                },
                                output_fields: selectedFields,
                            }
                        }
                        return info
                    }),
                })
                onClose()
            }
        } catch (err) {
            // if (err?.errorFields?.length > 0) {
            // }
        }
    }

    const clearData = () => {
        setFormulaItem(undefined)
        setFieldItems(undefined)
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { preOutData } = await checkDeWeightFormulaConfig(
            graph!,
            node!,
            formulaData!,
            fieldsData,
        )
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (errorMsg && errorMsg !== FormulaError.ConfigError) {
            setTimeout(() => {
                setLoading(false)
            }, 400)
            return
        }

        const { totalFields } = checkSortAndRenameFields(
            preOutData,
            config?.config_fields,
        )
        setFieldItems(totalFields)
        setTimeout(() => {
            setLoading(false)
        }, 400)
    }

    return (
        <div className={styles.deWeightFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
            />
            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.df_contentWrap}>
                    {!formulaItem?.errorMsg ||
                    formulaItem.errorMsg === FormulaError.ConfigError ? (
                        <FieldsDragTable
                            ref={tRef}
                            items={fieldItems}
                            formulaItem={formulaItem}
                            fieldsData={fieldsData}
                            columns={['alias', 'enName']}
                            viewSize={viewSize || 0}
                        />
                    ) : (
                        dataEmptyView(formulaItem?.errorMsg, formulaItem?.type)
                    )}
                </div>
            )}
        </div>
    )
}

export default DistinctFormula
