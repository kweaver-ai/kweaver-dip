import React, { useEffect, useRef, useState } from 'react'
import { Anchor, Descriptions, Drawer } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import { SwapRightOutlined } from '@ant-design/icons'
import { formatError, getDataProcessingPlanDetail } from '@/core'
import styles from './styles.module.less'
import Return from '../Return'
import __ from './locale'
import { getOptionState, PriorityOptions } from './helper'
import { StatusOptions } from '../PlanUnderstanding/helper'
import { Loader } from '@/ui'
import RelativeOrder from '../RelativeOrder'

const { Link } = Anchor
function DetailModal({ id, onClose }: any) {
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [loading, setLoading] = useState(false)
    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getDataProcessingPlanDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    return (
        <Drawer
            open
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={detail?.name || __('详情')}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.detailContent} ref={container}>
                        <div
                            style={{
                                height: '100%',
                                display: 'grid',
                                placeContent: 'center',
                            }}
                            hidden={!loading}
                        >
                            <Loader />
                        </div>

                        <div className={styles.infoList} hidden={loading}>
                            <div className={styles.moduleTitle} id="base-info">
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('数据处理计划') + __('名称')}
                                >
                                    {detail?.name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('责任人')}>
                                    {detail?.responsible_uname || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('优先级')}>
                                    {getOptionState(
                                        detail?.priority,
                                        PriorityOptions,
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('计划日期')}>
                                    {!detail?.started_at ? (
                                        '--'
                                    ) : (
                                        <>
                                            {isNumber(detail?.started_at) &&
                                            detail?.started_at
                                                ? moment(
                                                      detail.started_at * 1000,
                                                  ).format('YYYY-MM-DD')
                                                : '--'}

                                            <SwapRightOutlined
                                                style={{ margin: '0 4px' }}
                                            />

                                            {isNumber(detail?.finished_at) &&
                                            detail?.finished_at
                                                ? moment(
                                                      detail.finished_at * 1000,
                                                  ).format('YYYY-MM-DD')
                                                : '--'}
                                        </>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('计划状态')}>
                                    {getOptionState(
                                        detail?.status,
                                        StatusOptions,
                                    ) || '--'}
                                </Descriptions.Item>
                                {detail?.status === 'finished' && (
                                    <Descriptions.Item label={__('完成时间')}>
                                        {isNumber(detail?.updated_at) &&
                                        detail?.updated_at
                                            ? moment(
                                                  detail.updated_at * 1000,
                                              ).format('YYYY-MM-DD')
                                            : '--'}
                                    </Descriptions.Item>
                                )}
                            </Descriptions>
                            <div className={styles.moduleTitle} id="plan-info">
                                <h4>{__('计划信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('计划内容')}
                                    span={2}
                                >
                                    <div
                                        className={styles.editorContent}
                                        dangerouslySetInnerHTML={{
                                            __html: detail?.plan_info || '--',
                                        }}
                                    />
                                </Descriptions.Item>
                                <Descriptions.Item label={__('备注')} span={2}>
                                    {detail?.remark || '--'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div
                                className={styles.moduleTitle}
                                id="relative-order"
                            >
                                <h4>{__('关联工单')}</h4>
                            </div>

                            <div>
                                <RelativeOrder relativeId={id} />
                            </div>
                            <div className={styles.moduleTitle} id="more-info">
                                <h4>{__('更多信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('创建人')}>
                                    {detail?.created_by || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('创建时间')}>
                                    {isNumber(detail?.created_at) &&
                                    detail?.created_at
                                        ? moment(detail.created_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('更新人')}>
                                    {detail?.updated_by || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('更新时间')}>
                                    {isNumber(detail?.updated_at) &&
                                    detail?.updated_at
                                        ? moment(detail.updated_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div className={styles.menuContainer} hidden={loading}>
                            <Anchor
                                targetOffset={48}
                                getContainer={() =>
                                    (container.current as HTMLElement) || window
                                }
                                onClick={(e: any) => e.preventDefault()}
                                className={styles.anchorWrapper}
                            >
                                <Link
                                    href="#base-info"
                                    title={__('基本信息')}
                                />
                                <Link
                                    href="#plan-info"
                                    title={__('计划信息')}
                                />
                                <Link
                                    href="#relative-order"
                                    title={__('关联工单')}
                                />
                                <Link
                                    href="#more-info"
                                    title={__('更多信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default DetailModal
