import { Button, message, Space, Tooltip } from 'antd'
import { noop } from 'lodash'
import { FC } from 'react'
import classnames from 'classnames'
import moment from 'moment'
import { InfoCircleOutlined } from '@ant-design/icons'
import __ from '../locale'
import styles from '../styles.module.less'
import { AuditStatus, getPermissionDetail } from '../const'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { cancelAppAudit, formatError } from '@/core'

interface IApplicationCardProps {
    appInfo: any
    onEdit: () => void
    onDelete: () => void
    governmentStatus?: boolean
    isSystemManger?: boolean
    onOpenView?: () => void
    localAppSwitchStatus?: boolean
}
const ApplicationCard: FC<IApplicationCardProps> = ({
    appInfo,
    onEdit,
    onDelete,
    governmentStatus = false,
    isSystemManger = false,
    onOpenView = noop,
    localAppSwitchStatus = false,
}) => {
    const getAppStatusLabel = (status: string) => {
        switch (status) {
            case AuditStatus.AUDITING:
                return (
                    <div
                        className={classnames(
                            styles.auditLabelBase,
                            styles.auditing,
                        )}
                    >
                        {__('审核中')}
                    </div>
                )
            case AuditStatus.REJECTED:
                return (
                    <>
                        <div
                            className={classnames(
                                styles.auditLabelBase,
                                styles.rejected,
                            )}
                        >
                            {__('未通过')}
                        </div>
                        <Tooltip
                            color="#fff"
                            title={appInfo?.rejected_reason || ''}
                            placement="right"
                            overlayInnerStyle={{
                                color: 'rgba(0, 0, 0, 0.85)',
                            }}
                            overlayStyle={{
                                maxWidth: 500,
                            }}
                        >
                            <FontIcon
                                type={IconType.COLOREDICON}
                                name="icon-shenheyijian"
                            />
                        </Tooltip>
                    </>
                )
            case AuditStatus.UNAUDITED:
                return (
                    <div
                        className={classnames(
                            styles.auditLabelBase,
                            styles.unAudit,
                        )}
                    >
                        {__('未审核')}
                    </div>
                )
            default:
                return ''
        }
    }

    /**
     * 撤回审核
     */
    const handleRetractAudit = async () => {
        try {
            await cancelAppAudit(appInfo.id)
            message.success(__('撤回成功'))
        } catch (error) {
            formatError(error)
        }
    }

    /**
     * 获取操作按钮
     * @returns
     */
    const getItemButton = () => {
        switch (appInfo.status) {
            case AuditStatus.AUDITING:
                return (
                    <Button type="link" onClick={handleRetractAudit}>
                        {__('撤回')}
                    </Button>
                )
            default:
                return appInfo.can_delete ? (
                    <Button type="link" onClick={onDelete}>
                        {__('删除')}
                    </Button>
                ) : null
        }
    }
    return (
        <div className={styles.applicationCardWrapper}>
            <div className={styles.icon}>
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-jichengyingyongguanli"
                    className={styles.iconImg}
                />
            </div>
            <div className={styles.content}>
                <div className={styles.titleWrapper}>
                    <div
                        className={classnames(
                            styles.titleText,
                            governmentStatus && styles['titleText-clickable'],
                        )}
                        title={appInfo.name}
                        onClick={() => {
                            if (governmentStatus) {
                                onOpenView()
                            }
                        }}
                    >
                        {appInfo.name}
                    </div>
                    {getAppStatusLabel(appInfo.status)}
                </div>
                <div className={styles.itemInfoWrapper}>
                    <span className={styles.label}> {__('描述：')}</span>
                    <span title={appInfo.description} className={styles.text}>
                        {appInfo.description || __('暂无描述')}
                    </span>
                </div>
                <div className={styles.itemInfoWrapper}>
                    <div className={styles.itemLeftChild}>
                        <span>{__('信息系统：')}</span>
                        <span
                            title={appInfo.info_system_name || __('暂无')}
                            className={styles.text}
                        >
                            {appInfo.info_system_name || '--'}
                        </span>
                    </div>
                    <div className={styles.splitLine} />
                    {/* <div className={styles.itemLeftChild}>
                        <span>{__('应用开发者：')}</span>
                        <span
                            title={appInfo.application_developer_name}
                            className={styles.text}
                        >
                            {appInfo.application_developer_name || '--'}
                        </span>
                    </div>
                    <div className={styles.splitLine} /> */}
                    <div className={styles.itemLeftChild}>
                        <span>{__('账户名称：')}</span>
                        <span
                            title={appInfo.account_name || __('暂无')}
                            className={styles.text}
                        >
                            {appInfo.account_name || '--'}
                        </span>
                    </div>
                    {localAppSwitchStatus && (
                        <>
                            <div className={styles.splitLine} />
                            <div className={styles.itemFlexShrink}>
                                <span>{__('账户ID：')}</span>
                                <span
                                    title={appInfo.account_id || __('暂无')}
                                    className={styles.text}
                                >
                                    {appInfo.account_id || '--'}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                {governmentStatus ? (
                    <div className={styles.itemInfoWrapper}>
                        <div className={styles.itemLeftChild}>
                            <span>Key:</span>
                            <span
                                title={appInfo.access_key || __('暂无')}
                                className={styles.text}
                            >
                                {appInfo.access_key || '--'}
                            </span>
                        </div>
                        <div className={styles.splitLine} />
                        <div className={styles.itemLeftChild}>
                            <span>Secret：</span>
                            <span
                                title={appInfo.access_secret || __('暂无')}
                                className={styles.text}
                            >
                                {appInfo.access_secret || '--'}
                            </span>
                        </div>
                        <div className={styles.splitLine} />
                        <div className={styles.itemLeftChild}>
                            <span>{__('注册ID：')}</span>
                            <span
                                title={appInfo.app_id || __('暂无')}
                                className={styles.text}
                            >
                                {appInfo.app_id || '--'}
                            </span>
                        </div>
                        {!appInfo?.app_id &&
                            !appInfo?.access_key &&
                            !appInfo?.access_secret && (
                                <div style={{ marginLeft: 8 }}>
                                    <Tooltip
                                        title={__(
                                            '开启省平台应用注册，创建成功后会自动生成Key、Secret、注册ID',
                                        )}
                                        placement="bottomLeft"
                                        color="#fff"
                                        overlayInnerStyle={{
                                            color: 'rgba(0,0,0,0.85)',
                                        }}
                                        overlayStyle={{
                                            maxWidth: '500px',
                                        }}
                                        arrowPointAtCenter
                                    >
                                        <span>
                                            <InfoCircleOutlined />
                                        </span>
                                    </Tooltip>
                                </div>
                            )}
                    </div>
                ) : (
                    <div className={styles.itemInfoWrapper}>
                        {/* <div className={styles.itemTagsWrapper}>
                            <div>{__('权限范围：')}</div>
                            <div className={styles.tagList}>
                                {appInfo.authority_scope?.length
                                    ? appInfo.authority_scope?.map((item) => {
                                          const permission =
                                              getPermissionDetail(item)
                                          return (
                                              <Tooltip
                                                  title={
                                                      <div>
                                                          <div>
                                                              {
                                                                  permission?.label
                                                              }
                                                          </div>
                                                          <div
                                                              style={{
                                                                  fontSize: 12,
                                                                  color: 'rgba(0,0,0,0.45)',
                                                              }}
                                                          >
                                                              {
                                                                  permission?.description
                                                              }
                                                          </div>
                                                      </div>
                                                  }
                                                  placement="bottom"
                                                  color="#fff"
                                                  overlayInnerStyle={{
                                                      color: 'rgba(0,0,0,0.85)',
                                                  }}
                                                  overlayStyle={{
                                                      maxWidth: '500px',
                                                  }}
                                              >
                                                  <div className={styles.tag}>
                                                      {permission?.label}
                                                  </div>
                                              </Tooltip>
                                          )
                                      })
                                    : '--'}
                            </div>
                        </div>
                        <div className={styles.splitLine} /> */}
                        <div className={styles.itemFlexShrink}>
                            <span>{__('可用资源：')}</span>
                            <span>
                                <span>
                                    {appInfo?.has_resource
                                        ? __('已授权可用资源')
                                        : '--'}
                                </span>
                                <Tooltip
                                    placement="bottomLeft"
                                    title={
                                        <div>
                                            <div>
                                                {__(
                                                    '1、可用资源由资源的数据 Owner 进行授权。若配置了权限申请审核策略，则“应用开发者”也可以从数据服务超市申请资源。',
                                                )}
                                            </div>
                                            <div>
                                                {__(
                                                    '2、您可在【我的】查看应用的可用资源详情。',
                                                )}
                                            </div>
                                        </div>
                                    }
                                    color="#fff"
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                    }}
                                    overlayStyle={{ maxWidth: 650 }}
                                    arrowPointAtCenter
                                >
                                    <InfoCircleOutlined
                                        style={{
                                            color: 'rgba(0, 0, 0, 0.65)',
                                            marginLeft: 8,
                                        }}
                                    />
                                </Tooltip>
                            </span>
                        </div>
                    </div>
                )}

                <div className={styles.itemInfoWrapper}>
                    <div className={styles.atTime}>
                        {__('${name} 创建于 ${time}', {
                            name: appInfo?.creator_name || '--',
                            time: appInfo?.created_at
                                ? moment(appInfo?.created_at).format(
                                      'YYYY-MM-DD HH:mm:ss',
                                  )
                                : '--',
                        })}
                    </div>
                    <div className={styles.splitLine} />
                    <div className={styles.atTime}>
                        {__('${name} 更新于 ${time}', {
                            name: appInfo?.updater_name || '--',
                            time: appInfo?.updated_at
                                ? moment(appInfo?.updated_at).format(
                                      'YYYY-MM-DD HH:mm:ss',
                                  )
                                : '--',
                        })}
                    </div>
                </div>
            </div>
            <div className={styles.operationWrap}>
                <Space size={16}>
                    <Button type="link" onClick={onEdit}>
                        {__('编辑')}
                    </Button>
                    {getItemButton()}
                </Space>
            </div>
        </div>
    )
}

export default ApplicationCard
