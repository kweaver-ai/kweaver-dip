import React from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { DataDictType, IDataDictItem } from '@/core'
import { useDict } from '@/hooks/useDict'
import __ from './locale'

interface DictionarySelectProps extends Omit<SelectProps, 'options'> {
    dictType: DataDictType
}

const DictionarySelect: React.FC<DictionarySelectProps> = ({
    dictType,
    ...props
}) => {
    const [dictionaryList, setDictionaryList] = useDict()

    const getOptionsByDictType = (dict_type: DataDictType): IDataDictItem[] => {
        const dict = dictionaryList.find((item) => item.dict_type === dict_type)
        return dict?.dict_item_resp || []
    }

    const options = getOptionsByDictType(dictType).map((dict) => ({
        label: dict.dict_value,
        value: dict.dict_key,
    }))

    return (
        <Select
            placeholder={__('请选择')}
            allowClear
            options={options}
            {...props}
        />
    )
}

export default DictionarySelect
