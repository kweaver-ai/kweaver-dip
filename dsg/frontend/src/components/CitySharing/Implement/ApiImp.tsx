import {
    Button,
    Col,
    Drawer,
    Form,
    InputNumber,
    message,
    Row,
    Space,
} from 'antd'
import classnames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import styles from './styles.module.less'
import DrawerHeader from '../component/DrawerHeader'
import __ from '../locale'
import { CommonTitle } from '@/ui'
import { ApiImpConfig } from './helper'
import {
    detailServiceOverview,
    formatError,
    getResourceDetailsByAnalysisId,
    implementApiCityShare,
} from '@/core'
import { resourceUtilizationOptions } from '../Apply/helper'

interface ApiImpProps {
    open: boolean
    onClose: () => void
    applyId: string
    analysisId: string
    isView?: boolean
}
export const ApiImp = ({
    open,
    onClose,
    applyId,
    analysisId,
    isView = true,
}: ApiImpProps) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<any>({})

    const handleSave = async () => {
        await implementApiCityShare(applyId, analysisId)
        message.success(__('提交成功'))
        onClose()
    }

    const getApiImpDetail = async () => {
        try {
            const res = await getResourceDetailsByAnalysisId(
                applyId,
                analysisId,
            )
            const detailsService = await detailServiceOverview(
                res.src_item.apply_conf.api_apply_conf.data_res_id,
            )
            const {
                analyst,
                analyst_phone,
                applier,
                apply_org_name,
                apply_org_path,
                phone,
            } = res
            setDetails({
                analyst,
                analyst_phone,
                applier,
                phone,
                apply_org_name,
                apply_org_path,
                data_res_name:
                    res.src_item.apply_conf.api_apply_conf.data_res_name,
                data_res_code:
                    res.src_item.apply_conf.api_apply_conf.data_res_code,
                res_name: res.src_item.res_name,
                res_code: res.src_item.res_code,
                apply_name: res.name,
                org_path: res.src_item.org_path,
                supply_type: __('接口对接'),
                call_frequency:
                    res.src_item.apply_conf.api_apply_conf.call_frequency,
                available_date_type: resourceUtilizationOptions.find(
                    (item) =>
                        item.value ===
                        res.src_item.apply_conf.available_date_type,
                )?.label,
                ...(res.implement || {}),
                service_path: detailsService.service_info.backend_service_path,
            })
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (open && applyId && analysisId) {
            getApiImpDetail()
        }
    }, [open])

    return (
        <Drawer
            open={open}
            width="100%"
            placement="right"
            closable={false}
            bodyStyle={{
                padding: 0,
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
            <div
                className={classnames(
                    styles.details,
                    styles['analysis-details-wrapper'],
                )}
            >
                <DrawerHeader
                    title={__('数据资源实施')}
                    fullScreen
                    onClose={onClose}
                />
                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <div className={styles['content-body']}>
                            {ApiImpConfig.map((group) => (
                                <div key={group.key}>
                                    <CommonTitle title={group.title} />
                                    <Row style={{ marginTop: 24 }}>
                                        {group.configs.map((c) => (
                                            <Col
                                                key={c.key.toString()}
                                                span={c.span || 12}
                                            >
                                                <div
                                                    className={
                                                        styles['basic-item']
                                                    }
                                                >
                                                    <div
                                                        className={styles.label}
                                                    >
                                                        {c.label}：
                                                    </div>
                                                    <div
                                                        className={styles.value}
                                                    >
                                                        {details[c.key] || '--'}
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ))}
                            {/* {isView ? (
                                <div>
                                    <div className={styles['basic-item']}>
                                        <div className={styles.label}>
                                            {__('调用频率')}：
                                        </div>
                                        <div className={styles.value}>
                                            100{__('次/秒')}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Form form={form} autoComplete="off">
                                    <Space>
                                        <Form.Item
                                            name="call_frequency"
                                            label={__('调用频率')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请输入'),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder={__('请输入')}
                                                min={1}
                                                max={100}
                                            />
                                        </Form.Item>
                                        <div
                                            className={styles['unit-container']}
                                        >
                                            {__('次/秒')}
                                        </div>
                                    </Space>
                                </Form>
                            )} */}
                        </div>
                        {!isView && (
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
                                    {/* <Button
                                        className={styles.btn}
                                        onClick={() => {}}
                                    >
                                        {__('暂存')}
                                    </Button> */}
                                    <Button
                                        type="primary"
                                        className={styles.btn}
                                        // loading={saveLoading}
                                        onClick={() => {
                                            handleSave()
                                        }}
                                    >
                                        {__('提交')}
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default ApiImp
