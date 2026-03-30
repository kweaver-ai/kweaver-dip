import { Button, Drawer, Form, Input, message, Select, TreeSelect } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import moment from 'moment'
import { FC, useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import { useClassificationContext } from './ClassificationProvider'
import { FontIcon } from '@/icons'
import { ContainerBar } from './helper'
import ConfigGradeRule from './ConfigGradeRule'
import {
    createGradeRule,
    editGradeRuleDetail,
    formatError,
    getDataGradeLabel,
    getGradeRuleGroupList,
    getGradeRuleDetail,
} from '@/core'

interface CreateGradingProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    id?: string
    currentGroup?: any
}

const CreateGrading: FC<CreateGradingProps> = ({
    open,
    id,
    onClose,
    onConfirm,
    currentGroup,
}) => {
    const [form] = Form.useForm()
    const { selectedAttribute } = useClassificationContext()

    const [gradeLabelOptions, setGradeLabelOptions] = useState<Array<any>>([])
    const [groupOptions, setGroupOptions] = useState<Array<any>>([])

    useEffect(() => {
        getAllGradeLabel()
        getGroup()
    }, [])

    useEffect(() => {
        if (!id && currentGroup?.id) {
            form.setFieldValue('group_id', currentGroup?.id)
        }
    }, [currentGroup, id])

    useEffect(() => {
        if (selectedAttribute && !id) {
            form.setFieldValue('classifications', {
                grade_rules: [
                    {
                        operator: 'and',
                        classification_rule_subjects: [
                            {
                                id: selectedAttribute.id,
                            },
                            {
                                id: null,
                            },
                        ],
                    },
                ],
            })
        }

        if (id && selectedAttribute) {
            getData()
        }
    }, [selectedAttribute, id])

    /**
     * 将数据格式化为树形结构
     * @param data 数据
     * @returns 树形结构
     */
    const formatDataToTreeData = (data: any) => {
        return data.map((item) => ({
            ...item,
            label: !item?.children?.length ? (
                <div className={styles.selectOptionWrapper}>
                    <FontIcon
                        name="icon-biaoqianicon"
                        style={{
                            fontSize: 20,
                            color: item.icon,
                        }}
                        className={styles.icon}
                    />
                    <span title={item.name} className={styles.name}>
                        {item.name}
                    </span>
                </div>
            ) : (
                item.name
            ),
            value: item.id,
            isLeaf: !item?.children?.length,
            selectable: !item?.children?.length,
            children: item?.children?.length
                ? formatDataToTreeData(item.children)
                : undefined,
        }))
    }
    /**
     * 获取所有分级标签
     */
    const getAllGradeLabel = async () => {
        try {
            const gradeRules = await getDataGradeLabel({
                keyword: '',
                is_show_label: true,
            })
            setGradeLabelOptions(formatDataToTreeData(gradeRules.entries))
        } catch (err) {
            formatError(err)
        }
    }
    /**
     * 获取所有分组
     */
    const getGroup = async () => {
        try {
            const { entries } = await getGradeRuleGroupList({
                business_object_id: selectedAttribute.id,
            })
            setGroupOptions(
                entries.map((o) => ({
                    ...o,
                    value: o.id,
                    label: o.name,
                })),
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
            const data = await getGradeRuleDetail(id)
            form.setFieldsValue({
                name: data.name,
                description: data.description,
                classifications: data.classifications,
                label_id: data.label_id,
                group_id: data.group_id || undefined,
            })
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 格式化GradeRule
     * @param gradeRules
     * @returns
     */
    const formatGradeRules = (gradeRules: any) => {
        return gradeRules.map((item: any) => ({
            operate: item.operate,
            classification_rule_subject_ids:
                item.classification_rule_subjects.map(
                    (subject: any) => subject.id,
                ),
        }))
    }

    /**
     * 提交
     * @param values
     */
    const handleFinish = async (values: any) => {
        try {
            if (id) {
                await editGradeRuleDetail(id, {
                    ...values,
                    subject_id: selectedAttribute.id,
                    classifications: {
                        ...values.classifications,
                        operate: 'or',
                        grade_rules: formatGradeRules(
                            values.classifications.grade_rules,
                        ),
                    },
                })
                message.success(__('编辑成功'))
            } else {
                await createGradeRule({
                    ...values,
                    subject_id: selectedAttribute.id,
                    classifications: {
                        ...values.classifications,
                        operate: 'or',
                        grade_rules: formatGradeRules(
                            values.classifications.grade_rules,
                        ),
                    },
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
                id ? __('编辑探查分级的识别规则') : __('新建探查分级的识别规则')
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
            <div className={styles.createGradingContainer}>
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
                    {/* <Form.Item label={__('所属规则组')} name="group_id">
                        <Select
                            placeholder={__('请选择所属规则组')}
                            options={groupOptions}
                            showSearch
                            filterOption={(input, option) => {
                                if (!option?.name) return false
                                return option.name
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }}
                            allowClear
                            optionFilterProp="name"
                        />
                    </Form.Item> */}
                    <div className={styles.configContainer}>
                        <ContainerBar>
                            <div className={styles.configTitle}>
                                <span className={styles.requiredIcon}>*</span>
                                <span>{__('探查分级的识别配置')}</span>
                            </div>
                        </ContainerBar>
                        <div className={styles.configContent}>
                            <div>
                                {__(
                                    '可配置组：在进行数据“探查”时，如果同一张表（库表）内，识别到以下类别的字段组合，则将当前类别的字段分到指定级别。',
                                )}
                            </div>
                            <div className={styles.configWrapper}>
                                <div className={styles.title}>
                                    {__('如果表（库表）内出现了组合')}
                                </div>
                                <div className={styles.combinationContainer}>
                                    <Form.Item name="classifications" noStyle>
                                        <ConfigGradeRule form={form} />
                                    </Form.Item>
                                </div>
                                <div className={styles.title}>{__('则')}</div>
                                <div className={styles.selectGradeContainer}>
                                    <div className={styles.itemText}>
                                        {__('该表内「')}
                                    </div>
                                    <div className={styles.itemText}>
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
                                    <div className={styles.itemText}>
                                        {__('」类的字段')}
                                    </div>
                                    <div className={styles.selectWrapper}>
                                        <div className={styles.label}>
                                            {__('数据分级')}
                                        </div>
                                        <div className={styles.select}>
                                            <Form.Item
                                                name="label_id"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('请选择分级'),
                                                    },
                                                ]}
                                            >
                                                <TreeSelect
                                                    placeholder={__(
                                                        '请选择分级',
                                                    )}
                                                    treeData={gradeLabelOptions}
                                                    switcherIcon={
                                                        <DownOutlined />
                                                    }
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </Drawer>
    )
}

export default CreateGrading
