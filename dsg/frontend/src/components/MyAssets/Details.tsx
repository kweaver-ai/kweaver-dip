import React, { useEffect, useState } from 'react'
import { Typography, message, Tooltip } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import {
    LeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons'
import { AssetsInfoColored, CopyOutlined } from '@/icons'
import styles from './styles.module.less'
import CustomDrawer from '../CustomDrawer'
import { DetailsLabel } from '@/ui'
import __ from './locale'
import { getApplyAssetsDetails, formatError, getApiApplyDetails } from '@/core'
import {
    appAssetCatlgDetails,
    appAssetApiDetails,
    auditStateToNum,
} from './const'
import { getAuditStateLabel, getState } from '../ResourcesDir/helper'
import { copyToClipboard } from './helper'
import GlobalMenu from '../GlobalMenu'

const { Paragraph } = Typography

interface IDataCatlgContent {
    open: boolean
    onClose: () => void
    title?: string
    type?: 'catalog' | 'apiService'
    id: string
    getContainer?: HTMLElement | false
}

const Details: React.FC<IDataCatlgContent> = ({
    open,
    onClose,
    title = __('资源申请详情'),
    type = 'catalog',
    id,
    getContainer = false,
}) => {
    const [data, setData] = useState<any[]>([])
    const [showSecret, setShowSecret] = useState<boolean>(false)
    const [apiDetails, setApiDetails] = useState<any>()

    useEffect(() => {
        if (id) {
            if (type === 'catalog') {
                toDetails()
            } else {
                toApiServiceDetails()
            }
        }
    }, [id])

    useEffect(() => {
        getApiServiceDetailsData()
    }, [showSecret])

    const toDetails = async () => {
        try {
            const res = await getApplyAssetsDetails(id)

            const dataList = appAssetCatlgDetails.map((item) => {
                return {
                    ...item,
                    list: item.list.map((it) => {
                        const { key } = it
                        let infoList: any = []
                        switch (key) {
                            case 'apply_state':
                                return {
                                    ...it,
                                    render: () =>
                                        getAuditStateLabel(res.apply_state, 0),
                                }
                            case 'apply_created_at':
                                return {
                                    ...it,
                                    render: () =>
                                        moment(res.apply_created_at)?.format(
                                            'YYYY-MM-DD HH:mm:ss',
                                        ),
                                }
                            case 'apply_days':
                                return {
                                    ...it,
                                    value: `${res[key]}${__('天')}`,
                                }
                            case 'asset_state':
                                return {
                                    ...it,
                                    render: () => getState(res[key]),
                                }
                            case 'apply_orgs':
                                return {
                                    ...it,
                                    value: res[key]?.map((ele) => ele.org_name),
                                }
                            case 'apply_reason':
                                return {
                                    ...it,
                                    render: () => (
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: res[key],
                                            }}
                                        />
                                    ),
                                }
                            case 'asset_infos':
                                infoList = res[key]?.find(
                                    (ele) => ele.info_type === 4,
                                )?.entries
                                return {
                                    ...it,
                                    value: infoList?.map(
                                        (ele) => ele.info_value,
                                    ),
                                }
                            default:
                                return {
                                    ...it,
                                    value: res[key],
                                }
                        }
                    }),
                }
            })
            setData(dataList)
        } catch (error) {
            formatError(error)
        }
    }

    const toApiServiceDetails = async () => {
        try {
            const { app, service_apply, service_info } =
                await getApiApplyDetails(id)
            const res = {
                ...app,
                ...service_info,
                ...service_apply,
                department: service_info?.org_name,
            }
            await setApiDetails(res)
            getApiServiceDetailsData(res)
        } catch (error) {
            formatError(error)
        }
    }

    const getApiServiceDetailsData = (res?: any) => {
        const resData = apiDetails || res
        if (!resData) {
            return
        }
        const dataList = appAssetApiDetails.map((item) => {
            return {
                ...item,
                list: item.list.map((it) => {
                    const { key } = it
                    switch (key) {
                        case 'audit_status':
                            return {
                                ...it,
                                render: () =>
                                    getAuditStateLabel(
                                        auditStateToNum[resData.audit_status],
                                        0,
                                    ),
                            }
                        case 'apply_days':
                            return {
                                ...it,
                                value:
                                    resData[key] === 0
                                        ? __('永久')
                                        : `${resData[key]}${__('天')}`,
                            }
                        case 'apply_reason':
                            return {
                                ...it,
                                render: () => (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: resData[key]?.replace(
                                                /\n/g,
                                                '<br>',
                                            ),
                                        }}
                                    />
                                ),
                            }
                        case 'service_address':
                        case 'app_id':
                        case 'app_secret':
                            return {
                                ...it,
                                // 只有审核通过才显示 app_id,app_secret
                                hidden:
                                    key !== 'service_address' &&
                                    resData.audit_status !== 'pass',
                                render: () => (
                                    <div className={styles.copyBox}>
                                        <span
                                            className={styles.copyText}
                                            title={
                                                key === 'service_path' &&
                                                resData[key]
                                            }
                                        >
                                            {key === 'app_secret'
                                                ? showSecret
                                                    ? resData[key]
                                                    : new Array(
                                                          resData[key].length,
                                                      )
                                                          .fill('*')
                                                          .join('')
                                                : resData[key]}
                                        </span>
                                        {key === 'app_secret' && (
                                            <span
                                                className={styles.copyIcon}
                                                onClick={() => {
                                                    setShowSecret(!showSecret)
                                                }}
                                            >
                                                {showSecret ? (
                                                    <EyeOutlined />
                                                ) : (
                                                    <EyeInvisibleOutlined />
                                                )}
                                            </span>
                                        )}
                                        <Tooltip
                                            placement="bottom"
                                            title={__('复制')}
                                        >
                                            <span
                                                className={styles.copyIcon}
                                                onClick={() => {
                                                    copyToClipboard(
                                                        resData[key],
                                                    )
                                                    message.success(
                                                        __('复制成功'),
                                                    )
                                                }}
                                            >
                                                <CopyOutlined />
                                            </span>
                                        </Tooltip>
                                    </div>
                                ),
                            }
                        default:
                            return {
                                ...it,
                                value: resData[key],
                            }
                    }
                }),
            }
        })
        setData(dataList)
    }

    return (
        <CustomDrawer
            open={open}
            isShowFooter={false}
            bodyStyle={{
                padding: 0,
                background: 'rgba(240, 242, 246, 1)',
            }}
            customHeaderStyle={{ display: 'none' }}
            customBodyStyle={{ height: '100%' }}
            style={{
                position: 'fixed',
                width: '100vw',
                height: '100vh',
            }}
            getContainer={getContainer}
        >
            <div className={styles.detailsWrapper}>
                <div className={styles.detailsBox}>
                    <div className={styles.detailsTitle}>
                        <GlobalMenu />
                        <span className={styles.detailsBack} onClick={onClose}>
                            <LeftOutlined className={styles.titleIcon} />
                            {title}
                        </span>
                    </div>
                    <div className={styles.infoContent}>
                        {data.map((item, index) => {
                            return (
                                <div key={item.key} className={styles.infoBox}>
                                    <div className={styles.infotitle}>
                                        <span className={styles.infotitleLabel}>
                                            <AssetsInfoColored
                                                className={styles.infoIcon}
                                            />
                                            {item.label}
                                        </span>
                                    </div>
                                    <div
                                        className={classnames(
                                            styles.detailsLabelBox,
                                            index === 1 && styles.secLine,
                                            type === 'apiService' &&
                                                index === 1 &&
                                                styles.apiSecLine,
                                        )}
                                    >
                                        {item.key === 'assetInfo' &&
                                        type === 'apiService' ? (
                                            <div className={styles.apiInfoBox}>
                                                <div
                                                    className={
                                                        styles.apiInfoTitle
                                                    }
                                                >
                                                    {__('基本信息')}
                                                </div>
                                                <DetailsLabel
                                                    detailsList={item.list.filter(
                                                        (it) => {
                                                            return (
                                                                it.type ===
                                                                'basic'
                                                            )
                                                        },
                                                    )}
                                                    labelWidth="120px"
                                                />
                                                <div
                                                    className={
                                                        styles.apiInfoTitle
                                                    }
                                                >
                                                    {__('服务定义')}
                                                </div>
                                                <DetailsLabel
                                                    detailsList={item.list.filter(
                                                        (it) =>
                                                            it.type !== 'basic',
                                                    )}
                                                    labelWidth="120px"
                                                />
                                            </div>
                                        ) : (
                                            <DetailsLabel
                                                detailsList={item.list}
                                                labelWidth="120px"
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </CustomDrawer>
    )
}

export default Details
