import React, { useEffect, useRef, useState } from 'react'
import { Drawer, Tooltip, Button } from 'antd'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { RightOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from '../locale'
import {
    ITagCategoryRes,
    formatError,
    getTagCategoryDetailsByType,
    TagDetailsType,
    ITagCategoryDetails,
    getDataDictsByType,
} from '@/core'
import {
    detailsInfo,
    stateLableType,
    publishStatus,
    publishStatusList,
    moreInfo,
} from '../const'
import { getState } from '@/components/BusinessDiagnosis/helper'
import { StateLabel, LabelTitle } from '../helper'
import TagClassifyCard from '../TagClassifyCard'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface ITagDetails {
    open: boolean
    onClose: () => void
    style?: any
    id: any
    type?: TagDetailsType
    showUpdateInfo?: boolean
    showTreeInfo?: boolean
    showAuditInfo?: boolean
    showAuditButton?: boolean
}

const TagDetails = (props: ITagDetails, ref) => {
    const {
        open,
        onClose,
        style,
        id,
        type = TagDetailsType.classify,
        showUpdateInfo,
        showTreeInfo,
        showAuditInfo,
        showAuditButton,
    } = props

    const navigator = useNavigate()
    const [detailsData, setDetailsData] = useState<any[]>([])
    const [moreInfoData, setMoreInfoData] = useState<any[]>([])
    const [detailsInfos, setDetailsInfos] = useState<ITagCategoryDetails>()

    useEffect(() => {
        if (detailsInfos?.label_category_resp?.id) {
            const details = detailsInfos?.label_category_resp
            const list = [
                { title: `${__('标签类型')}：`, key: 'name' },
                ...detailsInfo.map((item) => ({
                    ...item,
                    title:
                        item.key === 'description'
                            ? `${__('用途描述')}：`
                            : item.title,
                })),
                {
                    title: __('适用对象：'),
                    key: 'range_type_list',
                },
            ].map((item) => {
                const obj = {
                    ...item,
                    value: details[item.key] || '--',
                }
                if (item.key === 'audit_status') {
                    obj.value = getState(details[item.key], publishStatusList)
                }
                if (item.key === 'state') {
                    obj.value = <StateLabel state={details[item.key]} />
                }
                if (item.key === 'range_type_list') {
                    obj.value = (
                        <div>
                            {details[item.key]?.map((info) => {
                                return (
                                    <span className={styles.tag}>{info}</span>
                                )
                            })}
                        </div>
                    )
                }
                return obj
            })
            setDetailsData(list)
            const moreInfoList = moreInfo.map((item) => {
                const obj = {
                    ...item,
                    value: details[item.key] || '--',
                }
                if (item.key === 'created_at' || item.key === 'updated_at') {
                    obj.value = moment(details[item.key]).format(
                        'YYYY-MM-DD HH:mm:ss',
                    )
                }
                return obj
            })
            setMoreInfoData(moreInfoList)
        }
    }, [detailsInfos])

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id])

    const getDetails = async () => {
        try {
            const res = await getTagCategoryDetailsByType({
                id,
                type,
                // is_draft: true,
            })
            let range_type_list = []
            const rangeTypeKeys =
                res?.label_category_resp?.range_type?.split(',')
            if (rangeTypeKeys?.length) {
                const dictRes = await getDataDictsByType(10)
                range_type_list = dictRes
                    .filter((info) => rangeTypeKeys.includes(info.key))
                    ?.map((info) => info.value)
            }
            if (res?.label_category_resp) {
                res.label_category_resp.range_type_list = range_type_list
            }
            setDetailsInfos(res)
        } catch (err) {
            formatError(err)
        }
    }

    const toAudit = () => {
        navigator(`/business-tag-auth?id=${id}`)
    }

    const empty = () => <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />

    return (
        <Drawer
            title={__('业务标签详情')}
            placement="right"
            onClose={onClose}
            open={open}
            width={683}
            style={style}
            destroyOnClose
        >
            <div className={styles.detailsWrapper}>
                <LabelTitle label={__('基本属性')} />
                <div className={styles['detail-basic']}>
                    {detailsData.map((item) => {
                        return (
                            <div
                                className={styles['detail-basic-row']}
                                key={item.key}
                            >
                                <div className={styles['detail-basic-lable']}>
                                    {item.title}
                                </div>
                                <div className={styles['detail-basic-text']}>
                                    {item.value}
                                </div>
                            </div>
                        )
                    })}
                </div>
                {showUpdateInfo && (
                    <>
                        <LabelTitle label={__('更新信息')} />
                        <div className={styles['detail-basic']}>
                            {moreInfoData.map((item) => {
                                return (
                                    <div
                                        className={styles['detail-basic-row']}
                                        key={item.key}
                                    >
                                        <div
                                            className={
                                                styles['detail-basic-lable']
                                            }
                                        >
                                            {item.title}
                                        </div>
                                        <div
                                            className={
                                                styles['detail-basic-text']
                                            }
                                        >
                                            {item.value}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
                {showTreeInfo && (
                    <>
                        <LabelTitle label={__('标签树')} />
                        <TagClassifyCard
                            item={detailsInfos}
                            onOperate={() => {}}
                            loading={false}
                            showTitle={false}
                        />
                    </>
                )}
                {showAuditInfo && (
                    <>
                        <LabelTitle
                            label={__('标签授权')}
                            suffix={
                                <div className={styles.lableSuffix}>
                                    <div style={{ color: 'rgb(0 0 0 / 45%)' }}>
                                        <span>{__('（被授权的')}</span>
                                        <Tooltip
                                            title={
                                                // __(
                                                //     '开发者使用应用账号完成认证后，可调用应用内提供的资源/标签的 OpenAPI 接口（使用这些接口需要先获取相关数据授权）。',
                                                // )
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: 550,
                                                        }}
                                                    >
                                                        {__('集成应用')}
                                                    </div>
                                                    <div>
                                                        {__(
                                                            '开发者使用应用账号完成认证后，可调用应用内提供的资源/标签的 OpenAPI 接口（使用这些接口需要先获取相关数据授权）。',
                                                        )}
                                                    </div>
                                                </div>
                                            }
                                            color="#fff"
                                            overlayInnerStyle={{
                                                color: 'rgba(0,0,0,0.85)',
                                                width: 600,
                                            }}
                                            placement="bottomRight"
                                        >
                                            <span
                                                style={{
                                                    textDecoration: 'underline',
                                                }}
                                            >
                                                {__('集成应用')}
                                            </span>
                                        </Tooltip>
                                        <span>{__('可以调用当前标签）')}</span>
                                    </div>
                                    {showAuditButton &&
                                        detailsInfos?.label_category_resp
                                            ?.audit_status ===
                                            publishStatus.Published && (
                                            <Button
                                                onClick={() => toAudit()}
                                                type="link"
                                                style={{ marginRight: '16px' }}
                                            >
                                                {__('去管理授权')}
                                            </Button>
                                        )}
                                </div>
                            }
                        />
                        <div>
                            {!detailsInfos?.category_apps_list_resp?.length
                                ? empty()
                                : detailsInfos?.category_apps_list_resp?.map(
                                      (info) => {
                                          return <div>{info.name}</div>
                                      },
                                  )}
                        </div>
                    </>
                )}
            </div>
        </Drawer>
    )
}

export default TagDetails
