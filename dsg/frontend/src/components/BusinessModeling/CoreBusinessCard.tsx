import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dropdown, message, Space, Tooltip } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import {
    EllipsisOutlined,
    BusinessFormCountOutlined,
    FlowchartOutlined,
    IndicatorTaskColored,
    NewCoreBizColored,
    BusinessProcessOutlined,
    BusinessSystemOutlined,
    DepartmentOutlined,
} from '@/icons'
import styles from './styles.module.less'
import { OperateType, getPlatformNumber } from '@/utils'
import {
    BizModelType,
    deleteCoreBusiness,
    formatError,
    ICoreBusinessItem,
    TaskType,
    BusinessAuditStatus,
    PublishedStatus,
    LoginPlatform,
    getModalVersions,
} from '@/core'
import { TabKey, ViewMode } from './const'
import __ from './locale'
import Confirm from '../Confirm'
import ModelLock from './ModelLock'
import { useBusinessModelContext } from './BusinessModelProvider'
import { AuditStatusTag, getDisabledTooltip } from '../BusinessAudit/helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface ICoreBusinessCard {
    viewMode: ViewMode
    item: ICoreBusinessItem
    handleOperate: (type: OperateType | TaskType) => void
    onDeleteSuccess: (delItem: ICoreBusinessItem) => void
}
const CoreBusinessCard: React.FC<ICoreBusinessCard> = ({
    viewMode,
    item,
    handleOperate,
    onDeleteSuccess = () => {},
}) => {
    const [showOperate, setShowOperate] = useState(false)
    const [delOpen, setDelOpen] = useState(false)
    const navigator = useNavigate()
    const { checkPermission } = useUserPermCtx()
    const { businessModelType } = useBusinessModelContext()
    const platformNumber = getPlatformNumber()

    const hasOprAccess = useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )

    // 信息系统名称，逗号分隔
    const businSysName = item?.business_system_name?.join()

    const isUnpublished =
        item?.audit_status === BusinessAuditStatus.Unpublished &&
        item?.published_status === PublishedStatus.Published
    const isAuditing = item?.audit_status === BusinessAuditStatus.PubAuditing
    const isAuditRejected =
        item?.audit_status === BusinessAuditStatus.PubReject &&
        item?.published_status === PublishedStatus.Published

    const getTitle = () => {
        return isUnpublished || isAuditRejected
            ? getDisabledTooltip(__('删除'), __('存在已发布版本'))
            : isAuditing
            ? getDisabledTooltip(__('删除'), __('审核中'))
            : undefined
    }

    const [items, setItems] = useState<any[]>([
        item?.audit_status === BusinessAuditStatus.Unpublished ||
        item?.audit_status === BusinessAuditStatus.PubReject ||
        item?.audit_status === BusinessAuditStatus.AuditReject
            ? {
                  key: OperateType.SUBMIT,
                  label: __('提交'),
              }
            : null,
        isAuditing
            ? {
                  key: OperateType.REVOCATION,
                  label: __('撤回'),
              }
            : null,
        hasOprAccess
            ? {
                  key: OperateType.DETAIL,
                  label: __('基本信息'),
              }
            : null,
        hasOprAccess
            ? {
                  key: OperateType.DELETE,
                  label: <span title={getTitle()}>{__('删除')}</span>,
                  disabled: isUnpublished || isAuditing || isAuditRejected,
              }
            : null,
        // 已发布显示导出按钮
        !item.locked
            ? {
                  key: OperateType.EXPORT,
                  label: __('导出'),
              }
            : null,
        hasOprAccess
            ? {
                  key: OperateType.COPY,
                  label: __('复制'),
              }
            : null,
    ])

    // 点击进入到业务模型内容区域
    const handleClick = (versionId = '') => {
        // department_name 没值说明关联的部门已被删除
        // domain 没值说明关联的主题域已被删除

        navigator(
            `/${
                businessModelType === BizModelType.BUSINESS
                    ? 'coreBusiness'
                    : 'coreData'
            }/${item.main_business_id || item.id}?domainId=${
                item.domain ? item.domain_id : ''
            }&departmentId=${
                item.department_name ? item.department_id : ''
            }&viewType=${viewMode}&versionId=${versionId}`,
        )
    }

    useEffect(() => {
        getVersionItems()
    }, [item])

    const getVersionItems = async () => {
        // if (!id || !isAuditMode) return
        try {
            const res = await getModalVersions(item.main_business_id || item.id)

            if (res?.length > 1) {
                setItems((prev) => [
                    ...items,
                    {
                        key: OperateType.VERSIONs,
                        label: __('版本'),
                        children: res.map((it) => ({
                            key: `${OperateType.VERSIONs}/${it.version_id}`,
                            label: it.version_name,
                        })),
                        popupClassName: styles.versionPopup,
                    },
                ])
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 删除业务模型
    const delCoreBusiness = async () => {
        try {
            await deleteCoreBusiness(item.main_business_id || item.id, {
                taskId: '',
                subject_domain_id: item.domain_id,
            })
            message.success(__('删除成功'))
            onDeleteSuccess(item)
            setDelOpen(false)
        } catch (error) {
            formatError(error)
        }
    }

    const onClick = ({ key, domEvent }) => {
        domEvent.stopPropagation()
        if (key.includes(OperateType.VERSIONs)) {
            handleClick(key.split('/')[1])
            return
        }
        if (key === OperateType.DELETE) {
            setDelOpen(true)
        } else if (key === OperateType.EDIT) {
            handleOperate(OperateType.EDIT)
        } else {
            handleOperate(key)
        }
        domEvent.preventDefault()
    }

    const goToFlowchart = (tab: TabKey) => {
        navigator(
            `/${
                businessModelType === BizModelType.BUSINESS
                    ? 'coreBusiness'
                    : 'coreData'
            }/${item.main_business_id || item.id}?domainId=${
                item.domain_id
            }&departmentId=${
                item.department_id
            }&targetTab=${tab}&viewType=${viewMode}`,
        )
    }

    return (
        <>
            {item.locked ? (
                <div
                    className={classnames(
                        styles.coreBusinessCard,
                        styles['lock-card-container'],
                    )}
                >
                    <ModelLock processId={item.domain_id} />
                </div>
            ) : (
                <div
                    className={styles.coreBusinessCard}
                    onMouseEnter={() => setShowOperate(true)}
                    onMouseLeave={() => setShowOperate(false)}
                    onClick={() => handleClick()}
                >
                    <div className={styles.topInfo}>
                        <div className={styles.modelIconWrapper}>
                            <NewCoreBizColored className={styles.modelIcon} />
                        </div>
                        <div
                            className={styles.name}
                            title={item.name}
                            onClick={() => handleClick()}
                        >
                            {item.name}
                        </div>
                        <span className={styles.auditStatus}>
                            <AuditStatusTag record={item} />
                        </span>
                    </div>

                    <div
                        className={styles.desc}
                        title={item.description || __('[暂无描述]')}
                    >
                        {item.description || __('[暂无描述]')}
                    </div>

                    <Space size={24}>
                        <Tooltip
                            title={
                                businessModelType === BizModelType.BUSINESS
                                    ? __('业务表')
                                    : __('数据表')
                            }
                            placement="bottom"
                        >
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToFlowchart(TabKey.FORM)
                                }}
                                className={styles.iconWrapper}
                            >
                                <BusinessFormCountOutlined
                                    className={styles.countIcon}
                                />
                                <span className={styles.count}>
                                    {item.form_count}
                                </span>
                            </span>
                        </Tooltip>
                        {businessModelType === BizModelType.BUSINESS && (
                            <Tooltip title={__('流程图')} placement="bottom">
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        goToFlowchart(TabKey.PROCESS)
                                    }}
                                    className={styles.iconWrapper}
                                >
                                    <FlowchartOutlined
                                        className={styles.countIcon}
                                    />
                                    <span className={styles.count}>
                                        {item.flowchart_count}
                                    </span>
                                </span>
                            </Tooltip>
                        )}

                        <Tooltip
                            title={
                                businessModelType === BizModelType.BUSINESS
                                    ? __('业务指标')
                                    : __('数据指标')
                            }
                            placement="bottom"
                        >
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    goToFlowchart(TabKey.INDICATOR)
                                }}
                                className={styles.iconWrapper}
                            >
                                <IndicatorTaskColored
                                    className={styles.countIcon}
                                />
                                <span className={styles.count}>
                                    {item.indicator_count}
                                </span>
                            </span>
                        </Tooltip>
                    </Space>
                    <div className={styles.bottomInfo}>
                        <div className={styles.updateInfo}>
                            <div
                                className={styles.updateBy}
                                title={item.updated_by}
                            >
                                {item.updated_by}
                            </div>
                            <div className={styles.updateAt}>
                                {`${__('更新于')} ${moment(
                                    item.updated_at,
                                ).format('YYYY-MM-DD HH:mm:ss')}`}
                            </div>
                        </div>
                        <div className={styles.belongInfoWrapper}>
                            <Tooltip
                                className={classnames({
                                    [styles.belongItem]: true,
                                    [styles.noValue]: !item.department_name,
                                })}
                                overlayClassName={styles.belongTooltip}
                                color="#fff"
                                title={
                                    <div className={styles.belongItemCon}>
                                        <div className={styles.title}>
                                            {item.department_name
                                                ? `${__('所属部门：')}`
                                                : ''}
                                        </div>
                                        <div className={styles.belongInfoCon}>
                                            {item.department_name ||
                                                __('无所属部门信息')}
                                        </div>
                                    </div>
                                }
                                placement="bottom"
                            >
                                <DepartmentOutlined />
                            </Tooltip>
                            <Tooltip
                                className={classnames({
                                    [styles.belongItem]: true,
                                    [styles.noValue]: !item.domain,
                                })}
                                overlayClassName={styles.belongTooltip}
                                color="#fff"
                                title={
                                    <div className={styles.belongItemCon}>
                                        <div className={styles.title}>
                                            {item.domain
                                                ? `${
                                                      platformNumber ===
                                                      LoginPlatform.default
                                                          ? __('业务流程：')
                                                          : __('主干业务：')
                                                  }`
                                                : ''}
                                        </div>
                                        <div className={styles.belongInfoCon}>
                                            {item.domain
                                                ? item.domain
                                                : platformNumber ===
                                                  LoginPlatform.default
                                                ? __('未关联业务流程')
                                                : __('未关联主干业务')}
                                        </div>
                                    </div>
                                }
                                placement="bottom"
                            >
                                <BusinessProcessOutlined />
                            </Tooltip>
                            <Tooltip
                                className={classnames({
                                    [styles.belongItem]: true,
                                    [styles.noValue]: !businSysName,
                                })}
                                overlayClassName={styles.belongTooltip}
                                color="#fff"
                                title={
                                    <div className={styles.belongItemCon}>
                                        <div className={styles.title}>
                                            {businSysName
                                                ? `${__('信息系统：')}`
                                                : ''}
                                        </div>
                                        <div className={styles.belongInfoCon}>
                                            {businSysName ||
                                                __('未关联信息系统')}
                                        </div>
                                    </div>
                                }
                                placement="bottom"
                            >
                                <BusinessSystemOutlined />
                            </Tooltip>
                        </div>
                    </div>
                    {items.filter((i) => i !== null).length > 0 && (
                        <div
                            className={styles.dropdown}
                            hidden={!showOperate}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Dropdown
                                menu={{ items, onClick }}
                                placement="bottomLeft"
                                trigger={['click']}
                                className={styles.itemMore}
                                overlayStyle={{ width: 100 }}
                            >
                                <EllipsisOutlined
                                    className={styles.operateIcon}
                                />
                            </Dropdown>
                        </div>
                    )}
                </div>
            )}

            <Confirm
                onOk={() => {
                    delCoreBusiness()
                }}
                onCancel={() => setDelOpen(false)}
                open={delOpen}
                title={
                    businessModelType === BizModelType.BUSINESS
                        ? __('确认要删除业务模型吗？')
                        : __('确认要删除数据模型吗？')
                }
                content={
                    businessModelType === BizModelType.BUSINESS
                        ? __('删除后，本业务模型下的所有内容将一并删除。')
                        : __('删除后，本数据模型下的所有内容将一并删除。')
                }
                okText={__('确定')}
                cancelText={__('取消')}
            />
        </>
    )
}

export default CoreBusinessCard
