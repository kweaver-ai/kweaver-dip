import { Button, Drawer, Form, Input, message, Select } from 'antd'
import moment from 'moment'
import { FC, useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import { useClassificationContext } from './ClassificationProvider'
import { FontIcon } from '@/icons'
import { AlgorithmStatus, AlgorithmType } from './const'
import {
    createClassificationRule,
    editClassificationRule,
    formatError,
    getClassificationRuleDetail,
    getRecognitionAlgorithms,
} from '@/core'

interface CreateClassifyProps {
    open: boolean
    id?: string
    onClose: () => void
    onConfirm: () => void
}

const CreateClassify: FC<CreateClassifyProps> = ({
    open,
    id,
    onClose,
    onConfirm,
}) => {
    const [form] = Form.useForm()
    const { selectedAttribute } = useClassificationContext()
    const [algorithmOptions, setAlgorithmOptions] = useState<Array<any>>([])
    const [searchAlgorithmKey, setSearchAlgorithmKey] = useState('')

    useEffect(() => {
        getAlgorithmList()
    }, [])

    useEffect(() => {
        if (id) {
            getData()
        }
    }, [id])

    const getAlgorithmList = async () => {
        try {
            const { entries } = await getRecognitionAlgorithms({
                offset: 1,
                limit: 999,
                keyword: searchAlgorithmKey,
            })

            setAlgorithmOptions(
                entries?.map((item) => ({
                    label: item.name,
                    value: item.id,
                })) || [],
            )
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 获取数据
     */
    const getData = async () => {
        try {
            if (!id) return
            const detail = await getClassificationRuleDetail(id)
            form.setFieldsValue({
                name: detail.name,
                description: detail.description,
                algorithm_ids: detail.algorithms.map((item) => item.id),
                subject_id: selectedAttribute.id,
            })
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 提交
     * @param values
     */
    const handleFinish = async (values: any) => {
        try {
            if (id) {
                await editClassificationRule(id, {
                    ...values,
                    subject_id: selectedAttribute.id,
                })
                message.success(__('编辑成功'))
            } else {
                await createClassificationRule({
                    ...values,
                    subject_id: selectedAttribute.id,
                })
                message.success(__('新建成功'))
            }
            onConfirm()
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <Drawer
            title={
                id ? __('编辑探查分类的识别规则') : __('新建探查分类的识别规则')
            }
            open={open}
            onClose={() => onClose()}
            width={1024}
            footer={
                <div className={styles.drawerFooterWrapper}>
                    <Button className={styles.button} onClick={onClose}>
                        {__('取消')}
                    </Button>
                    <Button
                        type="primary"
                        className={styles.button}
                        onClick={() => form.submit()}
                    >
                        {__('确定')}
                    </Button>
                </div>
            }
            destroyOnClose
        >
            <div className={styles.createClassifyContainer}>
                <div className={styles.titleContainer}>
                    <FontIcon
                        name="icon-shuxing"
                        style={{
                            fontSize: 20,
                            color: 'rgba(245, 137, 13, 1)',
                        }}
                    />
                    <span className={styles.titleText}>
                        {selectedAttribute.name}
                    </span>
                </div>
                <Form
                    form={form}
                    onFinish={handleFinish}
                    layout="vertical"
                    autoComplete="off"
                >
                    <Form.Item
                        label={__('规则名称')}
                        name="name"
                        required
                        rules={[
                            { required: true, message: __('请输入规则名称') },
                        ]}
                    >
                        <Input placeholder={__('请输入规则名称')} />
                    </Form.Item>
                    <Form.Item label={__('规则描述')} name="description">
                        <Input.TextArea
                            placeholder={__('请输入规则描述')}
                            rows={1}
                            showCount
                            maxLength={300}
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>
                    <div className={styles.configContainer}>
                        <div className={styles.configTitle}>
                            <div>
                                <span className={styles.requiredIcon}>*</span>
                                <span>{__('探查分类的识别配置')}</span>
                            </div>
                            <div className={styles.description}>
                                <span>
                                    {__(
                                        '选择匹配多个识别算法时，数据和任意一条匹配即可分类',
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className={styles.configAlgorithmContainer}>
                            <div className={styles.title}>{__('如果')}</div>
                            <div className={styles.content}>
                                <div className={styles.contentStaticText}>
                                    {__('字段数据')}
                                </div>
                                <div className={styles.splitLine} />
                                <div className={styles.contentStaticText}>
                                    {__('匹配识别算法：')}
                                </div>
                                <div className={styles.configSelect}>
                                    <Form.Item
                                        name="algorithm_ids"
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择识别算法'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            options={algorithmOptions}
                                            placeholder={__(
                                                '请选择识别算法来识别数据',
                                            )}
                                            mode="multiple"
                                            showArrow
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        </div>
                        <div className={styles.configAlgorithmContainer}>
                            <div className={styles.title}>{__('则')}</div>
                            <div className={styles.content}>
                                <div className={styles.contentStaticText}>
                                    {__('识别字段分类为：')}
                                </div>
                                <div className={styles.attrContainer}>
                                    <FontIcon
                                        name="icon-shuxing"
                                        style={{
                                            fontSize: 20,
                                            color: 'rgba(245, 137, 13, 1)',
                                        }}
                                    />
                                    <span className={styles.attrText}>
                                        {selectedAttribute.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </Drawer>
    )
}

export default CreateClassify
