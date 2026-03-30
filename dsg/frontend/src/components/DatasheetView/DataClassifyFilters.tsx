import { Badge } from 'antd'
import React, { useMemo } from 'react'
import { FontIcon } from '@/icons'
import { ClassifyType, classifiedOptoins, sensitiveOptions } from './const'
import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { IGradeLabel } from '@/core'
import { LightweightSearch } from '@/ui'

interface IDataClassifyFilters {
    isStart?: boolean
    tagData?: IGradeLabel[]
    onChange: (data) => void
    isButton?: boolean
}

const DataClassifyFilters: React.FC<IDataClassifyFilters> = ({
    isStart,
    tagData,
    onChange,
    isButton = false,
}) => {
    const unCategorized = {
        value: 0,
        label: __('未分类'),
    }
    const filters = [
        {
            label: __('不限'),
            value: ClassifyType.NotLimit,
        },
        {
            label: __('已分类'),
            value: ClassifyType.Manual,
            icon: <FontIcon name="icon-shuxing" style={{ color: '#F5890D' }} />,
        },
        {
            label: __('已分类（探查分类）'),
            value: ClassifyType.Auto,
            icon: (
                <Badge dot color="#1890FF" offset={[-2, 16]}>
                    <FontIcon
                        name="icon-shuxing"
                        style={{ color: '#F5890D' }}
                    />
                </Badge>
            ),
        },
        {
            label: __('未分类'),
            value: ClassifyType.No,
            icon: <FontIcon name="icon-shuxing" style={{ color: '#000000' }} />,
        },
    ]

    const searchData: IformItem[] = useMemo(() => {
        const sd: IformItem[] = [
            {
                label: __('字段分类'),
                key: 'classfity_type',
                options: filters,
                type: SearchType.Radio,
                show: true,
            },
            {
                label: __('字段分级'),
                key: 'label_id',
                options: tagData
                    ? [
                          ...tagData,
                          { name: __('未分级'), id: '', icon: '' },
                      ].map((item) => {
                          return {
                              label: item.name,
                              value: item.id,
                              icon: item?.icon ? (
                                  <FontIcon
                                      name="icon-biaoqianicon"
                                      style={{ color: item.icon }}
                                  />
                              ) : null,
                          }
                      })
                    : [],
                type: SearchType.MultipleSelect,
                show: isStart,
            },
            {
                label: __('字段敏感属性'),
                key: 'sensitive_type',
                options: [...sensitiveOptions, unCategorized],
                type: SearchType.Radio,
                show: true,
            },
            {
                label: __('字段涉密属性'),
                key: 'secret_type',
                options: [...classifiedOptoins, unCategorized],
                type: SearchType.Radio,
                show: true,
            },
        ]
        return sd
    }, [tagData, isStart])

    const defaultSearchData = {
        classfity_type: ClassifyType.NotLimit,
        label_id: [],
    }

    return (
        <LightweightSearch
            formData={searchData}
            onChange={(d, key) => {
                onChange(d)
            }}
            defaultValue={defaultSearchData}
            isButton={isButton}
            hiddenItemCb={(params, item) => {
                // 未分类时 只展示未分级标签
                return params.classfity_type === ClassifyType.No && item.value
            }}
        />
    )
}

export default DataClassifyFilters
