import { FC } from 'react'
import moment from 'moment'
import { Form } from 'antd'
import {
    FeedBackModuleMap,
    IntegralConditionMap,
    IntegralObjectMap,
    IntegralType,
    RequirementsModuleMap,
} from './const'
import __ from './locale'

interface LabelTextProps {
    value?: string
    options?: { label: string; value: string }[]
    onChange?: (value: string) => void
}
export const LabelText: FC<LabelTextProps> = ({ value, options, onChange }) => {
    if (value) {
        const option = options?.find((item) => item.value === value)
        if (option) {
            return <span>{option.label}</span>
        }
        return <span>{value}</span>
    }
    return <span>{value}</span>
}

/**
 * 业务模块显示
 * @param value 业务模块
 * @returns 业务模块显示
 */
export const businessModuleDisplay = (value: any) => {
    if (value === 'data_connect_task') {
        return __('数据归集任务')
    }
    return FeedBackModuleMap[value] || RequirementsModuleMap[value] || '--'
}

/**
 * 积分对象显示
 * @param value 积分对象
 * @returns 积分对象显示
 */
export const integralObjectDisplay = (value: any) => {
    return IntegralObjectMap[value] || '--'
}

/**
 * 积分条件显示
 * @param value 积分条件
 * @returns 积分条件显示
 */
export const integralConditionDisplay = (value: any) => {
    return IntegralConditionMap[value] || '--'
}

/**
 * 积分值显示
 * @param value 积分值
 * @returns 积分值显示
 */
export const ruleValidityDisplay = (value: Array<any>) => {
    if (value[0] === -1 && value[1] === -1) {
        return __('永久有效')
    }
    if (value[0] !== -1 && value[1] !== -1) {
        return __('${start} 至 ${end} 有效', {
            start: moment(value[0]).format('YYYY-MM-DD'),
            end: moment(value[1]).format('YYYY-MM-DD'),
        })
    }
    if (value[1] === -1) {
        return __('${start}开始生效', {
            start: moment(value[0]).format('YYYY-MM-DD'),
        })
    }
    return __('${start}后失效', {
        start: moment(value[1]).format('YYYY-MM-DD'),
    })
}

/**
 * 规则配置项
 * @param itemData 规则配置项数据
 * @param data 规则数据
 * @returns 规则配置项
 */
export const RuleConfigItem = ({
    itemData,
    data,
}: {
    itemData: {
        key: string
        label: string
    }
    data: any
}) => {
    const { key, label } = itemData
    switch (key) {
        case 'business_module':
            return (
                <Form.Item
                    label={label}
                    name={key}
                    style={{ marginBottom: 12 }}
                >
                    <div>{businessModuleDisplay(data[key])}</div>
                </Form.Item>
            )
        case 'integral_object':
            return (
                <Form.Item
                    label={label}
                    name={key}
                    style={{ marginBottom: 12 }}
                >
                    <div>{integralObjectDisplay(data[key])}</div>
                </Form.Item>
            )
        case 'integral_condition':
            return (
                <Form.Item
                    label={label}
                    name={key}
                    style={{ marginBottom: 12 }}
                >
                    <div>{integralConditionDisplay(data[key])}</div>
                </Form.Item>
            )
        default:
            return <div>--</div>
    }
}
