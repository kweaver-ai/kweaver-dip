import {
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    message,
    Row,
    Space,
    Tooltip,
} from 'antd'
import { trim } from 'lodash'
import { useContext, useEffect, useRef, useState } from 'react'
import moment from 'moment'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameDataAggregationInventories,
    createDataAggregationInventories,
    formatError,
    getDataAggregationInventoriesDetail,
    updateDataAggregationInventories,
} from '@/core'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { nameReg, validateName } from '@/utils'
import Return from '../Return'
import __ from './locale'
import styles from './styles.module.less'
import CollectionTable from './CollectionTable'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import { CreateMethod } from './helper'

const OptModal = ({ id, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [detail, setDetail] = useState<any>()
    const [resources, setResources] = useState<any[]>([])

    const needDeclaration = useRef<boolean>(false)
    const getDetail = async () => {
        try {
            const res = await getDataAggregationInventoriesDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    useEffect(() => {
        if (detail) {
            const { name, resources: detailResources } = detail

            const transData = (detailResources || [])?.map((it: any) => {
                return {
                    ...it,
                    collected_at: it?.collected_at
                        ? moment(it?.collected_at)
                        : undefined,
                    id: it?.data_view_id,
                }
            })
            setResources(transData)

            form?.setFieldsValue({
                name,
                resources: transData,
            })
        } else {
            form?.resetFields()
            setResources([])
        }
    }, [detail, form])

    const validateNameRepeat = (fid?: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                    return
                }
                if (trimValue && !nameReg.test(trimValue)) {
                    reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
                    return
                }
                const errorMsg = __('该名称已存在，请重新输入')
                checkNameDataAggregationInventories({
                    name: trimValue,
                    id: fid,
                })
                    .then((res) => {
                        if (res?.exists) {
                            reject(new Error(errorMsg))
                        } else {
                            resolve(1)
                        }
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    const onFinish = async (values) => {
        const params = {
            ...values,
            creation_method: CreateMethod.Raw,
            resources: (values?.resources || [])?.map((it) => {
                return {
                    data_view_id: it?.id,
                    // collected_at: it?.collected_at
                    //     ? moment(it?.collected_at).format(
                    //           'YYYY-MM-DDTHH:mm:ssZ',
                    //       )
                    //     : undefined,
                    collection_method: it?.collection_method,
                    sync_frequency: it?.sync_frequency,
                    target_datasource_id: it?.target_datasource_id,
                }
            }),
            status: needDeclaration.current ? 'Auditing' : 'Draft',
        }
        if (
            params?.resources.some((it) =>
                Object.keys(it).some((key) => !it[key]),
            )
        ) {
            message.warn('清单资源配置项缺失')
            return
        }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateDataAggregationInventories(id, params)
            } else {
                await createDataAggregationInventories(params)
            }

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const handleResourcesChange = (newResources) => {
        setResources(newResources)

        form.setFieldsValue({ resources: newResources })
    }

    const handleBack = () => {
        const values = form.getFieldsValue()

        const hasValue = Object.values(values).some((value) => !!value)
        if (hasValue) {
            ReturnConfirmModal({
                onCancel: () => onClose(false),
            })
        } else {
            onClose(false)
        }
    }

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
                        onReturn={() => handleBack()}
                        title={
                            (id ? __('编辑') : __('新建')) + __('数据归集清单')
                        }
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                            >
                                <Row
                                    gutter={40}
                                    className={styles.contentWrapper}
                                >
                                    <Col span={24}>
                                        <Form.Item
                                            label={
                                                __('数据归集清单') + __('名称')
                                            }
                                            name="name"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                            rules={[
                                                {
                                                    required: true,
                                                    validateTrigger: 'onChange',
                                                    validator: validateName(),
                                                },
                                                {
                                                    validateTrigger: 'onBlur',
                                                    validator:
                                                        validateNameRepeat(id),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__('请输入名称')}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name="resources"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                        >
                                            <DataViewProvider>
                                                <CollectionTable
                                                    value={resources}
                                                    onChange={
                                                        handleResourcesChange
                                                    }
                                                />
                                            </DataViewProvider>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>
                            <Button
                                onClick={() => {
                                    needDeclaration.current = false
                                    form.submit()
                                }}
                            >
                                {__('暂存')}
                            </Button>
                            <Tooltip
                                title={
                                    !resources?.length ? __('请先添加资源') : ''
                                }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        needDeclaration.current = true
                                        form.submit()
                                    }}
                                    disabled={!resources?.length}
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default OptModal
