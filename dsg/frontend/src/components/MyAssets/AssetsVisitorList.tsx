import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import classnames from 'classnames'
import { formatError, getAppsList, LoginPlatform } from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { useAssetsContext } from './AssetsVisitorProvider'
import styles from './styles.module.less'
import __ from './locale'
import { AssetVisitorTypes } from './const'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import AvailableAsset from './AvailableAsset'
import DragBox from '../DragBox'
import { getActualUrl, getPlatformNumber } from '@/utils'

interface IAssetsVisitorList {
    updateAssetList: (status: boolean) => void
}
const AssetsVisitorList: FC<IAssetsVisitorList> = ({ updateAssetList }) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [applications, setApplications] = useState<Array<any>>([])
    const [emptyStatus, setEmptyStatus] = useState<boolean>(true)
    const [defaultSize, setDefaultSize] = useState<Array<number>>([10, 90])
    const {
        selectedId,
        selectedType,
        updateSelectedId,
        updateSelectedType,
        isSystem,
        isAppDeveloper,
    } = useAssetsContext()
    const navigator = useNavigate()
    const platform = getPlatformNumber()

    useEffect(() => {
        if (isAppDeveloper) {
            getApplications()
        }
    }, [isAppDeveloper])

    useEffect(() => {
        if (!applications?.length) {
            setEmptyStatus(true)
        } else {
            setEmptyStatus(false)
        }
        if (isAppDeveloper) {
            if (!applications?.length) {
                updateAssetList(true)
            } else {
                updateAssetList(false)
            }
            updateSelectedId(applications[0]?.id)
            updateSelectedType(AssetVisitorTypes.APPLICATION)
        } else {
            updateSelectedType(AssetVisitorTypes.USER)
        }
    }, [applications, isAppDeveloper])

    const handleGoApplicationAuth = () => {
        if (platform === LoginPlatform.drmp) {
            window.open(
                getActualUrl('/applicationAuth/manage', true, 2),
                '_self',
            )
        } else {
            navigator('/applicationAuth/manage')
        }
    }

    const getApplications = async () => {
        try {
            setLoading(true)
            const res = await getAppsList({
                limit: 999,
                offset: 1,
                only_developer: true,
            })
            setApplications(res.entries)
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const renderEmpty = () => {
        return (
            <div style={{ marginTop: 120 }}>
                <Empty
                    desc={
                        <>
                            <div>{__('暂无可管理的应用和相关资源展示')}</div>
                            <div>
                                {__('进入')}
                                <Button
                                    type="link"
                                    onClick={handleGoApplicationAuth}
                                >
                                    {__('集成应用管理')}
                                </Button>
                                {__('可创建应用')}
                            </div>
                        </>
                    }
                    iconSrc={dataEmpty}
                    iconHeight="104px"
                />
            </div>
        )
    }

    return isAppDeveloper ? (
        <div className={styles.visitorContainer}>
            {/* {isVisitor && (
                    <>
                        <div
                            className={classnames(
                                styles.myAssets,
                                selectedType === AssetVisitorTypes.USER &&
                                    styles.selectedItem,
                            )}
                            onClick={() => {
                                updateSelectedId(undefined)
                                updateSelectedType(AssetVisitorTypes.USER)
                            }}
                        >
                            <FontIcon
                                name="icon-gerenziyuan"
                                type={IconType.COLOREDICON}
                                style={{ fontSize: '20px' }}
                            />
                            <span className={styles.text}>
                                {__('我的资源')}
                            </span>
                        </div>
                        <div className={styles.splitLine} />
                    </>
                )} */}

            {loading ? (
                <div className={styles.loadingContainer}>
                    <Loader />
                </div>
            ) : (
                <div
                    className={`${styles.visitorContainer} ${styles.isPersonalCenter}`}
                >
                    {emptyStatus ? (
                        renderEmpty()
                    ) : (
                        <DragBox
                            defaultSize={defaultSize}
                            minSize={[220, 500]}
                            maxSize={[480, Infinity]}
                            onDragEnd={(size) => {
                                setDefaultSize(size)
                            }}
                            rightNodeStyle={{ padding: '0 0 0 4px' }}
                        >
                            <div style={{ overflow: 'hidden' }}>
                                <div className={styles.title}>
                                    <span className={styles.titleText}>
                                        {__('可管理的应用')}
                                    </span>
                                    <Tooltip
                                        title={
                                            <div>
                                                <div>{__('管理应用')}</div>
                                                <div>
                                                    {__(
                                                        '增、删、改应用需要在后台操作',
                                                    )}
                                                </div>
                                            </div>
                                        }
                                        overlayInnerStyle={{
                                            color: 'rgba(0,0,0,0.85)',
                                        }}
                                        color="#fff"
                                        overlayStyle={{ maxWidth: 600 }}
                                        placement="topRight"
                                    >
                                        <SettingOutlined />
                                    </Tooltip>
                                </div>
                                <div className={styles.listContent}>
                                    {applications.map((item, index) => (
                                        <div
                                            key={index}
                                            className={classnames(
                                                styles.itemWrapper,
                                                selectedId === item.id &&
                                                    styles.selectedItem,
                                            )}
                                            onClick={() => {
                                                updateSelectedId(item.id)
                                                updateSelectedType(
                                                    AssetVisitorTypes.APPLICATION,
                                                )
                                            }}
                                        >
                                            <div className={styles.itemContent}>
                                                <div>
                                                    <FontIcon
                                                        name="icon-jichengyingyongguanli"
                                                        type={
                                                            IconType.COLOREDICON
                                                        }
                                                        className={styles.icon}
                                                    />
                                                </div>
                                                <div title={item.name}>
                                                    {item.name}
                                                </div>
                                            </div>
                                            {!item?.account_id && (
                                                <Tooltip
                                                    title={
                                                        isSystem
                                                            ? __(
                                                                  '缺少账户信息（可能未配置或在部署工作台被删除），当前应用无法正常使用，若需恢复可用，请进入“集成应用可用资源”配置账户信息。',
                                                              )
                                                            : __(
                                                                  '缺少账户信息（可能未配置或在部署工作台被删除），当前应用无法正常使用，若需恢复可用，请先联系“系统管理员”配置账户信息。',
                                                              )
                                                    }
                                                    overlayInnerStyle={{
                                                        color: 'rgba(0,0,0,0.85)',
                                                    }}
                                                    color="#fff"
                                                    overlayStyle={{
                                                        maxWidth: 600,
                                                    }}
                                                    placement="topRight"
                                                    arrowPointAtCenter
                                                >
                                                    <ExclamationCircleOutlined
                                                        className={
                                                            styles.errorWrapper
                                                        }
                                                    />
                                                </Tooltip>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.tableWrapper}>
                                <AvailableAsset isApplication />
                            </div>
                        </DragBox>
                    )}
                </div>
            )}
        </div>
    ) : null
}

export default AssetsVisitorList
