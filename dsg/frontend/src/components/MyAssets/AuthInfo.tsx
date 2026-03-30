import React, { useEffect, useState, useContext } from 'react'
import { Modal, message, Tooltip, Button } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import {
    LeftOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
} from '@ant-design/icons'
import { AssetsInfoColored, CopyOutlined, DownloadOutlined } from '@/icons'
import styles from './styles.module.less'
import CustomDrawer from '../CustomDrawer'
import { DetailsLabel } from '@/ui'
import __ from './locale'
import {
    getApiApplyAuthInfo,
    formatError,
    getUrlByCommand,
    getMicroWidgetPlatform,
    MicroWidgetPlatformsType,
} from '@/core'
import { authInfoDetails } from './const'
import { getAuditStateLabel, getState } from '../ResourcesDir/helper'
import { copyToClipboard } from './helper'
import { downloadFileBlob, getActualUrl } from '@/utils'
import { MicroWidgetPropsContext } from '@/context'

interface IDataCatlgContent {
    open: boolean
    onClose: () => void
    title?: string
    id: string
}

const AuthInfo: React.FC<IDataCatlgContent> = ({
    open,
    onClose,
    title = __('调用信息'),
    id,
}) => {
    const [data, setData] = useState<any[]>(authInfoDetails)
    const [showSecret, setShowSecret] = useState<boolean>(false)
    const [showTips, setShowTips] = useState<boolean>(false)
    const [apiAuthInfoData, setApiAuthInfoData] = useState<any>()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // useCogAsstContext 已移除，相关功能已下线
    const modalIndex = 1000

    useEffect(() => {
        if (id) {
            toDetails()
        }
    }, [id])

    useEffect(() => {
        getApiAuthInfoData()
    }, [showSecret, showTips])

    const toDetails = async () => {
        try {
            const res = await getApiApplyAuthInfo(id)
            setApiAuthInfoData(res)
            getApiAuthInfoData(res)
        } catch (error) {
            formatError(error)
        }
    }

    const handleClickDownload = () => {
        let realIp
        // 如果AF作为插件集成到AS，则修改下载的真实地址未AF服务地址
        if (microWidgetProps?.config) {
            realIp = getUrlByCommand({ microWidgetProps })

            if (
                getMicroWidgetPlatform({ microWidgetProps }) ===
                MicroWidgetPlatformsType.Electron
            ) {
                realIp += '/anyfabric'
            }
        }

        downloadFileBlob({
            url: getActualUrl('/downloadFiles/接口调用文档.pdf', false),
            type: 'pdf',
            fileName: '接口调用文档',
            realIp,
        })
    }

    const getApiAuthInfoData = (res?: any) => {
        const resData = apiAuthInfoData || res
        if (!resData) {
            return
        }
        const dataList = authInfoDetails.map((item) => {
            const { key } = item
            switch (key) {
                case 'service_address':
                case 'app_id':
                case 'app_secret':
                    return {
                        ...item,
                        render: () => (
                            <div className={styles.copyBox}>
                                <span
                                    className={styles.copyText}
                                    title={
                                        (key === 'service_address' &&
                                            resData[key]) ||
                                        ''
                                    }
                                >
                                    {key === 'app_secret'
                                        ? showSecret
                                            ? resData[key]
                                            : new Array(resData[key].length)
                                                  .fill('*')
                                                  .join('')
                                        : resData[key]}
                                </span>
                                {key === 'app_secret' && (
                                    <Tooltip
                                        placement="bottom"
                                        title={
                                            showSecret
                                                ? __('隐藏密钥')
                                                : __('展示密钥')
                                        }
                                        open={showTips}
                                    >
                                        <Button
                                            className={styles.copyIcon}
                                            onClick={() => {
                                                setShowTips(false)
                                                setShowSecret(!showSecret)
                                            }}
                                            type="text"
                                            onMouseEnter={() =>
                                                setShowTips(true)
                                            }
                                            onMouseLeave={() =>
                                                setShowTips(false)
                                            }
                                        >
                                            {showSecret ? (
                                                <EyeOutlined />
                                            ) : (
                                                <EyeInvisibleOutlined />
                                            )}
                                        </Button>
                                    </Tooltip>
                                )}
                                <Tooltip placement="bottom" title={__('复制')}>
                                    <span
                                        className={styles.copyIcon}
                                        onClick={() => {
                                            copyToClipboard(resData[key])
                                            message.success(__('复制成功'))
                                        }}
                                    >
                                        <CopyOutlined />
                                    </span>
                                </Tooltip>
                            </div>
                        ),
                    }
                case 'expired_time':
                    return {
                        ...item,
                        value: !resData[key] ? __('永久') : resData[key],
                    }
                default:
                    return {
                        ...item,
                        value: resData[key],
                    }
            }
        })
        setData(dataList)
    }

    return (
        <div>
            <Modal
                title={title}
                width={800}
                open={open}
                onOk={onClose}
                onCancel={onClose}
                footer={null}
                className={styles.detailsWrapper}
                zIndex={modalIndex + 1}
            >
                <div className={styles.detailsBox}>
                    <div
                        className={classnames(
                            styles.infoContent,
                            styles.authInfoContent,
                        )}
                    >
                        <DetailsLabel detailsList={data} labelWidth="120px" />
                        <div className={styles.download}>
                            <div>接口文档:</div>
                            <div>
                                {apiAuthInfoData ? (
                                    <Button type="default">
                                        <span onClick={handleClickDownload}>
                                            <DownloadOutlined />
                                            下载
                                        </span>
                                    </Button>
                                ) : (
                                    <div style={{ paddingLeft: '8px' }}>--</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default AuthInfo
