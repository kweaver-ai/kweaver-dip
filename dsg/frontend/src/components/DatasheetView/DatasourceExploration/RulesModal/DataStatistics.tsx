import React, { useEffect, useMemo, useState } from 'react'
import { Checkbox, Col, Tooltip, Row } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import { useDataViewContext } from '../../DataViewProvider'
import { ExplorationPeculiarity, datasourceExploreFieldMap } from '../const'
import { changeTypeToLargeArea } from '@/components/IndicatorManage/helper'

interface IDataStatistics {
    value?: any
    onChange?: (o) => void
    // 已创建内置规则
    createdRuleTempIds?: string[]
}

const DataStatistics: React.FC<IDataStatistics> = ({
    value,
    onChange,
    createdRuleTempIds,
}) => {
    const { explorationData } = useDataViewContext()
    const [options, setOptions] = useState<any[]>([])
    const [checkedList, setCheckedList] = useState<any[]>([])
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkAll, setCheckAll] = useState(false)

    const canCheckedOptions = useMemo(() => {
        return options?.filter(
            (item) => !createdRuleTempIds?.includes(item.template_id),
        )
    }, [options, createdRuleTempIds])

    useEffect(() => {
        if (explorationData?.dataStatisticsOptions?.length) {
            setOptions(explorationData?.dataStatisticsOptions)
        }
    }, [explorationData?.dataStatisticsOptions])

    const onCheckAllChange = (e: any) => {
        const list = e.target.checked
            ? canCheckedOptions?.map((item) => item.template_id)
            : []
        setCheckedList(list)
        setIndeterminate(false)
        setCheckAll(e.target.checked)
        onChange?.(list)
    }

    const onCheckChange = (checkedValues: any) => {
        setIndeterminate(
            !!checkedValues.length &&
                checkedValues.length < canCheckedOptions.length,
        )
        setCheckAll(checkedValues.length === canCheckedOptions.length)
        setCheckedList(checkedValues)
        onChange?.(checkedValues)
    }

    return (
        <div>
            <div style={{ marginBottom: '12px', paddingLeft: '16px' }}>
                <Checkbox
                    indeterminate={indeterminate}
                    onChange={onCheckAllChange}
                    checked={checkAll}
                    disabled={!canCheckedOptions?.length}
                >
                    {__('全选')}
                </Checkbox>
            </div>
            <Checkbox.Group
                style={{ width: '100%' }}
                onChange={onCheckChange}
                className={styles.ruleGroup}
                value={checkedList}
            >
                <Row>
                    {options.map((item, index) => {
                        return (
                            <Tooltip
                                key={item.template_id}
                                title={
                                    createdRuleTempIds?.includes(item.value)
                                        ? __('规则已存在')
                                        : ''
                                }
                            >
                                <Col span={24} className={styles.ruleCol}>
                                    <Checkbox
                                        value={item.template_id}
                                        disabled={createdRuleTempIds?.includes(
                                            item.template_id,
                                        )}
                                    >
                                        <div className={styles.ruleName}>
                                            {item.rule_name}
                                        </div>
                                        <div className={styles.description}>
                                            {item.rule_description}
                                        </div>
                                    </Checkbox>
                                </Col>
                            </Tooltip>
                        )
                    })}
                </Row>
            </Checkbox.Group>
        </div>
    )
}

export default DataStatistics
