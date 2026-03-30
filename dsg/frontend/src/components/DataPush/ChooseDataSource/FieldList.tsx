import { List } from 'antd'
import { memo, useEffect, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import __ from './locale'
import styles from './styles.module.less'
import { formatError, getDatasheetViewDetails } from '@/core'
import { cancelRequest } from '@/utils'
import FieldItem from './FieldItem'
import { stateType } from '@/components/DatasheetView/const'

interface IFieldList {
    resourceId?: string
}

/**
 * 字段属性列表
 */
function FieldList(props: Partial<IFieldList>) {
    const { resourceId } = props

    const [fetching, setFetching] = useState<boolean>(false)
    const [fieldsData, setFieldsData] = useState<any[]>([])
    const [resId, setResId] = useState<string>()

    useEffect(() => {
        if (resourceId) {
            if (resId) {
                cancelRequest(`/api/data-view/v1/form-view/${resId}`, 'get')
            }
            setResId(resourceId)
        } else {
            setFieldsData([])
        }
    }, [resourceId])

    useUpdateEffect(() => {
        if (resId) {
            getData(resId)
        }
    }, [resId])

    // 获取字段属性列表
    const getData = async (id: string) => {
        try {
            setFetching(true)
            const res = await getDatasheetViewDetails(id)
            setFieldsData(
                res?.fields?.filter(
                    (item) => item.status !== stateType.delete,
                ) || [],
            )
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    return (
        <div className={styles.fieldList}>
            <div className={styles.fieldList_title}>{__('字段预览：')}</div>
            <List
                loading={fetching}
                className={styles.fieldList_content}
                split={false}
                dataSource={fieldsData}
                renderItem={(item) => (
                    <List.Item>
                        <FieldItem data={item} />
                    </List.Item>
                )}
                locale={{
                    emptyText: (
                        <Empty
                            desc={
                                <div>
                                    {__('暂无数据')} <br />
                                    {__('选中库表可预览字段')}
                                </div>
                            }
                            iconSrc={dataEmpty}
                        />
                    ),
                }}
            />
        </div>
    )
}

export default memo(FieldList)
