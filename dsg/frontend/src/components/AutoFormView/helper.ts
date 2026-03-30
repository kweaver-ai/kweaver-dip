import { ReactNode } from 'react'

/**
 * 展示组件类型
 */
enum DisplayInfoComponentType {
    // 文本组件
    Text = 'text',

    // 判断组件
    BooleanText = 'booleanText',

    // 文本域组件
    AreaText = 'areaText',

    // 选择框内容
    SelectText = 'selectText',

    // tag显示组件
    TagText = 'TagText',

    // 组集合
    GroupType = 'groupType',

    // 自定义
    Custom = 'custom',

    // 组集合2
    GroupType2 = 'groupType2',
}

export { DisplayInfoComponentType }
