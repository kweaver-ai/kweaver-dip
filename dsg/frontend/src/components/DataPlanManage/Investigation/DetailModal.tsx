import { Anchor, Descriptions, Drawer } from 'antd'
import moment from 'moment'
import { useEffect, useRef, useState } from 'react'
import { formatError, getInvestigationReportDetail } from '@/core'
import Return from '../Return'
import __ from './locale'
import styles from './styles.module.less'
import { Loader } from '@/ui'

const { Link } = Anchor
function DetailModal({ id, onClose, isAudit }: any) {
    const [detail, setDetail] = useState<any>()
    const container = useRef<any>(null)
    const [loading, setLoading] = useState(false)
    const getDetail = async () => {
        try {
            setLoading(true)
            const res = await getInvestigationReportDetail(id)
            if (isAudit && res?.change_audit) {
                setDetail({ ...(res || {}), ...(res?.change_audit || {}) })
            } else {
                setDetail(res)
            }
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
                                    label={__('调研报告') + __('名称')}
                                >
                                    {detail?.name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('关联工单')}>
                                    {detail?.work_order_name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('调研目的')}>
                                    {detail?.research_purpose || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('调研对象')}>
                                    {detail?.research_object || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={__('调研方法')}
                                    span={2}
                                >
                                    {detail?.research_method || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('备注')} span={2}>
                                    {detail?.remark || '--'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div
                                className={styles.moduleTitle}
                                id="plan-content"
                            >
                                <h4>{__('调研信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '126px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('调研内容')}
                                    span={2}
                                >
                                    <div
                                        className={styles.editorContent}
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                detail?.research_content ||
                                                '--',
                                        }}
                                    />
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={__('调研结论')}
                                    span={2}
                                >
                                    {detail?.research_conclusion || '--'}
                                </Descriptions.Item>
                            </Descriptions>

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
                                    {detail?.created_by_user_name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('创建时间')}>
                                    {detail?.created_at
                                        ? moment(detail.created_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('更新人')}>
                                    {detail?.updated_by_user_name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('更新时间')}>
                                    {detail?.updated_at
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
                                    href="#plan-content"
                                    title={__('调研信息')}
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
