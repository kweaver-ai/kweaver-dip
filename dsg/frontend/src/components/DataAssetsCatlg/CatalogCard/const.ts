import __ from '../locale'
import { resourceTypeList } from '@/components/ResourcesDir/const'

export const cardInfoList = [
    { label: __('编码'), key: 'code', value: '', span: 24 },
    {
        label: __('资源类型'),
        key: 'resource_type',
        value: '',
        span: 24,
    },
    // { label: __('访问量'), key: 'preview_count', value: 0, span: 24 },
    {
        label: __('描述'),
        key: 'description',
        labelWidth: '50px',
        value: '',
        span: 24,
    },
]

export const mountResoureInfoList = [
    { label: __('挂接资源业务名称'), key: 'name', value: '', span: 24 },
    { label: __('资源编码'), key: 'code', value: '', span: 24 },
    // { label: __('挂接资源技术名称'), key: 'name_en', value: '', span: 24 },
    { label: __('发布时间'), key: 'publish_at', value: '', span: 24 },
]
export const getMountResoureList = (data: any[]) => {
    const list: any[] = []
    data?.forEach((item) => {
        list.push(item)
        if (item?.children?.length) {
            list.push(...item.children)
        }
    })
    return list
}
