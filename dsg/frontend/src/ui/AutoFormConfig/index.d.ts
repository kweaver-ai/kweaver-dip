import { FormInstance, Rule } from 'antd'
import { ComponentType } from '../const'

export interface AutoFormConfigType {
    defaultData?: {
        [key: string]: any
    }
    config: {
        [key: string]: FormItemConfig
    }
    onFinsh: (values) => void
    onChange: (changedValues, allValues) => void
    layout?: 'horizontal' | 'vertical' | 'inline'
    form: FormInstance<any>
}

export interface FormItemConfig {
    type: ComponentType
    children?: {
        config: {
            [key: string]: FormItemConfig
        }
        widths: Array<number>
    }
    label?: string
    options?: Array<{
        label: string
        value: any
    }>
    disabled?: boolean
    placeholder?: string
    maxLength?: number
    className?: string
    rules?: Rule[]
    others?: {
        [key: string]: any
    }
}
