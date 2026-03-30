import React, { memo, useState } from 'react'
import { Tooltip, Space } from 'antd'
import moment from 'moment'
import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { noop } from 'lodash'
import { DepartmentOutlined, ThemeOutlined } from '@/icons'
import { AssetType } from '../../const'
import styles from './styles.module.less'
import __ from '../../locale'
import DataDownloadConfig from '@/components/DataAssetsCatlg/DataDownloadConfig'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface IIndicatorItem {
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
    onNameClick?: (e: any, asset: any) => void
}

const IndicatorItem: React.FC<IIndicatorItem> = ({
    item,
    isCongSearch,
    onCloseDetail,
    confirmApplyApplication,
    onItemClick,
    onGraphClick,
    isSelected = false,
    onNameClick = noop,
}: IIndicatorItem) => {
    const [downloadOpen, setDownloadOpen] = useState(false)

    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [applyOpen, setApplyOpen] = useState<boolean>(false)
    const [selectedRescId, setSelectedRescId] = useState<string>('')
    const [openStatus, setOpenStatus] = useState<boolean>(false)
    // useCogAsstContext 已移除，相关功能已下线
    const [userId] = useCurrentUser('ID')

    const attr = 'id'

    // 当点击某个条目时触发此函数，以更新选中的资源ID，并调用点击事件处理函数
    const handleClickItem = (e) => {
        // 更新选中的资源ID为当前点击的条目的特定属性值
        setSelectedRescId(item?.[attr])
        // 调用条目点击事件处理函数，传递当前点击的条目和资源类型
        onItemClick?.(item, AssetType.INDICATOR)
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
                    <div className={styles.iconContainer}>
                        <IndicatorManagementOutlined
                            style={{
                                color: '#fff',
                                fontSize: 20,
                            }}
                        />
                    </div>

                    <div className={styles.nameContent}>
                        <div
                            title={item?.raw_title}
                            className={styles.name}
                            dangerouslySetInnerHTML={{
                                __html: item?.title,
                            }}
                            onClick={(e) => {
                                onNameClick(e, item)
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
                    </div>
                    {/* <div className={styles.nameBtn}>
                        {(item.owner_id === userId ||
                            item.available_status === '1') && (
                            <Tooltip
                                placement="bottomRight"
                                arrowPointAtCenter
                                title={chatTip()}
                                getPopupContainer={(n) => n}
                            >
                                <FontIcon
                                    name="icon-yinyong1"
                                    className={styles.itemOprIcon}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (!llm) return
                                        updateParams(CogAParamsType.Resource, {
                                            data: [
                                                {
                                                    id: item.id,
                                                    name: item.raw_title,
                                                    type: item.type,
                                                    indicator_type:
                                                        item?.indicator_type,
                                                },
                                            ],
                                            op: 'add',
                                            event: e,
                                        })
                                        onOpenAssistant()
                                    }}
                                />
                            </Tooltip>
                        )}
                    </div> */}
                </div>
                <div
                    title={item?.raw_description || __('[暂无说明]')}
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                        __html: item?.description || __('[暂无说明]'),
                    }}
                />
                <div className={styles.filedInfoWrapper}>
                    <div className={styles.fieldTitle}>{__('分析维度:')}</div>
                    <Space size={4} className={styles.fieldTagWrapper}>
                        {item?.fields?.length
                            ? item?.fields
                                  ?.slice(0, 3)
                                  ?.map((fItem: any, idx) => (
                                      <div
                                          key={idx}
                                          className={styles.fieldTag}
                                          title={
                                              `${fItem?.raw_field_name_zh}${fItem?.field_name_en}` ||
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
                        {`${__('上线时间')} ${
                            item?.online_at
                                ? moment(item?.online_at).format('YYYY-MM-DD')
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
                        height: 'calc(100vh - 52px)',
                        top: 52,
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

export default memo(IndicatorItem)
