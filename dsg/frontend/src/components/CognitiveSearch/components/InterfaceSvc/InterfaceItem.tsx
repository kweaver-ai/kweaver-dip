import * as React from 'react'
import { memo, useMemo, useState } from 'react'
import { Tooltip, Space } from 'antd'
import moment from 'moment'
import { RightOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { useQuery } from '@/utils'
import {
    DepartmentOutlined,
    ThemeOutlined,
    InterfaceColored,
    InterfaceOutlined,
} from '@/icons'
import { AssetType } from '../../const'
import AuthInfo from '@/components/MyAssets/AuthInfo'
import styles from './styles.module.less'
import __ from '../../locale'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface IInterfaceItem {
    item: any
    isCongSearch?: boolean
    // 当前项是否被选中
    isSelected?: boolean
    // 关闭详情弹窗
    onCloseDetail: () => void
    // 点击确认 申请API 弹窗
    confirmApplyApplication: () => void
    onItemClick?: (asset: any, st: AssetType) => void
    onGraphClick?: (asset: any) => void
}

const InterfaceItem: React.FC<IInterfaceItem> = ({
    item,
    isCongSearch,
    isSelected = false,
    onCloseDetail,
    confirmApplyApplication,
    onItemClick,
    onGraphClick,
}: IInterfaceItem) => {
    const query = useQuery()

    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [applyOpen, setApplyOpen] = useState<boolean>(false)
    const [selectedRescId, setSelectedRescId] = useState<string>('')
    const [openStatus, setOpenStatus] = useState<boolean>(false)
    // useCogAsstContext 已移除，相关功能已下线
    const [userId] = useCurrentUser('ID')

    const attr = useMemo(() => (isCongSearch ? 'code' : 'id'), [isCongSearch])

    const handleClickItem = (e) => {
        setSelectedRescId(item[attr])
        onItemClick?.(item, AssetType.INTERFACESVC)
    }

    const handleApplyAPI = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedRescId(item[attr])
        setApplyOpen(true)
    }

    const handleAuthInfo = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedRescId(item[attr])
        setAuthInfoOpen(true)
    }

    const handleColseDetail = () => {
        setOpenStatus(false)
        // 提交申请后，更新列表状态
        onCloseDetail()
    }

    const handleConfirmApplyApplication = () => {
        confirmApplyApplication()
        setApplyOpen(false)
    }

    return (
        <>
            {/* <div className={styles['interface-item']} onClick={handleClickItem}>
                <AppApiColored className={styles['interface-item-icon']} />
                <div className={styles['interface-item-content']}>
                    <div className={styles['item-wrapper']}>
                        <div
                            title={item.raw_title}
                            className={styles['item-wrapper-name']}
                            dangerouslySetInnerHTML={{
                                __html: item.title,
                            }}
                        />
                        <div className={styles['item-wrapper-btns']}>
                            {item.audit_status !== 'auditing' &&
                                item.audit_status !== 'pass' && (
                                    <Button onClick={handleApplyAPI}>
                                        {__('接口申请')}
                                    </Button>
                                )}
                            {item.audit_status === 'pass' && (
                                <Button onClick={handleAuthInfo}>
                                    {__('调用信息')}
                                </Button>
                            )}
                            {item.audit_status === 'auditing' && (
                                <div>
                                    <InfoCircleFilled
                                        className={
                                            styles['item-wrapper-btns-icon']
                                        }
                                    />
                                    {__('接口申请审核中')}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.tableName}>
                        {item?.table_name && (
                            <span
                                title={item.raw_table_name}
                                dangerouslySetInnerHTML={{
                                    __html: item.table_name,
                                }}
                            />
                        )}
                        <span
                            className={styles.recDetail}
                            onClick={(e) => {
                                onGraphClick?.(item)
                                e.stopPropagation()
                            }}
                            hidden={!isCongSearch}
                        >
                            <div>推荐详情</div>
                            <RightOutlined style={{ fontSize: '14px' }} />
                        </span>
                    </div>
                    {item.description && (
                        <div
                            title={item.raw_description}
                            className={styles['interface-item-content-desc']}
                            dangerouslySetInnerHTML={{
                                __html: item.description || __('[暂无说明]'),
                            }}
                        />
                    )}

                    <div className={styles['interface-item-content-else']}>
                        <div>
                            {`${__('上线时间')} ${
                                item.published_at
                                    ? moment(item.published_at).format(
                                          'yyyy-MM-DD',
                                      )
                                    : '--'
                            }`}
                        </div>

                        <div className={styles.line} />
                        <div className={styles.user}>
                            <Tooltip
                                title={__('数据Owner：${owner}', {
                                    owner: item.raw_owner_name,
                                })}
                                className={styles.toolTip}
                            >
                                <div className={styles.icon}>
                                    <Icon
                                        component={userOutlined}
                                        className={styles.commonIcon}
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </div>
                                <div className={styles.userName}>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: item.owner_name || '--',
                                        }}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                        <div className={styles.line} />
                        <div className={styles.user}>
                            <Tooltip
                                title={__('所属部门：${orgname}', {
                                    orgname: item.raw_orgname,
                                })}
                                className={styles.toolTip}
                            >
                                <div className={styles.icon}>
                                    <DepartmentOutlined />
                                </div>
                                <div className={styles.userName}>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: item.orgname || '--',
                                        }}
                                    />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div> */}
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
                    <InterfaceColored className={styles.itemIcon} />

                    <div className={styles.nameContent}>
                        <div
                            title={item.raw_title}
                            className={styles.name}
                            dangerouslySetInnerHTML={{
                                __html: item.title,
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
                    <div className={styles.nameBtn}>
                        {item.has_permission && (
                            <InterfaceOutlined
                                className={styles.itemOprIcon}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setSelectedRescId(item.resource_id)
                                    setAuthInfoOpen(true)
                                }}
                            />
                        )}
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
                                    title={chatTip}
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
                    title={item.raw_description || __('[暂无说明]')}
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                        __html: item.description || __('[暂无说明]'),
                    }}
                />
                <div className={styles.filedInfoWrapper}>
                    <div className={styles.fieldTitle}>{__('出参字段:')}</div>
                    <Space size={4} className={styles.fieldTagWrapper}>
                        {item.fields?.length
                            ? item.fields
                                  ?.slice(0, 3)
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
                            item.published_at
                                ? moment(item.published_at).format('YYYY-MM-DD')
                                : '--'
                        }`}
                    </div>

                    <div className={styles.line} />
                    <div className={styles.itemOtherInfoWrapper}>
                        <div className={styles.itemOtherInfo}>
                            <Tooltip
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
                                            item?.raw_subject_domain_name
                                                ?.split('/')
                                                ?.slice(-1)?.[0] || '--',
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
                                                    item?.department_name ||
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
                                        __html:
                                            item?.raw_department_path
                                                ?.split('/')
                                                ?.slice(-1)?.[0] || '--',
                                    }}
                                />
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
            {/* 调用信息 */}
            {authInfoOpen && (
                <AuthInfo
                    id={selectedRescId}
                    open={authInfoOpen}
                    onClose={() => {
                        setAuthInfoOpen(false)
                    }}
                />
            )}
        </>
    )
}

export default memo(InterfaceItem)
