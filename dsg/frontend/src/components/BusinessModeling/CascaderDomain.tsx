import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Cascader } from 'antd'
import {
    ISubjectDomainItem,
    formatError,
    getSubjectDomain,
    getCoreBusinesses,
    getDomainTree,
} from '@/core'
import { BusinessDomainType } from '../BusinessDomain/const'
import styles from './styles.module.less'
import __ from './locale'
import Loader from '@/ui/Loader'

interface Option {
    value?: string | number | null
    label: React.ReactNode
    children?: Option[]
    isLeaf?: boolean
    loading?: boolean
    disabled?: boolean
}

// 主题域查询参数
const CommonParams = {
    is_all: false,
    limit: 2000,
    type: BusinessDomainType.subject_domain_group,
}

interface ICascaderDomain {
    width?: string | number
    value?: any
    disabled?: boolean
    placeholder?: React.ReactNode
    onChange?: (values, selectedOptions) => void
}
const CascaderDomain: React.FC<ICascaderDomain> = ({
    width,
    value,
    disabled,
    placeholder = __('请选择关联主题域'),
    onChange,
}) => {
    const [options, setOptions] = useState<Option[]>([])
    const [data, setData] = useState([])
    const [isInitLoading, setInitLoading] = useState<boolean>()

    // 默认回填数据
    useEffect(() => {
        if (value) {
            setData(value)
        }
    }, [value])

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

    // const getDomains = async () => {
    //     try {
    //         const res = await getDomainTree()
    //         setOptions([])
    //         if (res.entries?.[0]?.children?.length > 0) {
    //             setOptions([
    //                 getTitleNode(__('业务域')),
    //                 ...res.entries[0].children
    //                     .filter((first) => first?.children?.length > 0)
    //                     .map((first) => ({
    //                         label: first.name,
    //                         value: first.object_id,
    //                         children: [
    //                             getTitleNode(__('主题域')),
    //                             ...first.children.map((second) => {
    //                                 return {
    //                                     label: second.name,
    //                                     value: second.object_id,
    //                                 }
    //                             }),
    //                         ],
    //                     })),
    //             ])
    //         }
    //     } catch (error) {
    //         formatError(error)
    //     }
    // }

    /** 获取业务域列表 */
    const getBDDomains = async () => {
        try {
            setInitLoading(true)
            const res = await getSubjectDomain(CommonParams)
            setOptions([])
            if (res?.entries?.length) {
                setOptions([
                    getTitleNode(__('业务领域')),
                    ...(res.entries?.map((first: ISubjectDomainItem) => ({
                        label: first.name,
                        value: first.id,
                        isLeaf: false,
                    })) ?? []),
                ])
            }
        } catch (error) {
            formatError(error)
        }
        setInitLoading(false)
    }

    useEffect(() => {
        getBDDomains()
    }, [])

    const handleLoadData = async (selectedOptions: Option[]) => {
        const targetOption = selectedOptions[selectedOptions.length - 1]
        targetOption.loading = true
        if (targetOption.children?.length) {
            targetOption.loading = false
            return true
        }

        try {
            const res = await getSubjectDomain({
                ...CommonParams,
                type: BusinessDomainType.subject_domain,
                parent_id: targetOption.value as string,
            })

            targetOption.children = [
                getTitleNode(__('主题域')),
                ...(res?.entries?.length
                    ? (res?.entries || []).map((second) => ({
                          label: second.name,
                          value: second.id,
                          isLeaf: true,
                      }))
                    : [
                          {
                              label: (
                                  <div
                                      style={{
                                          color: 'rgba(0, 0, 0, 0.45)',
                                          fontSize: 12,
                                      }}
                                  >
                                      {__('暂无数据')}
                                  </div>
                              ),
                              value: undefined,
                              disabled: true,
                              isLeaf: true,
                          },
                      ]),
            ]

            targetOption.loading = false
            setOptions([...options])
            return true
        } catch (error) {
            formatError(error)
        }
        return false
    }

    const NotFoundContent = useCallback(
        () =>
            isInitLoading ? (
                <div style={{ padding: '10px 0' }}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.noData}>{__('暂无数据')}</div>
            ),
        [isInitLoading],
    )

    return (
        <Cascader
            className={styles.cascaderDomainWrapper}
            placeholder={placeholder}
            options={options}
            displayRender={(label, selectedOptions) => {
                if (typeof data === 'string') {
                    return data
                }
                return selectedOptions?.[1]?.label
            }}
            style={{ width: width || '100%' }}
            allowClear={false}
            value={data}
            loadData={handleLoadData}
            onChange={onChange}
            getPopupContainer={(node) => node.parentNode}
            disabled={disabled}
            notFoundContent={<NotFoundContent />}
        />
    )
}

export default CascaderDomain
