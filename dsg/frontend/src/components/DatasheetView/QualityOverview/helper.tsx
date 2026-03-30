import BigNumber from 'bignumber.js'
import { Tooltip } from 'antd'
import { SortDirection } from '@/core'
import __ from './locale'
import { FontIcon } from '@/icons'

export const SortKeyMap = {
    total_score: 'f_total_score',
    accuracy_score: 'f_total_accuracy',
    completeness_score: 'f_total_completeness',
    consistency_score: 'f_total_consistency',
    uniqueness_score: 'f_total_uniqueness',
    standardization_score: 'f_total_standardization',
}

export const FilterMenus = [
    { key: 'f_total_score', label: __('按质量得分') },
    { key: 'f_total_accuracy', label: __('按准确性') },
    { key: 'f_total_completeness', label: __('按完整性') },
    { key: 'f_total_consistency', label: __('按一致性') },
    { key: 'f_total_uniqueness', label: __('按唯一性') },
    { key: 'f_total_standardization', label: __('按规范性') },
]

export const DefaultMenu = { key: 'total_score', sort: SortDirection.DESC }

/** 安全乘法 */
export const safeMultiply = (value: number, multiplier: number): number => {
    return new BigNumber(value || 0).multipliedBy(multiplier).toNumber()
}

export const showNoContent = (value: any) => {
    return [undefined, null, ''].includes(value) ? (
        <span style={{ color: 'rgba(0,0,0,0.45)' }}>未配置</span>
    ) : (
        safeMultiply(value || 0, 100)
    )
}

export const getScore = (val, canZero = true) => {
    if (!val) return canZero ? 0 : val

    const score = Math.trunc(val * 10000) / 100
    return Number(score.toFixed(2).replace(/\.?0+$/, ''))
}

export const RenderTooltip = (
    title?: string,
    content?: string,
    props?: any,
) => {
    return (
        <Tooltip
            title={
                <div>
                    <div
                        style={{
                            fontSize: 14,
                            color: 'rgba(0, 0, 0, 0.85)',
                        }}
                        hidden={!title}
                    >
                        {title}：
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: 'rgba(0, 0, 0, 0.65)',
                        }}
                    >
                        {content}
                    </div>
                </div>
            }
            placement="right"
            color="#fff"
            overlayInnerStyle={{
                color: 'rgba(0,0,0,0.85)',
            }}
            overlayStyle={{
                maxWidth: 360,
            }}
            {...(props || {})}
        >
            <FontIcon
                name="icon-bangzhu"
                style={{
                    fontSize: 14,
                    color: 'rgba(0, 0, 0, 0.65)',
                }}
            />
        </Tooltip>
    )
}
