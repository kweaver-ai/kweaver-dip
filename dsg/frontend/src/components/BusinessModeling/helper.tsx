import { FC } from 'react'
import Icon, {
    InfoCircleFilled,
    CloseCircleFilled,
    DownOutlined,
} from '@ant-design/icons'
import { Dropdown, Button, Tag } from 'antd'
import { BusinessAuditStatus, PublishedStatus } from '@/core'
import { formatTime } from '@/utils'
import { ViewMode } from './const'
import { ReactComponent as level1 } from '@/assets/DataAssetsCatlg/level1.svg'
import { ReactComponent as level2 } from '@/assets/DataAssetsCatlg/level2.svg'
import { ReactComponent as level3 } from '@/assets/DataAssetsCatlg/level3.svg'
import { ReactComponent as level4 } from '@/assets/DataAssetsCatlg/level4.svg'
import styles from './styles.module.less'
import __ from './locale'
import { FormTableKind } from '../Forms/const'

export const viewModeList = [
    {
        label: __('业务架构'),
        value: ViewMode.BArchitecture,
    },
    {
        label: __('组织架构'),
        value: ViewMode.Department,
    },
    {
        label: __('信息系统'),
        value: ViewMode.InfoSystem,
    },
]

// 视角节点IconList
export const levelIcons = {
    1: (
        <Icon
            component={level1}
            className={styles.icon}
            style={{ color: '#9e7abb' }}
        />
    ),
    2: (
        <Icon
            component={level2}
            className={styles.icon}
            style={{ color: '#df9c19' }}
        />
    ),
    3: (
        <Icon
            component={level3}
            className={styles.icon}
            style={{ color: '#3c9810' }}
        />
    ),
    4: (
        <Icon
            component={level4}
            className={styles.icon}
            style={{ color: '#3c9810' }}
        />
    ),
}

export const labelText = (text: string, defaultTxt: string = '--') => {
    return (
        text || <span style={{ color: 'rgba(0,0,0,0.45)' }}>{defaultTxt}</span>
    )
}

const specificTitleSpan = '0 0 120px'

export const modelInfoConfig = [
    {
        label: __('业务模型名称'),
        titleFlex: specificTitleSpan,
        contFlex: 'auto',
        key: 'name',
    },
    {
        label: __('关联业务流程'),
        titleFlex: specificTitleSpan,
        contFlex: 'auto',
        key: 'business_domain_name',
    },
    {
        label: __('描述'),
        titleFlex: specificTitleSpan,
        contFlex: 'auto',
        key: 'description',
    },
    {
        label: __('最终修改人/时间'),
        titleFlex: specificTitleSpan,
        contFlex: 'auto',
        key: 'updated_by',
        secKey: 'updated_at',
    },
]

// 渲染版本提示
export const RenderVersionTip = ({ info, onClick }: any) => {
    const {
        audit_status,
        draft_created_at,
        draft_created_by,
        has_draft,
        published_status,
        reject_reason,
    } = info || {}

    return (
        <>
            {has_draft &&
                audit_status === BusinessAuditStatus.Unpublished &&
                published_status !== PublishedStatus.Unpublished && (
                    <div className={styles.renderVersionTip}>
                        <div className={styles.versionTipWrapper}>
                            <div
                                className={styles.versionTip}
                                style={{
                                    backgroundColor: 'rgba(24, 144, 255, 0.07)',
                                }}
                            >
                                <InfoCircleFilled
                                    style={{ color: 'rgba(24, 144, 255, 1)' }}
                                    className={styles.versionTipIcon}
                                />
                                {__('当前草稿 ${time} 由【', {
                                    time: formatTime(draft_created_at) || '--',
                                })}
                                <div
                                    className={styles.ellipsisWrapper}
                                    title={draft_created_by || '--'}
                                >
                                    {draft_created_by || '--'}
                                </div>
                                {__('】产生，')}
                                <div
                                    className={styles.goToPublished}
                                    onClick={onClick}
                                >
                                    {__('恢复到已发布的内容')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            {audit_status === BusinessAuditStatus.PubReject &&
                published_status !== PublishedStatus.Unpublished && (
                    <div className={styles.renderVersionTip}>
                        <div className={styles.versionTipWrapper}>
                            <div
                                className={styles.versionTip}
                                style={{
                                    backgroundColor: 'rgba(230, 0, 18, 0.07)',
                                }}
                            >
                                <CloseCircleFilled
                                    style={{ color: 'rgba(255, 77, 79, 1)' }}
                                    className={styles.versionTipIcon}
                                />
                                {__('变更未通过。审批意见：')}
                                <div
                                    className={styles.ellipsisWrapper}
                                    title={reject_reason}
                                >
                                    {reject_reason || '--'}
                                </div>
                                <div
                                    className={styles.goToPublished}
                                    onClick={onClick}
                                >
                                    {__('恢复到已发布的内容')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </>
    )
}

// 渲染版本列表
export const RenderVersionList = ({
    versionList,
    selectedVersion,
    onClick,
}: any) => {
    // 版本列表为空时，不显示
    if (!versionList || versionList.length === 0) {
        return null
    }

    const menu = {
        items: versionList.map((ver, index) => ({
            key: ver.version_id,
            label: (
                <>
                    <span>{ver.version_name || ver.version_id || '--'}</span>
                    {index === 0 && (
                        <Tag style={{ marginLeft: 8, fontSize: 12 }}>
                            {__('最新')}
                        </Tag>
                    )}
                </>
            ),
        })),
        onClick: ({ key }) => onClick(key),
    }

    // 获取选中的版本名称
    const versionText = selectedVersion
        ? versionList.find((v) => v.version_id === selectedVersion)
              ?.version_name || `v${selectedVersion}`
        : ''

    // 版本列表仅有一个版本时，显示版本名称
    if (versionList.length === 1) {
        return (
            <Button
                size="small"
                disabled
                className={styles.singleVersionButton}
                title={__('当前仅存在此版本')}
            >
                {versionText}
            </Button>
        )
    }

    // 版本列表有多个版本时，显示下拉菜单
    return (
        <Dropdown trigger={['click']} menu={menu}>
            <Button size="small" className={styles.versionButton}>
                {versionText}
                <DownOutlined className={styles.versionDownIcon} />
            </Button>
        </Dropdown>
    )
}

const tableTypeMap = {
    [FormTableKind.DATA_ORIGIN]: {
        label: __('数据原始表'),
        backgroundColor: 'rgba(89, 163, 255, 0.1)',
        color: '#59A3FF',
    },
    [FormTableKind.DATA_STANDARD]: {
        label: __('数据标准表'),
        backgroundColor: 'rgba(20, 206, 170, 0.1)',
        color: '#14CEAA',
    },
    [FormTableKind.DATA_FUSION]: {
        label: __('数据融合表'),
        backgroundColor: 'rgba(255, 186, 48, 0.1)',
        color: '#FFBA30',
    },
}

export const getTableTypeTag = (type: FormTableKind) => {
    const { label, backgroundColor, color } = tableTypeMap[type]
    return (
        <div style={{ backgroundColor, color }} className={styles.tableTypeTag}>
            {label}
        </div>
    )
}

export interface ILabelTitle {
    label: string
    id: string
}
export const LabelTitle: FC<ILabelTitle> = ({ label, id }) => {
    return (
        <div className={styles.labelTitleWrapper} id={id}>
            <span className={styles.labelLine} />
            <span>{label}</span>
        </div>
    )
}
