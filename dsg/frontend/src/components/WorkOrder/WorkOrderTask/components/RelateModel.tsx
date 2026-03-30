import React, { useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import {
    formatError,
    getCoreBusinesses,
    IBusinessDomainItem,
    ICoreBusinessItem,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import BusinessDomainTree from '@/components/BusiArchitecture/BusinessDomainTree'
import { UNGROUPED } from '@/components/BusiArchitecture/const'
import { ModelColored, NewCoreBizColored } from '@/icons'

interface IRelateModel {
    value?: any
    disabled?: boolean
    onChange?: (values) => void
}
const RelateModel: React.FC<IRelateModel> = ({ value, disabled, onChange }) => {
    const [coreBusinessList, setCoreBusinessList] = useState<any[]>([])
    const [data, setData] = useState(value)

    // 选择时回填数据
    useEffect(() => {
        if (value) {
            setData(value)
        }
    }, [value])

    useEffect(() => {
        getCoreBusinessList({
            getall: true,
        })
    }, [])

    const getCoreBusinessList = async (params = {}) => {
        try {
            const res = await getCoreBusinesses({
                offset: 1,
                limit: 2000,
                ...params,
            })
            setCoreBusinessList(
                res.entries.map((item) => ({
                    ...item,
                    name: (
                        <span>
                            <NewCoreBizColored className={styles.modelIcon} />
                            {item.name}
                        </span>
                    ),
                })),
            )
        } catch (error) {
            formatError(error)
            setCoreBusinessList([])
        }
    }
    useEffect(() => {
        getCoreBusinessList()
    }, [])

    const getSelectedKey = (selectedNode: IBusinessDomainItem) => {
        getCoreBusinessList({
            node_id: selectedNode.id === UNGROUPED ? '' : selectedNode.id,
            getall: !selectedNode.id,
        })
    }
    const handleChange = (e) => {
        setData(e)
        onChange?.(e)
    }

    const dropdownRender = (originNode) => {
        return (
            <div className={styles['relate-model-dropdown']}>
                <div className={styles.left}>
                    <div className={styles['dropdown-title']}>
                        {__('业务架构')}
                    </div>
                    <BusinessDomainTree
                        isShowSearch={false}
                        getSelectedKeys={getSelectedKey}
                    />
                </div>
                <div className={styles.right}>
                    <div className={styles['dropdown-title']}>
                        {__('业务模型')}
                    </div>
                    <div className={styles['model-wrapper']}>{originNode}</div>
                </div>
            </div>
        )
    }

    return (
        <Select
            disabled={disabled}
            value={data}
            options={coreBusinessList}
            fieldNames={{ label: 'name', value: 'id' }}
            placeholder={__('请选择关联业务模型')}
            notFoundContent={__('暂无数据')}
            getPopupContainer={(node) => node.parentNode}
            dropdownRender={dropdownRender}
            dropdownStyle={{ maxHeight: 300 }}
            onChange={handleChange}
            className={styles['relate-model']}
        />
    )
}

export default RelateModel
