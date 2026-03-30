import React from 'react'

/**
 * 状态枚举列表
 * @param label 显示待文本
 * @param value 枚举字段，后端返回key
 * @param bgColor 背景颜色
 * @param color 字体颜色
 */
interface IInfos {
    label: string
    value: number | string
    bgColor?: string
    color?: string
}
/**
 * 状态组件
 * @param value 后端返回状态
 * @param infos 需要转换待状态枚举列表
 */
export const CommonStatusLabel: React.FC<{
    value: string
    infos: IInfos[]
}> = ({ value, infos }) => {
    const {
        label,
        color = 'rgba(0, 0, 0, 0.85)',
        bgColor = 'rgba(0, 0, 0, 0.04)',
    } = infos.find((s) => s.value === value) || {}
    return (
        <div
            style={{
                display: 'flex',
                height: 28,
                width: 76,
                fontSize: 12,
                color: `${color}`,
                backgroundColor: `${bgColor}`,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {label}
        </div>
    )
}
