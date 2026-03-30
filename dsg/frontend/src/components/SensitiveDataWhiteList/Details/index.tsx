import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer, Space, Button } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import __ from '../locale'
import {
    formatError,
    getWhiteListDetails,
    getOrgMainBusinessList,
} from '@/core'
import { LabelTitle } from '@/components/BusinessTagClassify/helper'
import { detailsInfo } from '../const'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'

interface IDetails {
    open: boolean
    onClose: () => void
    style?: any
    id: any
}

const Details = (props: IDetails, ref) => {
    const { open, onClose, style, id } = props
    const formRef: any = useRef()
    const [detailsData, setDetailsData] = useState<any[]>([])
    const [detailsInfoData, setDetailsInfoData] = useState<any[]>([])
    const [mainBussinessData, setMainBussinessData] = useState<any[]>([])
    const [detailsInfos, setDetailsInfos] = useState<any>()
    const [dataViewDetailsOpen, setDataViewDetailsOpen] =
        useState<boolean>(false)

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id])

    const getDetails = async () => {
        try {
            const res = await getWhiteListDetails(id)
            setDetailsInfos(res)
            setDetailsInfoData(
                detailsInfo?.map((item) => {
                    return {
                        ...item,
                        list: item.list.map((it) => {
                            let value = res[it.key]
                            if (
                                it.key === 'created_at' ||
                                it.key === 'updated_at'
                            ) {
                                value = res?.[it.key]
                                    ? moment(res?.[it.key]).format(
                                          'YYYY-MM-DD HH:mm:ss',
                                      )
                                    : ''
                            }
                            return {
                                ...it,
                                value,
                            }
                        }),
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        }
    }

    const toDataViewDetails = () => {
        setDataViewDetailsOpen(true)
    }

    return (
        <div>
            <Drawer
                title={__('策略详情')}
                placement="right"
                onClose={onClose}
                open={open}
                width={1024}
                bodyStyle={{
                    padding: '16px 24px',
                }}
                push={false}
                destroyOnClose
                zIndex={999}
            >
                <div className={styles.detailsWrapper}>
                    {detailsInfoData.map((item) => {
                        return (
                            <div
                                key={item.key}
                                style={{ marginBottom: '20px' }}
                            >
                                <LabelTitle label={item.title} />
                                {item.list.map((it) => {
                                    return (
                                        <div
                                            className={
                                                styles['detail-basic-row']
                                            }
                                            key={it.key}
                                        >
                                            <div
                                                className={
                                                    styles['detail-basic-lable']
                                                }
                                            >
                                                {it.label}：
                                            </div>
                                            <div
                                                className={
                                                    styles['detail-basic-text']
                                                }
                                            >
                                                {it.value || '--'}
                                            </div>
                                        </div>
                                    )
                                })}
                                {item.hasDetailsBtn && (
                                    <a
                                        style={{
                                            marginTop: '12px',
                                            display: 'flex',
                                        }}
                                        onClick={() => toDataViewDetails()}
                                    >
                                        {__('查看库表')}
                                    </a>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Drawer>
            {dataViewDetailsOpen && (
                <LogicViewDetail
                    open={dataViewDetailsOpen}
                    onClose={() => {
                        setDataViewDetailsOpen(false)
                    }}
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: 0,
                    }}
                    id={detailsInfos?.form_view_id || ''}
                    // isIntroduced
                    isAudit
                />
            )}
        </div>
    )
}

export default Details
