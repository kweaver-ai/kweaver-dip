import { LoadingOutlined } from '@ant-design/icons'
import { Select } from 'antd'
import { debounce, trim } from 'lodash'
import { useEffect, useState } from 'react'
import { formatError, getWorkOrder } from '@/core'
import __ from './locale'

const WorkOrderSelect = ({ value, type, onChange }: any) => {
    const [options, setOptions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [defaultOptions, setDefaultOptions] = useState([])

    const getData = async (key?: string) => {
        setIsLoading(true)
        try {
            const params: any = {
                keyword: trim(key),
            }

            if (type) {
                params.type = type
            }

            const data = await getWorkOrder(params)
            return Promise.resolve(data?.entries || [])
        } catch (error) {
            formatError(error)
            return Promise.resolve([])
        } finally {
            setIsLoading(false)
        }
    }

    const initLoad = async () => {
        const initData = await getData()
        setDefaultOptions(initData)
        setOptions(initData)
    }

    useEffect(() => {
        initLoad()
    }, [])

    const fetchData = async (val) => {
        const data = await getData(val)
        setOptions(data)
    }

    const onSearch = debounce((val) => {
        if (val) {
            fetchData(val)
        } else {
            setOptions(defaultOptions)
        }
    }, 300)

    return (
        <Select
            showSearch
            labelInValue
            filterOption={false}
            onSearch={onSearch}
            notFoundContent={
                isLoading ? <LoadingOutlined /> : '抱歉，没有找到相关内容'
            }
            value={value}
            onChange={onChange}
            placeholder={__('请选择关联工单')}
        >
            {options.map((it: any) => (
                <Select.Option
                    key={it?.work_order_id}
                    value={it?.work_order_id}
                >
                    {it?.name}
                </Select.Option>
            ))}
        </Select>
    )
}

export default WorkOrderSelect
