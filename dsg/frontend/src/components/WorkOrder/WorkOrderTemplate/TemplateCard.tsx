import React, { useMemo, useRef, useState } from 'react'
import { Dropdown, Menu, MenuProps, Tooltip } from 'antd'
import classnames from 'classnames'
import { useHover } from 'ahooks'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { TicketTypeOptions } from './helper'
import { OptionStatus } from './const'
import { formatTime } from '@/utils'
import { IWorkOrderTemplateInfo } from '@/core/apis/taskCenter/index.d'
import { IconType } from '@/icons/const'

interface TemplateCardProps {
    data: Partial<IWorkOrderTemplateInfo>
    onChange?: (key: string, data: any) => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({ data, onChange }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)

    // 获取工单类型显示
    const getTicketTypeDisplay = (type?: string) => {
        return (
            TicketTypeOptions.find((item) => item.key === type)?.label ||
            __('未知')
        )
    }

    const handleOptionClick = (key: OptionStatus) => {
        if (key === OptionStatus.Delete && data?.is_builtin) {
            return
        }
        onChange?.(key, data)
    }

    const OperationItems: MenuProps['items'] = useMemo(() => {
        const OperationMenu = [
            {
                key: OptionStatus.Detail,
                label: '查看模板',
                show: true,
            },
            {
                key: OptionStatus.Edit,
                label: '编辑基本信息',
                show: true,
            },
            {
                key: OptionStatus.Enable,
                label: '启用',
                show: !data?.status,
            },
            {
                key: OptionStatus.Stop,
                label: '停用',
                show: !!data?.status,
                disabled: !!data?.status,
                title: data?.status
                    ? __(
                          '一个工单类型至少要启用一个模版，不能直接停用，只能通过启用另一个同类型的模版来进行替换。',
                      )
                    : '',
            },
            {
                key: OptionStatus.Delete,
                label: '删除',
                show: true,
                disabled: data?.is_builtin || !!data?.status,
                title: data?.is_builtin
                    ? __('内置模版不能删除。')
                    : data?.status
                    ? __('当前工单模板正在使用，不能直接删除。')
                    : '',
            },
        ]
        return OperationMenu.filter((item) => item.show)
    }, [data])

    const ref = useRef<HTMLDivElement | null>(null)

    const isHovering = useHover(ref)

    const showOperation = isHovering || dropdownOpen

    return (
        <div ref={ref} className={styles.templateCard}>
            <div className={styles.content}>
                <div className={styles.title}>
                    <span className={styles.titleWrap}>
                        <span className={styles.iconWrap}>
                            <FontIcon
                                name="icon-biaodangongdan"
                                type={IconType.COLOREDICON}
                                style={{ color: '#3C7CFF', fontSize: 22 }}
                            />
                        </span>
                        <span
                            title={data?.template_name}
                            className={styles.title_name}
                        >
                            {data?.template_name}
                        </span>
                        {data?.is_builtin && (
                            <span className={styles.builtinTag}>
                                {__('内置')}
                            </span>
                        )}
                    </span>

                    <div className={styles.operation}>
                        {showOperation && (
                            <Dropdown
                                menu={{
                                    items: OperationItems,
                                    onClick: ({ key, domEvent }) => {
                                        domEvent.stopPropagation()
                                        handleOptionClick(key as OptionStatus)
                                    },
                                }}
                                trigger={['hover']}
                                placement="bottomRight"
                                onOpenChange={setDropdownOpen}
                                overlayStyle={{
                                    width: 122,
                                }}
                            >
                                <div
                                    className={styles.iconButton}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <FontIcon name="icon-gengduo1" />
                                </div>
                            </Dropdown>
                        )}
                    </div>
                </div>
                <div className={styles.desc} title={data?.description}>
                    {data?.description ? (
                        data?.description
                    ) : (
                        <span style={{ color: 'rgb(0 0 0 / 45%)' }}>
                            [{__('暂无描述')}]
                        </span>
                    )}
                </div>
                <div className={styles.meta}>
                    <div className={styles.type}>
                        <span style={{ marginRight: 8 }}>
                            {__('工单类型')}:
                        </span>
                        {getTicketTypeDisplay(data?.ticket_type)}
                    </div>
                    <div className={styles.detailWrap}>
                        <div className={styles.detail_user}>
                            <div
                                className={styles.userWrap}
                                title={data?.updated_name}
                            >
                                {data?.is_builtin
                                    ? __('系统')
                                    : data?.updated_name || __('未知用户')}
                            </div>
                        </div>
                        <div
                            title={
                                data?.updated_at && formatTime(data?.updated_at)
                            }
                            className={styles.timeWrap}
                        >
                            {__('更新于')}{' '}
                            {data?.updated_at
                                ? formatTime(data?.updated_at)
                                : '--'}
                        </div>
                    </div>
                </div>
            </div>

            {data?.status && (
                <div className={styles.status}>{__('启用中')}</div>
            )}
        </div>
    )
}

export default TemplateCard
