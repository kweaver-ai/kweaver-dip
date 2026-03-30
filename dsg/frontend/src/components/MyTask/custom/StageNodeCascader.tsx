import { Cascader, Spin } from 'antd'
import React, { ReactNode, useState, useEffect } from 'react'
import styles from './styles.module.less'
import __ from '../locale'

interface Option {
    value: string
    label: string | ReactNode
    children?: Option[]
    disabled?: boolean
}

interface IStageNodeCascader {
    stages: any[]
    stageNodes?: any[]
    disabled?: boolean
    loading?: boolean
    onChange?: (value, selectedOptions) => void
    onFocus?
    onMouseLeave?
    onBlur?
}

/**
 * 阶段/节点选择组件
 * @param pid? string 项目id
 * @param stages? any[] 阶段集
 * @param stageNodes? any[] 阶段节点集
 * @param disabled? 是否可用
 * @param loading? 请求加载
 */
export const StageNodeCascader: React.FC<IStageNodeCascader> = ({
    stages,
    stageNodes,
    disabled,
    loading,
    onChange,
    onFocus,
    onMouseLeave,
    onBlur,
    ...props
}) => {
    // 数据转换选项值
    const changeOptions = (stageArr: any[], stageNodeArr: any[]) => {
        if (stageArr.length === 0 && stageNodeArr.length > 0) {
            return [
                {
                    label: (
                        <div
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: 12,
                            }}
                        >
                            {__('工作流程中节点')}
                        </div>
                    ),
                    value: '工作流程中节点',
                    disabled: true,
                },
                ...stageNodeArr.map((node) => {
                    return {
                        label: node.node_name,
                        value: node.node_id,
                    }
                }),
            ]
        }
        if (stageNodeArr.length > 0) {
            return [
                {
                    label: (
                        <div
                            style={{
                                color: 'rgba(0, 0, 0, 0.45)',
                                fontSize: 12,
                            }}
                        >
                            {__('工作流程中阶段')}
                        </div>
                    ),
                    value: '工作流程中阶段',
                    disabled: true,
                },
                ...stageArr.map((stage) => {
                    return {
                        label: stage.stage_name,
                        value: stage.stage_id,
                        children: [
                            {
                                label: (
                                    <div
                                        style={{
                                            color: 'rgba(0, 0, 0, 0.45)',
                                            fontSize: 12,
                                        }}
                                    >
                                        {__('阶段下节点')}
                                    </div>
                                ),
                                value: '阶段下节点',
                                disabled: true,
                            },
                            ...stageNodeArr
                                .filter((s) => s.stage_id === stage.stage_id)
                                .map((node) => {
                                    return {
                                        label: node.node_name,
                                        value: node.node_id,
                                    }
                                }),
                        ],
                    }
                }),
            ]
        }
        return []
    }

    // 选项值
    const [options, setOptions] = useState<Option[]>(() =>
        changeOptions(stages, stageNodes || []),
    )

    useEffect(() => {
        if (stageNodes && stageNodes.length > 0) {
            setOptions(changeOptions(stages, stageNodes))
        }
    }, [stageNodes])

    return (
        <Cascader
            className={styles.stageNodeCascaderWrapper}
            placeholder={__('请选择任务所在节点')}
            options={options}
            notFoundContent={
                loading ? (
                    <Spin />
                ) : stageNodes ? (
                    <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('暂无数据')}
                    </div>
                ) : (
                    <div style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)' }}>
                        {__('请先选择关联项目')}
                    </div>
                )
            }
            getPopupContainer={(node) => node.parentNode}
            allowClear={false}
            onChange={onChange}
            onFocus={onFocus}
            onMouseLeave={onMouseLeave}
            onBlur={onBlur}
            disabled={disabled}
            {...props}
        />
    )
}
