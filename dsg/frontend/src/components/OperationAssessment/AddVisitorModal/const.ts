import { IObject } from '@/core/apis/configurationCenter/index'

export interface DataNode extends IObject {
    expand?: boolean
    path_id?: string
    children?: DataNode[]
    isExpand?: boolean
    level?: number
}

export enum OptionType {
    Add = 'add',
    Remove = 'remove',
}
