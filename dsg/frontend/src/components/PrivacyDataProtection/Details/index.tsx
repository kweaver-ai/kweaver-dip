import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer, Space, Button, DrawerProps } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import __ from '../locale'
import { formatError, getDataPrivacyPolicyDetails } from '@/core'
import { LabelTitle } from '@/components/BusinessTagClassify/helper'
import { detailsInfo } from '../const'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import PrivacyTable from '../Create/PrivacyTable'

interface IDetails {
    open: boolean
    onClose: () => void
    style?: any
    id: any
    getContainer?: DrawerProps['getContainer']
    mask?: boolean
    zIndex?: number
}

const Details = (props: IDetails, ref) => {
    const {
        open,
        onClose,
        style,
        id,
        getContainer,
        mask = true,
        zIndex = 999,
    } = props
    const formRef: any = useRef()
    const [detailsData, setDetailsData] = useState<any[]>([])
    const [detailsInfoData, setDetailsInfoData] = useState<any[]>([])
    const [mainBussinessData, setMainBussinessData] = useState<any[]>([])
    const [detailsInfos, setDetailsInfos] = useState<any>()
    const [dataViewDetailsOpen, setDataViewDetailsOpen] =
        useState<boolean>(false)
    const [privacyTableData, setPrivacyTableData] = useState<any[]>([])

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id])

    const getDetails = async () => {
        try {
            const res = await getDataPrivacyPolicyDetails(id)
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
            setPrivacyTableData(res?.field_list || [])
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
                getContainer={getContainer}
                mask={mask}
                bodyStyle={{
                    padding: '16px 24px',
                }}
                push={false}
                destroyOnClose
                zIndex={zIndex}
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
                                {item.key === 'config' ? (
                                    <PrivacyTable
                                        isDetails
                                        dataSource={privacyTableData}
                                        onChange={(o) => setPrivacyTableData(o)}
                                    />
                                ) : null}
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
                    id={detailsInfos?.form_view_id || id}
                    // isIntroduced
                    isAudit
                />
            )}
        </div>
    )
}

export default Details
