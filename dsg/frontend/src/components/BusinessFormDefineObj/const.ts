import { IGradeLabel } from '@/core'
import __ from './locale'

export const enum ViewModel {
    // 建模人员编辑
    ModelEdit = 'edit',

    // 建模人员预览
    ModelView = 'view',

    // 加工人员
    Processing = 'Processing',
}

export interface IObj {
    id: string
    name: string
    type: string
}

export const standardFields = [
    {
        label: __('中文名称：'),
        key: 'name',
    },
    {
        label: __('英文名称：'),
        key: 'name_en',
    },
    {
        label: __('数据类型：'),
        key: 'data_type',
    },
]

export const getTargetTag = (data: IGradeLabel[], id: string) => {
    for (let i = 0; i < data.length; i += 1) {
        if (data[i].id === id) {
            return data[i]
        }
        if (Array.isArray(data[i].children)) {
            const found = getTargetTag(data[i].children, id)
            if (found) {
                return found
            }
        }
    }
    return null
}
