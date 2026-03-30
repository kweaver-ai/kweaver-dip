import React, { useEffect, useRef, useState } from 'react'
import { Spin } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { FormulaError } from '../const'
import { IFormula, IFormulaFields, messageError } from '@/core'
import { checkSelectFormulaConfig, checkSortAndRenameFields } from '../helper'
import { dataEmptyView, IFormulaConfigEl } from './helper'
import ConfigHeader from './ConfigHeader'
import FieldsDragTable from './FieldsDragTable'

/**
 * 选择列算子配置
 */
const SelectFormula = ({
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
    // 展示字段集
    const [fieldItems, setFieldItems] = useState<IFormulaFields[]>([])

    useEffect(() => {
        if (visible && formulaData && node && graph) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = () => {
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
                node!.replaceData({
                    ...node?.data,
                    formula: formula.map((info) => {
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
        setFieldItems([])
    }

    // 检查更新数据
    const checkData = () => {
        setLoading(true)
        clearData()
        const { preOutData } = checkSelectFormulaConfig(
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
        <div className={styles.selectFormulaWrap}>
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
                <div className={styles.sf_contentWrap}>
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

export default SelectFormula
