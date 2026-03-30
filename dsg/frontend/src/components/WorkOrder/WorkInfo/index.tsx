import React, { useEffect, useState } from 'react'
import { Tag, Tooltip } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import classNames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { Loader } from '@/ui'
import { formatError, getWorkOrderDetail } from '@/core'
import {
    getOptionState,
    OrderStatusOptions,
    OrderType,
    OrderTypeOptions,
    PriorityOptions,
} from '../helper'

function WorkInfo({ data, loading = false, className }: any) {
    const [collapsed, setCollapsed] = useState<boolean>(true)
    const [detail, setDetail] = useState<any>()

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }

    useEffect(() => {
        if (data) {
            setDetail(data)
        }
    }, [data])

    return (
        <div className={styles.container}>
            {collapsed ? (
                <div className={classNames(styles['work-info'], className)}>
                    {loading ? (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className={styles['work-info-title']}>
                                <span>{__('工单信息')}</span>
                                <span onClick={() => toggleCollapsed()}>
                                    <FontIcon name="icon-shouqi1" />
                                </span>
                            </div>
                            <div
                                className={styles.moduleTitle}
                                style={{
                                    background: 'transparent',
                                    height: '24px',
                                    marginTop: '24px',
                                    marginBottom: 0,
                                }}
                            >
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <div className={styles['work-info-content']}>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('工单名称')}:</div>
                                    <div
                                        className={styles.lineValue}
                                        title={detail?.name}
                                    >
                                        {detail?.name || '--'}
                                    </div>
                                </div>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('工单类型')}:</div>
                                    <div className={styles.lineValue}>
                                        {OrderTypeOptions.find(
                                            (o) => o.value === detail?.type,
                                        )?.label || '--'}
                                    </div>
                                </div>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('责任人')}:</div>
                                    <div className={styles.lineValue}>
                                        {detail?.responsible_uname || '--'}
                                    </div>
                                </div>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('优先级')}:</div>
                                    <div>
                                        {getOptionState(
                                            detail?.priority,
                                            PriorityOptions,
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('截止日期')}:</div>
                                    <div>
                                        {isNumber(detail?.finished_at) &&
                                        detail?.finished_at
                                            ? moment(
                                                  detail.finished_at * 1000,
                                              ).format('YYYY-MM-DD')
                                            : '--'}
                                    </div>
                                </div>
                                {detail?.type === OrderType.COMPREHENSION && (
                                    <>
                                        <div
                                            className={
                                                styles['work-info-content-line']
                                            }
                                        >
                                            <div>{__('数据资源目录')}:</div>
                                            <div className={styles['tag-list']}>
                                                {detail?.catalog_infos?.length
                                                    ? detail.catalog_infos.map(
                                                          (o) => (
                                                              <Tag
                                                                  key={
                                                                      o?.catalog_id
                                                                  }
                                                                  className={
                                                                      styles[
                                                                          'tag-list-item'
                                                                      ]
                                                                  }
                                                                  title={
                                                                      o?.catalog_name
                                                                  }
                                                              >
                                                                  {
                                                                      o?.catalog_name
                                                                  }
                                                              </Tag>
                                                          ),
                                                      )
                                                    : '--'}
                                            </div>
                                        </div>
                                        <div
                                            className={
                                                styles['work-info-content-line']
                                            }
                                        >
                                            <div>{__('来源计划')}:</div>
                                            <div
                                                className={styles.lineValue}
                                                title={detail?.source_name}
                                            >
                                                {detail?.source_name || '--'}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {detail?.type === OrderType.AGGREGATION &&
                                    (detail?.source_type === 'plan' ? (
                                        <div
                                            className={
                                                styles['work-info-content-line']
                                            }
                                        >
                                            <div>{__('来源计划')}:</div>
                                            <div
                                                className={styles.lineValue}
                                                title={detail?.source_name}
                                            >
                                                {detail?.source_name || '--'}
                                            </div>
                                        </div>
                                    ) : detail?.source_type ===
                                      'business_form' ? (
                                        <div
                                            className={
                                                styles['work-info-content-line']
                                            }
                                        >
                                            <div>{__('来源业务表')}:</div>
                                            <div
                                                className={
                                                    styles.businessFormList
                                                }
                                            >
                                                {detail
                                                    ?.data_aggregation_inventory
                                                    ?.business_forms?.length > 0
                                                    ? detail?.data_aggregation_inventory?.business_forms.map(
                                                          (o) => (
                                                              <Tag
                                                                  key={o.name}
                                                                  title={
                                                                      o?.name
                                                                  }
                                                              >
                                                                  {o.name}
                                                              </Tag>
                                                          ),
                                                      )
                                                    : '--'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                styles['work-info-content-line']
                                            }
                                        >
                                            <div>{__('来源')}:</div>
                                            <div>{__('无')}</div>
                                        </div>
                                    ))}
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('工单状态')}:</div>
                                    <div>
                                        {getOptionState(
                                            detail?.status,
                                            OrderStatusOptions,
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={styles['work-info-content-line']}
                                    hidden={detail?.status !== 'finished'}
                                >
                                    <div>{__('完成时间')}:</div>
                                    <div>
                                        {isNumber(detail?.updated_at) &&
                                        detail?.updated_at
                                            ? moment(detail.updated_at).format(
                                                  'YYYY-MM-DD HH:mm:ss',
                                              )
                                            : '--'}
                                    </div>
                                </div>

                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('工单说明')}:</div>
                                    <div
                                        className={styles.ellipsisTxt}
                                        title={detail?.description}
                                    >
                                        {detail?.description || '--'}
                                    </div>
                                </div>
                                {/* <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('备注')}:</div>
                                    <div> {detail?.remark || '--'}</div>
                                </div> */}
                            </div>
                            <div
                                className={styles.moduleTitle}
                                style={{
                                    background: 'transparent',
                                    height: '24px',
                                    marginTop: '24px',
                                    marginBottom: 0,
                                }}
                            >
                                <h4>{__('更多信息')}</h4>
                            </div>
                            <div>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('创建人')}:</div>
                                    <div className={styles.lineValue}>
                                        {detail?.created_by || '--'}
                                    </div>
                                </div>
                                <div
                                    className={styles['work-info-content-line']}
                                >
                                    <div>{__('创建时间')}:</div>
                                    <div>
                                        {isNumber(detail?.created_at) &&
                                        detail?.created_at
                                            ? moment(detail.created_at).format(
                                                  'YYYY-MM-DD HH:mm:ss',
                                              )
                                            : '--'}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <Tooltip title={__('工单信息')} placement="bottom">
                    <span
                        onClick={toggleCollapsed}
                        className={styles.workInfoIcon}
                    >
                        <FontIcon name="icon-jichuxinxi" />
                    </span>
                </Tooltip>
            )}
        </div>
    )
}

export default WorkInfo
