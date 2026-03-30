import React, { useEffect, useMemo, useState } from 'react'
import styles from './styles.module.less'
import __ from '../locale'
import { ExplorationRuleTabs, getRuleActionMap } from '../const'
import { useDataViewContext } from '../../DataViewProvider'
import { formatError, getDatasheetViewDetails, dataTypeMapping } from '@/core'
import RuleDetailMap from './RuleDetailMap'
import { Expand } from '@/ui'
import {
    qualityDimensionOptions,
    dimensionTypeOptions,
} from '@/components/QualityRuleTemplate/const'

interface IRulesModal {
    ruleId: string
    type?: string
}

const RulesDetailsCard: React.FC<IRulesModal> = ({ ruleId, type }) => {
    const { isTemplateConfig, explorationData, setExplorationData } =
        useDataViewContext()
    const [ruleDetails, setRuleDetails] = useState<any>(null)
    const [fieldList, setFieldList] = useState<any[]>([])

    const cssjj = useMemo(() => {
        return explorationData.cssjj
    }, [explorationData])

    useEffect(() => {
        if (ruleId) {
            getDetails()
        }
    }, [ruleId])

    useEffect(() => {
        if (explorationData?.dataViewId) {
            if (explorationData?.fieldList?.length) {
                setFieldList(explorationData?.fieldList)
            } else {
                getFields(explorationData?.dataViewId)
            }
        }
    }, [])

    const getFields = async (dataViewId: string) => {
        try {
            const res = await getDatasheetViewDetails(dataViewId)
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
        } catch (error) {
            formatError(error)
        }
    }

    const getDetails = async () => {
        try {
            let actionType
            if (type) {
                actionType = type
            } else if (isTemplateConfig) {
                actionType = 'isTemplateConfig'
            } else if (cssjj) {
                actionType = 'cssjj'
            } else {
                actionType = 'default'
            }
            const action = getRuleActionMap('details', actionType)
            const res = await action(ruleId)
            setRuleDetails(res)
        } catch (err) {
            formatError(err)
        }
    }

    const renderRuleContent = (info: any) => {
        return <RuleDetailMap config={info?.rule_config} fields={fieldList} />
    }

    return (
        <div className={styles.drawerBox}>
            <div
                className={styles.textItem}
                style={{ alignItems: 'flex-start' }}
            >
                <div className={styles.label}>{__('质量维度')}：</div>
                <div className={styles.text} style={{ whiteSpace: 'initial' }}>
                    {qualityDimensionOptions.find(
                        (o) => o.value === ruleDetails?.dimension,
                    )?.label || '--'}
                </div>
            </div>
            <div
                className={styles.textItem}
                style={{ alignItems: 'flex-start' }}
            >
                <div className={styles.label}>{__('维度类型')}：</div>
                <div className={styles.text} style={{ whiteSpace: 'initial' }}>
                    {dimensionTypeOptions.find(
                        (o) => o.value === ruleDetails?.dimension_type,
                    )?.label || '--'}
                </div>
            </div>
            <div
                className={styles.textItem}
                style={{ alignItems: 'flex-start' }}
            >
                <div className={styles.label}>{__('规则名称')}：</div>
                <div className={styles.text} style={{ whiteSpace: 'initial' }}>
                    <Expand
                        rows={2}
                        content={ruleDetails?.rule_name ?? '--'}
                        expandTips={__('展开')}
                    />
                </div>
            </div>
            <div
                className={styles.textItem}
                style={{ alignItems: 'flex-start' }}
            >
                <div className={styles.label}>{__('规则描述')}：</div>
                <div className={styles.text} style={{ whiteSpace: 'initial' }}>
                    <Expand
                        rows={2}
                        content={ruleDetails?.rule_description || '--'}
                        expandTips={__('展开')}
                    />
                </div>
            </div>
            {renderRuleContent(ruleDetails)}
        </div>
    )
}

export default RulesDetailsCard
