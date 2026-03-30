import React, { useContext, useEffect, useState } from 'react'
import { Collapse } from 'antd'
import {
    AssetTypeEnum,
    IPolicyInfo,
    ISubView,
    formatError,
    policyDetail,
} from '@/core'
import styles from './styles.module.less'
import { ColAndRowColored } from '@/icons'
import { AccessUserItem } from '.'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { MicroWidgetPropsContext } from '@/context'
import __ from '../../locale'

const { Panel } = Collapse

const ViewTitle = ({ title }: { title: string }) => {
    return (
        <div className={styles['subview-title']}>
            <ColAndRowColored className={styles.icon} />
            <span className={styles.title} title={title}>
                {title}
            </span>
        </div>
    )
}

function SubDimAccess({
    id,
    ownerId,
    userId,
    subDims,
}: {
    id: string
    ownerId: string
    userId: string
    subDims: ISubView[]
}) {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [access, setAccess] = useState<Record<string, any[]>>({})
    const [loading, setLoading] = useState<boolean>(false)
    const [currentId, setCurrentId] = useState<string>()

    useEffect(() => {
        if (subDims?.length) {
            // 默认展开加载第一项
            getAccess(subDims?.[0]?.id)
            setCurrentId(subDims?.[0]?.id)
        }
    }, [subDims])

    const getAccess = async (rid: string) => {
        try {
            setLoading(true)
            const ret: IPolicyInfo = await policyDetail(rid, AssetTypeEnum.Dim)
            // userId排前列
            const sortList = (ret?.subjects || []).sort((o) =>
                o.subject_id !== userId ? 1 : -1,
            )

            setAccess((prev) => ({
                ...prev,
                [rid]: sortList,
            }))
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    const handleOpen = (key: string) => {
        setCurrentId(key)
        if (key && !access[`${key}`]) {
            // 加载权限信息
            getAccess(key)
        }
    }

    return (
        <div className={styles['subview-access']}>
            {!subDims?.length ? (
                <div style={{ marginTop: '60px' }}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无维度规则')} />
                </div>
            ) : (
                <Collapse
                    activeKey={currentId || ''}
                    accordion
                    ghost
                    onChange={(k) => handleOpen(k as string)}
                >
                    {subDims?.map((view) => (
                        <Panel
                            header={<ViewTitle title={view?.name} />}
                            key={view?.id}
                        >
                            <div className={styles['subview-access-item']}>
                                {loading && view?.id === currentId ? (
                                    <div style={{ marginTop: '20px' }}>
                                        <Loader />
                                    </div>
                                ) : access?.[view?.id]?.filter(
                                      (o) => o.subject_id !== ownerId,
                                  )?.length ? (
                                    access[view?.id]
                                        ?.filter(
                                            (o) => o.subject_id !== ownerId,
                                        )
                                        ?.map((item) => (
                                            <AccessUserItem
                                                key={item.subject_id}
                                                item={item}
                                                isMe={
                                                    item.subject_id === userId
                                                }
                                            />
                                        ))
                                ) : (
                                    <div className={styles.empty}>
                                        {__('暂未添加访问者')}
                                    </div>
                                )}
                            </div>
                        </Panel>
                    ))}
                </Collapse>
            )}
        </div>
    )
}

export default SubDimAccess
