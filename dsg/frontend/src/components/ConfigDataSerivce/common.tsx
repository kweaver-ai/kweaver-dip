import { Input, Select } from 'antd'
import NumberInput from '@/ui/NumberInput'
import { NumberType } from '@/ui/NumberInput/const'
import __ from './locale'

export const getParamsByType = (type, index) => {
    switch (type) {
        case 'string':
            return (
                <Input
                    placeholder={__('请输入')}
                    autoComplete="off"
                    maxLength={128}
                    onPressEnter={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                />
            )

        case 'int':
        case 'long':
            return (
                <NumberInput
                    placeholder={__('请输入')}
                    maxLength={128}
                    type={NumberType.Natural}
                />
            )
        case 'float':
        case 'double':
            return (
                <NumberInput
                    placeholder={__('请输入')}
                    maxLength={128}
                    type={NumberType.Number}
                />
            )
        case 'boolean':
            return (
                <Select
                    options={[
                        {
                            value: 'true',
                            label: __('是'),
                        },
                        {
                            value: 'false',
                            label: __('否'),
                        },
                    ]}
                />
            )
        default:
            return <div />
    }
}
