import React, { useEffect, useState } from 'react'
import { Cascader } from 'antd'
import {
    ICoreBusinessesParams,
    formatError,
    getSubjectDomain,
    getCoreBusinesses,
    getDomainTree,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'

interface Option {
    value?: string | number | null
    label: React.ReactNode
    children?: Option[]
    isLeaf?: boolean
    loading?: boolean
    disabled?: boolean
}

const CommonParams = { limit: 2000, parent_id: '', is_all: false }

interface IRelateCoreBusiness {
    value?: any
    // data?: any[]
    disabled?: boolean
    onChange?: (value, selectOptions) => void
}
const FreeTaskRelateCoreBusiness: React.FC<IRelateCoreBusiness> = ({
    value,
    // data,
    disabled,
    onChange,
    ...props
}) => {
    const [options, setOptions] = useState<Option[]>([])
    // const [data, setData] = useState([])

    // // 选择时回填数据
    // useEffect(() => {
    //     if (value) {
    //         setData(value)
    //     }
    // }, [value])

    useEffect(() => {
        // if (data && data.length > 0) {
        //     setOptions(data.map((d) => ({ label: d.name, value: d.id })))
        // } else {
        getDomains()
        // }
    }, [])

    const getTitleNode = (name: string) => {
        return {
            label: (
                <div
                    style={{
                        color: 'rgba(0, 0, 0, 0.45)',
                        fontSize: 12,
                    }}
                >
                    {name}
                </div>
            ),
            value: name,
            disabled: true,
        }
    }

    const getDomains = async () => {
        try {
            const res = await getSubjectDomain(CommonParams)
            const bizRes = await getCoreBusinesses({
                limit: 2000,
                offset: 1,
                unassigned: true,
            })

            const businessDomainList = res?.entries?.map((o) => ({
                label: o.name,
                value: o.id,
                // isLeaf: !o?.child_count,
                isLeaf: false,
            }))

            const commonHeader: any[] = []
            commonHeader.push(getTitleNode(__('业务领域')))

            if (bizRes?.entries?.length) {
                commonHeader.push({
                    label: __('未分类'),
                    value: 'unassigned',
                    isLeaf: false,
                })
            }

            // 设置第一层级数据
            setOptions(
                res.entries?.length > 0
                    ? [...commonHeader, ...businessDomainList]
                    : commonHeader,
            )
        } catch (error) {
            formatError(error)
        }
    }

    // const handleChange = (
    //     values: (string | number)[],
    //     selectedOptions: Option[],
    // ) => {
    //     // 不选到业务模型则相当于没选
    //     if (values.length !== 3) return
    //     onChange?.(values)
    // }

    const getMainBusinessOptions = async (params: ICoreBusinessesParams) => {
        try {
            const res = await getCoreBusinesses(params)
            return [
                getTitleNode(
                    res.entries?.length ? __('业务模型') : __('暂无数据'),
                ),
                ...(res.entries?.map((business) => {
                    return {
                        label: business.name,
                        value: business.id,
                        isLeaf: true,
                    }
                }) ?? []),
            ]
        } catch (error) {
            formatError(error)
            return [getTitleNode(__('暂无数据'))]
        }
    }

    const loadData = async (selectedOptions: Option[]) => {
        // 第一个节点
        const firstSelectedNode = selectedOptions?.[0]
        // 当前点击节点
        const targetOption = selectedOptions?.[selectedOptions.length - 1]
        // 存在子节点则无需加载
        if (targetOption?.children) {
            return Promise.resolve()
        }

        // 业务域查询主题域
        if (
            selectedOptions?.length === 1 &&
            firstSelectedNode?.value !== 'unassigned'
        ) {
            const parent_id = firstSelectedNode?.value as string
            const res = await getSubjectDomain({
                ...CommonParams,
                parent_id,
            })
            const subjectDomainList = (res?.entries || []).map((o) => ({
                label: o.name,
                value: o.id,
                isLeaf: false,
            }))
            const childOptions = [
                getTitleNode(
                    subjectDomainList?.length ? __('主题域') : __('暂无数据'),
                ),
                ...subjectDomainList,
            ]
            targetOption.children = childOptions
            setOptions([...options])
            return Promise.resolve()
        }

        const params: any = {
            limit: 100,
            offset: 1,
        }
        // 未定义业务模型查询
        if (
            selectedOptions?.length === 1 &&
            firstSelectedNode?.value === 'unassigned'
        ) {
            params.unassigned = true
            const childOptions = await getMainBusinessOptions(params)
            targetOption.children = childOptions
            setOptions([...options])
            return Promise.resolve()
        }

        // 主题域查询业务模型
        if (
            selectedOptions?.length === 2 &&
            firstSelectedNode?.value !== 'unassigned'
        ) {
            params.id = selectedOptions?.[1]?.value?.toString()
            const childOptions = await getMainBusinessOptions(params)
            targetOption.children = childOptions
            setOptions([...options])
            return Promise.resolve()
        }
        return Promise.resolve()
    }

    return (
        <Cascader
            className={styles.relateBusinessCascaderWrapper}
            placeholder={__('请选择业务模型')}
            options={options}
            loadData={loadData}
            onChange={onChange}
            displayRender={(label, selectedOptions) => {
                if (
                    selectedOptions?.length === 2 &&
                    selectedOptions[0].value === 'unassigned'
                ) {
                    return `${selectedOptions?.[1]?.label}`
                }
                if (selectedOptions?.length === 3) {
                    return `${selectedOptions?.[2]?.label}`
                }
                return value
            }}
            // changeOnSelect
            getPopupContainer={(node) => node.parentNode}
            disabled={disabled}
            value={value}
            allowClear={false}
            notFoundContent={
                <div className={styles.noData}>{__('暂无数据')}</div>
            }
            {...props}
        />
    )
}

export default FreeTaskRelateCoreBusiness
