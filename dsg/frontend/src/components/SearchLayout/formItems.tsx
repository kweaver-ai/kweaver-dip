import { Input, Select, Radio, InputNumber } from 'antd'
import { SearchType, IFormItem } from '@/components/SearchLayout/const'
import NumberInput from '../../ui/NumberInput'
import __ from './locale'
import SelectThemeDomain from '@/components/SelectThemeDomain'
import DepartmentAndOrgSelect from '@/components/DepartmentAndOrgSelect'

export const getItems = (item: IFormItem) => {
    switch (item.type) {
        case SearchType.Input:
            return (
                <Input
                    placeholder={`${__('请输入')}${item.label}`}
                    allowClear
                    maxLength={128}
                    {...item.itemProps}
                />
            )
        case SearchType.Select:
            return (
                <Select
                    getPopupContainer={(node) => node.parentNode}
                    placeholder={`${__('请选择')}${item.label}`}
                    notFoundContent={
                        <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                            {__('暂无数据')}
                        </div>
                    }
                    {...item.itemProps}
                />
            )
        case SearchType.Radio:
            return (
                <Radio.Group {...item.itemProps}>
                    {item?.itemProps?.options.map((it) => {
                        return (
                            <Radio key={it.value} value={it.value}>
                                {it.label}
                            </Radio>
                        )
                    })}
                </Radio.Group>
            )
        case SearchType.InputNumber:
            return (
                <NumberInput
                    placeholder={`${__('请输入')}${item.label}`}
                    {...item.itemProps}
                />
            )
        case SearchType.SelectThemeDomain:
            return <SelectThemeDomain />
        case SearchType.DepartmentAndOrgSelect:
            return <DepartmentAndOrgSelect />
        case SearchType.Other:
            return item.render ? item.render(item) : null
        default:
            return null
    }
}
