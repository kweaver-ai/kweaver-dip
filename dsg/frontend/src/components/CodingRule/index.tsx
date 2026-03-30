import React, { memo, useEffect, useMemo, useState } from 'react'
import { Button, Tooltip } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import { RuleType, RuleTypeIcon, getCodeExample, getCodeRule } from './helper'
import EditRuleModal from './EditRuleModal'
import { ICCRuleItem, formatError, getCodeGenerationRules } from '@/core'
import { formatTime } from '@/utils'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

/**
 * 编码规则项
 */
const RuleItem = memo(
    ({
        item,
        onEdit,
    }: {
        item: ICCRuleItem
        onEdit?: (value: ICCRuleItem) => void
    }) => {
        const [{ using }] = useGeneralConfig()
        const startEndValue = useMemo(() => {
            const len = item?.digital_code_width || 6
            const start = String(item?.digital_code_starting || 1).padStart(
                len,
                '0',
            )
            const end =
                item?.digital_code_ending || Number('9'.padEnd(len, '9'))
            return { start, end }
        }, [item])

        const getLabelByType = (type: string) => {
            const text =
                type === RuleType.LogicView ? __('通用') : __('应用：智能找数')

            const tooltip =
                type === RuleType.LogicView
                    ? undefined
                    : using
                    ? __('仅对应用“智能找数”生效，若未安装此应用，可忽略配置。')
                    : __(
                          '仅对应用“智能找数”生效，若未安装此应用或无编目场景，可忽略配置。',
                      )

            return (
                <span
                    className={styles['rule-item-head-label']}
                    title={tooltip}
                >
                    {text}
                </span>
            )
        }

        return (
            <div className={styles['rule-item']}>
                <div className={styles['rule-item-head']}>
                    <div className={styles['rule-item-head-icon']}>
                        {RuleTypeIcon?.[item.type]}
                    </div>
                    <div className={styles['rule-item-head-info']}>
                        <div>
                            {item.name}
                            {getLabelByType(item.type)}
                        </div>
                        <div>
                            {__('编码示例')}: {getCodeExample(item)}
                        </div>
                    </div>
                    <div className={styles['rule-item-head-btn']}>
                        <Button
                            type="default"
                            style={{ width: '80px' }}
                            onClick={() => onEdit?.(item)}
                        >
                            {__('编辑')}
                        </Button>
                    </div>
                </div>
                <div className={styles['rule-item-content']}>
                    <div className={styles['rule-line']}>
                        <span>{__('编码规则')}</span>
                        <span>
                            {getCodeRule({
                                prefix_enabled: item?.prefix_enabled,
                                rule_code_enabled: item?.rule_code_enabled,
                                code_separator_enabled:
                                    item?.code_separator_enabled,
                            })}
                        </span>
                    </div>
                    {item?.prefix_enabled && (
                        <div className={styles['rule-line']}>
                            <span>{__('前缀')}</span>
                            <span>{item?.prefix}</span>
                        </div>
                    )}
                    {item?.rule_code_enabled && (
                        <div className={styles['rule-line']}>
                            <span>{__('规则码')}</span>
                            <span>{item?.rule_code}</span>
                        </div>
                    )}
                    {item?.code_separator_enabled && (
                        <div className={styles['rule-line']}>
                            <span>{__('分隔符')}</span>
                            <span>{item?.code_separator}</span>
                        </div>
                    )}
                    <div className={styles['rule-line']}>
                        <span>{__('数字码位数')}</span>
                        <span>{item?.digital_code_width}</span>
                    </div>
                    <div className={styles['rule-line']}>
                        <span>{__('数字码起始值')}</span>
                        <span>{startEndValue.start}</span>
                    </div>
                    <div className={styles['rule-line']}>
                        <span>{__('数字码终止值')}</span>
                        <span>{startEndValue.end}</span>
                    </div>
                    <div className={styles['rule-line']}>
                        <span>{__('更新人')}</span>
                        <span>{item?.updater_name || '--'}</span>
                    </div>
                    <div className={styles['rule-line']}>
                        <span>{__('更新时间')}</span>
                        <span>{formatTime(item?.updated_at) || '--'}</span>
                    </div>
                </div>
            </div>
        )
    },
)

function CodingRule() {
    const [codeRules, setCodeRules] = useState<ICCRuleItem[]>()
    const [current, setCurrent] = useState<ICCRuleItem>()
    const [editVisible, setEditVisible] = useState<boolean>(false)
    const [{ using }] = useGeneralConfig()

    const getData = async () => {
        try {
            const rules = await getCodeGenerationRules()
            let cRules = rules.entries || []
            // 数据资源模式
            if (using !== 1) {
                cRules = cRules?.filter((o) => o.name !== '数据资源目录')
            }
            setCodeRules(cRules)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getData()
    }, [])

    const handleEditRule = (item: ICCRuleItem) => {
        setCurrent(item)
        setEditVisible(true)
    }

    const handleClose = () => {
        setEditVisible(false)
        setCurrent(undefined)
    }

    const handleSure = async () => {
        // 更新内容
        getData()
    }

    return (
        <div className={styles['coding-rule']}>
            <div className={styles['coding-rule-title']}>
                {__('编码生成规则')}
            </div>
            <div className={styles['coding-rule-list']}>
                {codeRules?.map((rule) => (
                    <RuleItem
                        key={rule.id}
                        item={rule}
                        onEdit={handleEditRule}
                    />
                ))}
            </div>

            <EditRuleModal
                data={current}
                visible={editVisible}
                onClose={handleClose}
                onSure={handleSure}
            />
        </div>
    )
}

export default CodingRule
