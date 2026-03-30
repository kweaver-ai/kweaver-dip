import React, { useEffect, useMemo, useState } from 'react'
import { Button, Col, Drawer, Form, Input, message, Row, Space } from 'antd'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'
import DrawerHeader from '../component/DrawerHeader'
import styles from './styles.module.less'
import __ from '../locale'
import { CommonTitle } from '@/ui'
import {
    formatError,
    getCityShareApplyDetail,
    ISharedApplyDetail,
    shareApplyFeedback,
} from '@/core'
import { applyFieldsConfig } from '../Details/helper'
import { ResTypeEnum } from '../helper'
import ResourceTable from '../Analysis/ResourceTable'
import CatalogTable from '../Apply/CatalogTable'

interface IFeedback {
    open: boolean
    onClose?: () => void
    onOk?: () => void
    // 共享申请 id
    applyId?: string
}

const Feedback: React.FC<IFeedback> = ({ open, onClose, applyId, onOk }) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<ISharedApplyDetail>()
    const [saveLoading, setSaveLoading] = useState<boolean>(false)
    const [catalogsData, setCatalogsData] = useState<any[]>([])

    const navigator = useNavigate()

    useEffect(() => {
        if (applyId) {
            getDetails()
        }
    }, [applyId])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(applyId!, {
                fields: 'base,analysis',
            })
            setDetails(res)
            const baseResources = res.base.resources || []
            const analysisResources = res.analysis?.resources || []
            const clgData = baseResources.map((resource) => {
                const { apply_conf, ...restSource } = resource
                const { view_apply_conf, api_apply_conf, ...restApplyConf } =
                    apply_conf
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )

                const { id, ...restAnalysisRes } = analysisRes || {}
                return {
                    ...restSource,
                    ...restAnalysisRes,
                    analysis_item_id: id,
                    configFinish: !!analysisRes,
                    replace_res: !analysisRes?.is_res_replace
                        ? undefined
                        : {
                              res_type: ResTypeEnum.Catalog,
                              res_id: analysisRes?.new_res_id,
                              res_code: analysisRes?.new_res_code,
                              res_name: analysisRes?.new_res_name,
                              org_path: analysisRes?.org_path,
                              apply_conf: analysisRes?.apply_conf,
                          },
                    apply_conf: {
                        ...restApplyConf,
                        view_apply_conf: view_apply_conf
                            ? {
                                  ...view_apply_conf,
                                  columns: JSON.parse(
                                      view_apply_conf.column_names,
                                  ).map((c, cIdx) => ({
                                      business_name: c,
                                      id: view_apply_conf.column_ids.split(',')[
                                          cIdx
                                      ],
                                  })),
                              }
                            : undefined,
                        api_apply_conf: api_apply_conf || undefined,
                    },
                }
            })
            setCatalogsData([
                ...clgData,
                ...analysisResources
                    .filter((item) => item.is_new_res)
                    .map((item) => {
                        return {
                            ...item,
                            configFinish: true,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                        }
                    }),
            ])
        } catch (error) {
            formatError(error)
        }
    }

    // 提交申请
    const onFinish = async (values) => {
        try {
            setSaveLoading(true)
            await shareApplyFeedback(applyId!, values)
            onClose?.()
            onOk?.()
            message.success(__('提交成功'))
        } catch (err) {
            formatError(err)
        } finally {
            setSaveLoading(false)
        }
    }

    const getApplyInfo = () => {
        return applyFieldsConfig.map((item) => {
            return (
                <Col
                    key={item.key}
                    className={styles['basic-item']}
                    span={item.span}
                >
                    <div className={styles.label}>{item.label}：</div>
                    <div className={styles.value}>
                        {item.render
                            ? item.render(
                                  details?.base[item.key],
                                  details?.base || {},
                              )
                            : details?.base[item.key] || '--'}
                    </div>
                </Col>
            )
        })
    }

    return (
        <Drawer
            open={open}
            width="100%"
            placement="right"
            closable={false}
            bodyStyle={{
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 1080,
            }}
            contentWrapperStyle={{ minWidth: 800 }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            push={false}
        >
            <div className={classNames(styles['feedback-wrapper'])}>
                {/* 导航头部 */}
                <DrawerHeader
                    title={__('成效反馈')}
                    fullScreen
                    onClose={onClose}
                />

                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <div className={styles['content-body']}>
                            <div className={styles['common-title']}>
                                <CommonTitle title={__('申请信息')} />
                            </div>
                            <Row className={styles['apply-info-row']}>
                                {getApplyInfo()}
                            </Row>
                            <div className={styles['common-title']}>
                                <CommonTitle title={__('申请资源清单')} />
                            </div>
                            <div className={styles['catalog-table-container']}>
                                <CatalogTable
                                    isView
                                    items={catalogsData || []}
                                />
                            </div>
                            <div className={styles['common-title']}>
                                <CommonTitle title={__('反馈内容')} />
                            </div>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                            >
                                <Form.Item
                                    label={__('服务成效')}
                                    name="feedback_content"
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请输入'),
                                        },
                                    ]}
                                >
                                    <Input.TextArea
                                        className={styles['feedback-textarea']}
                                        placeholder={__('请输入')}
                                        maxLength={300}
                                    />
                                </Form.Item>
                            </Form>
                        </div>

                        {/* 底部栏 */}
                        <div className={styles.footer}>
                            <Space>
                                <Button
                                    className={styles.btn}
                                    onClick={() => {
                                        onClose?.()
                                    }}
                                >
                                    {__('取消')}
                                </Button>
                                <Button
                                    type="primary"
                                    className={styles.btn}
                                    loading={saveLoading}
                                    onClick={() => form.submit()}
                                >
                                    {__('提交')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default Feedback
