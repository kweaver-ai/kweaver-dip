import React, { ReactNode, useEffect, useState } from 'react'
import { Tabs, Radio, Space, InputNumber } from 'antd'
import styles from './styles.module.less'
import {
    ExplorationRule,
    ExplorationRuleTabs,
    samplingRuleConfigRadio,
    samplingRuleConfigType,
    ExplorationType,
} from './const'
import FieldRules from './FieldRules'
import __ from './locale'
import { useDataViewContext } from '../DataViewProvider'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import ExplorationAttribute from './ExplorationAttribute'

const ExplorationRules = (props: {
    explorationType: ExplorationType
    /** 查看模式 */
    viewMode?: boolean
    /** 是否隐藏采样配置 */
    hiddenSample?: boolean
    /** 查看模式下采样规则 */
    sampleTip?: ReactNode
}) => {
    const {
        explorationType,
        viewMode = false,
        hiddenSample = false,
        sampleTip,
    } = props
    const [{ cssjj }] = useGeneralConfig()
    const [tab, setTab] = useState<ExplorationRule>(ExplorationRule.Metadata)
    const [samplingRuleNumber, setSamplingRuleNumber] = useState<number>(1000)
    const [samplingRuleValue, setSamplingRuleValue] =
        useState<samplingRuleConfigType>(samplingRuleConfigType.All)
    const { explorationData, setExplorationData } = useDataViewContext()
    const [explorationRuleTabsList, setExplorationRuleTabslist] =
        useState<any[]>(ExplorationRuleTabs)

    useEffect(() => {
        setExplorationData((pre) => ({
            ...pre,
            total_sample:
                samplingRuleValue === samplingRuleConfigType.All
                    ? 0
                    : samplingRuleNumber,
            viewMode,
        }))
    }, [samplingRuleNumber, samplingRuleValue, viewMode])

    useEffect(() => {
        if (explorationType) {
            setExplorationRuleTabslist(
                explorationType === ExplorationType.Datasource
                    ? ExplorationRuleTabs?.filter(
                          (item) => item.key !== ExplorationRule.Row,
                      )
                    : ExplorationRuleTabs,
            )
        }
    }, [explorationType])

    useEffect(() => {
        setExplorationData((pre) => ({
            ...pre,
            cssjj: !!cssjj,
        }))
    }, [cssjj])

    useEffect(() => {
        if (explorationData?.total_sample) {
            setSamplingRuleValue(samplingRuleConfigType.Random)
            setSamplingRuleNumber(explorationData?.total_sample)
        }
    }, [explorationData])

    const handleTabChange = (key) => {
        setTab(key)
        setExplorationData((pre) => ({
            ...pre,
            explorationRule: key,
            activeField: {},
        }))
    }

    return (
        <div className={styles.explorationRulesWrapper}>
            <Tabs
                activeKey={tab}
                onChange={handleTabChange}
                items={explorationRuleTabsList}
                className={styles.explorationRulesTabs}
            />
            <div
                className={styles.samplingBox}
                style={{
                    top:
                        samplingRuleValue === samplingRuleConfigType.All
                            ? 12
                            : 6,
                }}
                hidden={hiddenSample}
            >
                <span>{__('采样规则：')}</span>
                {sampleTip}
                <span hidden={!!sampleTip}>
                    <Radio.Group value={samplingRuleValue} disabled={viewMode}>
                        <Space size={8}>
                            {samplingRuleConfigRadio.map((item) => {
                                return (
                                    <Radio
                                        onChange={(e) => {
                                            const { value } = e.target
                                            setSamplingRuleValue(value)
                                            setSamplingRuleNumber(
                                                value ===
                                                    samplingRuleConfigType.All
                                                    ? 0
                                                    : 1000,
                                            )
                                        }}
                                        value={item.value}
                                        key={item.value}
                                    >
                                        {item.label}
                                        {samplingRuleValue ===
                                            samplingRuleConfigType.Random &&
                                            item.value ===
                                                samplingRuleConfigType.Random && (
                                                <span style={{ marginLeft: 8 }}>
                                                    <InputNumber
                                                        className={
                                                            styles.inpNumber
                                                        }
                                                        min={1000}
                                                        step={1000}
                                                        value={
                                                            samplingRuleNumber
                                                        }
                                                        onChange={(val) =>
                                                            setSamplingRuleNumber(
                                                                val || 1000,
                                                            )
                                                        }
                                                    />
                                                    {__('条')}
                                                </span>
                                            )}
                                    </Radio>
                                )
                            })}
                        </Space>
                    </Radio.Group>
                </span>
            </div>
            <div className={styles.explorationRulesContainer}>
                {tab === ExplorationRule.Field ? (
                    <FieldRules />
                ) : (
                    <ExplorationAttribute />
                )}
            </div>
        </div>
    )
}

export default ExplorationRules
