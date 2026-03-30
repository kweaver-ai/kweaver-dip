import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { Drawer, Tabs } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import TabSimpleData from './TabSimpleData'
import TabColRow from './TabColRow'
import TabVisitor from './TabVisitor'
import { DataViewColored } from '@/icons'
import {
    AssetTypeEnum,
    formatError,
    getAuthRequest,
    getDatasheetViewDetails,
} from '@/core'
import { Loader } from '@/ui'

function DetailDialog({
    id,
    type,
    open,
    onCancel,
    showSampleData = false,
}: any) {
    const [loading, setLoading] = useState<boolean>(false)
    const [detail, setDetail] = useState<any>()
    const [data, setData] = useState<any>()
    const [activeKey, setActiveKey] = useState<string>('simpledata')
    const handleCancel = () => {
        onCancel()
    }

    useEffect(() => {
        setActiveKey(
            showSampleData
                ? 'simpledata'
                : type === 'data_view'
                ? 'visitors'
                : 'subview',
        )
    }, [showSampleData, type])

    const onLoad = async () => {
        try {
            setLoading(true)
            const ret = await getAuthRequest({
                id,
                reference: true,
                preview: showSampleData,
            })
            setData(ret)
            if (ret?.spec?.id) {
                const res = await getDatasheetViewDetails(ret?.spec?.id)
                setDetail(res)
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        onLoad()
    }, [id, showSampleData])

    const titleBox = useMemo(() => {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    columnGap: '8px',
                    fontSize: '16px',
                }}
            >
                <DataViewColored style={{ fontSize: '20px' }} />

                <div style={{ fontWeight: 'bold' }}>
                    {__('${type}权限申请详情', {
                        type:
                            type === 'data_view' ? __('库表') : __('库表行列'),
                    })}
                </div>
            </div>
        )
    }, [id])

    const contents = useMemo(() => {
        const previews = data?.preview
        const reference = data?.references
        const subView = data?.spec?.sub_views?.[0]
        const visitors =
            type === 'data_view' ? data?.spec?.policies : subView?.policies

        const dataObj: Record<string, ReactNode> = {
            visitors: (
                <TabVisitor
                    data={visitors}
                    reference={reference}
                    type={AssetTypeEnum.DataCatalog}
                />
            ),
        }
        if (showSampleData) {
            dataObj.simpledata = (
                <TabSimpleData data={previews} detail={detail} />
            )
        }

        if (type === 'sub_view') {
            dataObj.subview = (
                <TabColRow
                    data={subView?.spec}
                    fields={detail?.fields}
                    id={subView?.id}
                />
            )
        }

        return dataObj
    }, [type, data, detail, showSampleData])

    const items = useMemo(() => {
        const SimpleView = showSampleData
            ? [
                  {
                      label: '样例数据',
                      key: 'simpledata',
                  },
              ]
            : []

        const VisitorView = {
            label: '访问者列表',
            key: 'visitors',
        }

        if (type === 'data_view') {
            return [...SimpleView, VisitorView]
        }
        const SubView = {
            label: '行列规则',
            key: 'subview',
        }
        return [...SimpleView, SubView, VisitorView]
    }, [type, showSampleData])

    return (
        <Drawer
            placement="right"
            open={open}
            width="80%"
            zIndex={1001}
            maskClosable
            title={
                <div className={styles['drawer-header']}>
                    <div className={styles['drawer-header-title']}>
                        {titleBox}
                    </div>
                    <div className={styles['drawer-header-tabs']}>
                        {!loading && (
                            <Tabs
                                defaultActiveKey="simpledata"
                                onChange={(key) => setActiveKey(key)}
                                items={items}
                                centered
                            />
                        )}
                    </div>
                </div>
            }
            headerStyle={{ padding: '0 24px' }}
            onClose={handleCancel}
        >
            {loading ? (
                <div style={{ paddingTop: '20vh' }}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.modalContent}>
                    <div>{contents[activeKey]}</div>
                </div>
            )}
        </Drawer>
    )
}

export default DetailDialog
