import React, { memo, useState } from 'react'
import { Tooltip, Space } from 'antd'
import moment from 'moment'
import { DownloadOutlined, RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import {
    DepartmentOutlined,
    DatasheetViewColored,
    InterfaceOutlined,
    ThemeOutlined,
} from '@/icons'
import { AssetType } from '../../const'
import styles from './styles.module.less'
import __ from '../../locale'
import DataDownloadConfig from '@/components/DataAssetsCatlg/DataDownloadConfig'
import { useCongSearchContext } from '../../CogSearchProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface ILogicViewItem {
    item: any
    isCongSearch?: boolean
    // 当前项是否被选中
    isSelected?: boolean
    // 关闭详情弹窗
    onCloseDetail: () => void
    // 点击确认 申请API 弹窗
    confirmApplyApplication?: () => void
    onItemClick?: (asset: any, st: AssetType) => void
    onGraphClick?: (asset: any) => void
}

const LogicViewItem: React.FC<ILogicViewItem> = ({
    item,
    isCongSearch,
    onCloseDetail,
    confirmApplyApplication,
    onItemClick,
    onGraphClick,
    isSelected = false,
}: ILogicViewItem) => {
    const [downloadOpen, setDownloadOpen] = useState(false)

    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [applyOpen, setApplyOpen] = useState<boolean>(false)
    const [selectedRescId, setSelectedRescId] = useState<string>('')
    const [openStatus, setOpenStatus] = useState<boolean>(false)
    // useCogAsstContext 已移除，相关功能已下线
    const { bigHeader } = useCongSearchContext()
    const [userId] = useCurrentUser('ID')

    const attr = 'id'

    const handleClickItem = (e) => {
        setSelectedRescId(item?.[attr])
        onItemClick?.(item, AssetType.LOGICVIEW)
    }

    const handleApplyAPI = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedRescId(item?.[attr])
        setApplyOpen(true)
    }

    const handleAuthInfo = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedRescId(item?.[attr])
        setAuthInfoOpen(true)
    }

    const handleColseDetail = () => {
        setOpenStatus(false)
        // 提交申请后，更新列表状态
        onCloseDetail()
    }

    const handleConfirmApplyApplication = () => {
        confirmApplyApplication?.()
        setApplyOpen(false)
    }

    return (
        <>
            <div
                className={classnames(
                    styles.rescItem,
                    isSelected && styles.selRescItem,
                )}
                onClick={handleClickItem}
            >
                <div className={styles.nameContent}>
                    {/* {item?.type === AssetType.INTERFACE ? (
                        <InterfaceColored className={styles.itemIcon} />
                    ) : (
                        <DatasheetViewColored className={styles.itemIcon} />
                    )} */}
                    <DatasheetViewColored className={styles.itemIcon} />

                    {/* <div className={styles.nameContent}>
                    </div> */}
                    <div
                        title={item?.raw_title}
                        className={styles.name}
                        dangerouslySetInnerHTML={{
                            __html: item?.title,
                        }}
                    />
                    <span
                        className={styles.recDetail}
                        onClick={(e) => {
                            onGraphClick?.(item)
                            e.stopPropagation()
                        }}
                        hidden={!isCongSearch}
                    >
                        <div>{__('推荐详情')}</div>
                        <RightOutlined style={{ fontSize: '14px' }} />
                    </span>
                    <div className={styles.nameBtn}>
                        {item?.has_permission &&
                            (item?.type === AssetType.INTERFACESVC ? (
                                <Tooltip title={__('调用信息')}>
                                    <InterfaceOutlined
                                        className={styles.itemOprIcon}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setSelectedRescId(item.id)
                                            setAuthInfoOpen(true)
                                        }}
                                    />
                                </Tooltip>
                            ) : (
                                <Tooltip title={__('创建下载任务')}>
                                    <DownloadOutlined
                                        className={styles.itemOprIcon}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setSelectedRescId(item.id)
                                            setDownloadOpen(true)
                                        }}
                                    />
                                </Tooltip>
                            ))}
                        {/* {(item.owner_id === userId ||
                            item.available_status === '1') &&
                            [
                                OnlineStatus.ONLINE,
                                OnlineStatus.DOWN_AUDITING,
                                OnlineStatus.DOWN_REJECT,
                            ].includes(item.online_status) && (
                                <Tooltip
                                    placement="bottomRight"
                                    arrowPointAtCenter
                                    title={chatTip()}
                                    getPopupContainer={(n) => n}
                                >
                                    <FontIcon
                                        name="icon-yinyong1"
                                        className={classnames(
                                            styles.itemOprIcon,
                                            !llm && styles.itemOprDiabled,
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (!llm) return
                                            updateParams(
                                                CogAParamsType.Resource,
                                                {
                                                    data: [
                                                        {
                                                            id: item.id,
                                                            name: item.raw_title,
                                                            type: item.type,
                                                        },
                                                    ],
                                                    op: 'add',
                                                    event: e,
                                                },
                                            )
                                            onOpenAssistant()
                                        }}
                                    />
                                </Tooltip>
                            )} */}
                    </div>
                </div>
                <div
                    title={item?.raw_description || '--'}
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                        __html: `${__('描述：')}${item.description || '--'}`,
                    }}
                />
                <div className={styles.filedInfoWrapper}>
                    <div className={styles.fieldTitle}>
                        {item?.type === AssetType.LOGICVIEW
                            ? __('字段信息:')
                            : __('出参字段:')}
                    </div>
                    <Space size={4} className={styles.fieldTagWrapper}>
                        {item?.fields?.length
                            ? item?.fields
                                  ?.slice(0, 4)
                                  ?.map((fItem: any, idx) => (
                                      <div
                                          key={idx}
                                          className={styles.fieldTag}
                                          title={
                                              `${fItem?.raw_field_name_zh}${fItem?.raw_field_name_en}` ||
                                              '--'
                                          }
                                          dangerouslySetInnerHTML={{
                                              __html:
                                                  `${fItem?.field_name_zh}${fItem?.field_name_en}` ||
                                                  '--',
                                          }}
                                      />
                                  ))
                            : '--'}
                    </Space>
                </div>
                <div className={styles.otherInfo}>
                    <div>
                        {`${__('发布时间')} ${
                            item?.published_at
                                ? moment(item?.published_at).format(
                                      'YYYY-MM-DD',
                                  )
                                : '--'
                        }`}
                    </div>

                    <div className={styles.line} />
                    <div className={styles.itemOtherInfoWrapper}>
                        <div className={styles.itemOtherInfo}>
                            <Tooltip
                                // title={__('所属主题：${text}', {
                                //     text: item?.subject_domain_path || '--',
                                // })}
                                title={
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: __('所属主题：${text}', {
                                                text:
                                                    item?.subject_domain_name ||
                                                    '--',
                                            }),
                                        }}
                                    />
                                }
                                className={styles.toolTip}
                            >
                                <div className={styles.icon}>
                                    <ThemeOutlined />
                                </div>
                                <div
                                    className={styles.infoContent}
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            item?.subject_domain_name || '--',
                                    }}
                                />
                            </Tooltip>
                        </div>
                        <div className={styles.itemOtherInfo}>
                            <Tooltip
                                title={
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: __('所属部门：${text}', {
                                                text:
                                                    item?.department_path ||
                                                    '--',
                                            }),
                                        }}
                                    />
                                }
                                className={styles.toolTip}
                            >
                                <div className={styles.icon}>
                                    <DepartmentOutlined
                                        className={styles.commonIcon}
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </div>
                                <div
                                    className={styles.infoContent}
                                    dangerouslySetInnerHTML={{
                                        __html: item?.department_name || '--',
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
            {/* 下载 */}
            {downloadOpen && (
                <DataDownloadConfig
                    formViewId={item?.[attr]}
                    open={downloadOpen}
                    drawerStyle={{
                        position: 'fixed',
                        width: '100vw',
                        height: `calc(100vh - ${bigHeader ? 62 : 52}px)`,
                        top: bigHeader ? '62px' : '52px',
                        left: 0,
                        zIndex: 1001,
                    }}
                    onClose={() => {
                        setDownloadOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default memo(LogicViewItem)
