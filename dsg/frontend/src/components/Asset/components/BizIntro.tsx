import { Dropdown, MenuProps, Statistic } from 'antd'
import classnames from 'classnames'
import { memo, useEffect, useMemo, useState } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
    AttributeOutlined,
    BusinessDomainL1Outlined,
    BusinessDomainL2Outlined,
    LogicEntityColored,
    ObjL3Outlined,
} from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { formatError, getGlossaryCount } from '@/core'
import { INode } from './AssetGraph/helper'

interface IBizIntro {
    data: INode // 分组节点信息
    bizId?: string // 主题域分组ID
    group: INode[] // 主题域分组列表
}

function BizIntro({ data, bizId, group }: IBizIntro) {
    const navigate = useNavigate()
    const [statistics, setStatistics] = useState<any>()
    const [expand, setExpand] = useState<boolean>(false)
    const getStatistics = async (id: string) => {
        try {
            const ret = await getGlossaryCount(id)
            setStatistics(ret ?? {})
        } catch (error) {
            formatError(error)
        }
    }
    useEffect(() => {
        if (bizId) {
            getStatistics(bizId)
        }
    }, [bizId])

    const dropdownItems: MenuProps['items'] = useMemo(() => {
        return group?.map((o) => ({
            key: o.id,
            label: (
                <a
                    title={o.name}
                    className={classnames(
                        styles['drop-item'],
                        bizId === o?.id && 'is-checked',
                    )}
                >
                    {o.name}
                </a>
            ),
        }))
    }, [group, bizId])

    const handleToSubject = (id: string) => {
        navigate(`/asset-view/architecture?bizId=${id}`)
    }

    return (
        <div className={styles['biz-intro']}>
            <div className={styles['biz-intro-left']}>
                <div className={styles['biz-intro-left-icon']}>
                    <BusinessDomainL1Outlined className={styles.l1} />
                </div>
                <div className={styles['biz-intro-left-content']}>
                    <Dropdown
                        menu={{
                            items: dropdownItems,
                            onClick: ({ key, domEvent }) => {
                                setExpand(false)
                                if (key === bizId) return
                                domEvent.stopPropagation()
                                handleToSubject(key)
                            },
                        }}
                        placement="bottomLeft"
                        overlayStyle={{
                            maxWidth: 220,
                            maxHeight: 400,
                        }}
                        overlayClassName={styles['title-dropdown']}
                        trigger={['click']}
                        onOpenChange={(open) => setExpand(open)}
                    >
                        <div
                            className={classnames(
                                styles['biz-intro-left-content-title'],
                                expand && styles['is-expand'],
                            )}
                        >
                            <div title={data?.name}>{data?.name}</div>
                            <span>
                                <DownOutlined />
                            </span>
                        </div>
                    </Dropdown>

                    <div
                        className={styles['biz-intro-left-content-info']}
                        title={`${__('描述信息')}: ${
                            data?.description || '--'
                        }`}
                    >
                        {__('描述信息')}:
                        <span>{data?.description || '--'}</span>
                    </div>
                </div>
            </div>
            <div className={styles['biz-intro-right']}>
                <div className={styles.item}>
                    <BusinessDomainL2Outlined
                        className={classnames(styles['item-icon'], styles.l2)}
                    />
                    <div className={styles['item-info']}>
                        <div>{__('主题域')}</div>
                        <div>
                            <Statistic
                                value={statistics?.level_subject_domain ?? 0}
                            />
                            <span>{__('个')}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.item}>
                    <ObjL3Outlined
                        className={classnames(styles['item-icon'], styles.obj)}
                    />
                    <div className={styles['item-info']}>
                        <div>{__('业务对象/活动')}</div>
                        <div>
                            <Statistic
                                value={statistics?.level_business_object ?? 0}
                            />
                            <span>{__('个')}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.item}>
                    <LogicEntityColored
                        className={classnames(
                            styles['item-icon'],
                            styles.logic,
                        )}
                    />
                    <div className={styles['item-info']}>
                        <div>{__('逻辑实体')}</div>
                        <div>
                            <Statistic
                                value={statistics?.level_logic_entities ?? 0}
                            />
                            <span>{__('个')}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.item}>
                    <AttributeOutlined
                        className={classnames(styles['item-icon'], styles.attr)}
                    />
                    <div className={styles['item-info']}>
                        <div>{__('属性')}</div>
                        <div>
                            <Statistic
                                value={statistics?.level_attributes ?? 0}
                            />
                            <span>{__('个')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(BizIntro)
