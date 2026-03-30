import React, { useEffect, useState } from 'react'
import {
    Drawer,
    Form,
    Input,
    TreeSelect,
    message,
    Button,
    Checkbox,
} from 'antd'
import { trim } from 'lodash'
import { QuestionCircleOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { OperateType } from '@/utils'
import ConfigColor from './ConfigColor'
import {
    DataGradeLabelType,
    IGradeLabel,
    checkGradeLabelName,
    createDataGradeLabel,
    formatError,
    getDataGradeLabel,
    getGradeLabelIcons,
} from '@/core'
import {
    CreateType,
    colorList,
    generateData,
    sensitiveOptions,
    classifiedOptoins,
    shareTypeOptoins,
} from './const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { LabelTitle } from '../ApiServices/helper'
import CustomRadio from '@/ui/CustomRadio'
import { TipsLabel } from '../BusinessTagAuthorization/helper'
import { getTabByUsing } from './helper'

interface IAddTag {
    open: boolean
    onClose: () => void
    operateType: OperateType
    onSuccess?: () => void
    data?: IGradeLabel
}
const AddTag: React.FC<IAddTag> = ({
    open,
    onClose,
    operateType,
    onSuccess = () => {},
    data,
}) => {
    const [form] = Form.useForm()
    const [dataSource, setDataSource] = useState<
        (IGradeLabel | { name: string; id: string })[]
    >([])
    const [colors, setColors] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSensitive, setHasSensitive] = useState(false)
    const [hasShared, setHasShared] = useState(false)
    const [hasClassified, setHasClassified] = useState(false)
    const [dataProtection, setDataProtection] = useState(false)
    const [{ using }] = useGeneralConfig()

    const getIcons = async () => {
        try {
            let res = await getGradeLabelIcons()
            res = res || []
            if (data && operateType === OperateType.EDIT) {
                setColors(res.filter((color) => color !== data.icon))
            } else {
                setColors(res || [])
                const targetColor = colorList.find(
                    (color) => !res.includes(color),
                )
                form.setFieldsValue({
                    icon: targetColor,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (data && operateType === OperateType.EDIT) {
            setHasSensitive(!!data.sensitive_attri)
            setHasShared(!!data.share_condition)
            setHasClassified(!!data.secret_attri)
            setDataProtection(!!data.data_protection_query)
            form.setFieldsValue({
                name: data.name,
                parentId: data.parent_id,
                icon: data.icon,
                description: data.description,
                share_condition: data.share_condition,
                secret_attri: data.secret_attri,
                sensitive_attri: data.sensitive_attri,
            })
        }
    }, [data])

    // 查询
    const getTable = async () => {
        try {
            const res = await getDataGradeLabel({
                keyword: '',
                is_show_label: false,
            })
            generateData(
                res.entries,
                (item) => item.node_type === DataGradeLabelType.Node,
            )
            setDataSource([...res.entries, { name: __('无'), id: '1' }])
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (open) {
            getTable()
            getIcons()
        }
    }, [open])

    const onFinish = async (values) => {
        try {
            setLoading(true)
            await createDataGradeLabel({
                ...values,
                nodeType: CreateType.Tag,
                id: data?.id,
                data_protection_query: dataProtection,
            })
            message.success(data ? __('编辑成功') : __('新建成功'))
            onClose()
            onSuccess()
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            const res = await checkGradeLabelName({
                id: operateType === OperateType.CREATE ? '' : data?.id,
                name: trimValue,
                node_type: CreateType.Tag,
            })
            if (res) {
                return Promise.reject(
                    new Error(__('该标签名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        } catch (error) {
            formatError(error)
            return Promise.resolve()
        }
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={640}
            title={
                operateType === OperateType.CREATE
                    ? __('新建标签')
                    : __('编辑标签')
            }
            bodyStyle={{ padding: '0' }}
            className={styles['add-tag-wrapper']}
            footer={null}
            maskClosable={false}
        >
            <Form
                form={form}
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
                className={styles['form-wrapper']}
            >
                <LabelTitle label={__('基本属性')} />
                <Form.Item
                    label={__('级别名称')}
                    name="name"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('输入不能为空'),
                            transform: (val) => trim(val),
                        },

                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) => validateNameRepeat(value),
                        },
                    ]}
                >
                    <Input placeholder={__('请输入标签名称')} maxLength={128} />
                </Form.Item>
                <Form.Item label={__('描述')} name="description">
                    <Input
                        placeholder={__('请输入描述')}
                        maxLength={300}
                        showCount
                    />
                </Form.Item>
                <Form.Item
                    label={__('级别所属分组')}
                    name="parentId"
                    initialValue="1"
                    className={
                        operateType === OperateType.EDIT
                            ? styles['tree-select-wrapper']
                            : ''
                    }
                >
                    <TreeSelect
                        popupClassName={styles['common-tree-select']}
                        getPopupContainer={(node) => node.parentNode}
                        fieldNames={{ label: 'name', value: 'id' }}
                        treeData={dataSource}
                    />
                </Form.Item>
                {operateType === OperateType.EDIT && (
                    <div className={styles['group-tips']}>
                        {__(
                            '提示：更改分组可能会影响级别的高低（级别的高低：从上往下，越在上方的级别越高，最上方的级别最高，和是否在标签组无关。）',
                        )}
                    </div>
                )}
                <Form.Item label="" name="icon">
                    <ConfigColor disabledColors={colors} />
                </Form.Item>
                {using === 1 ? (
                    <>
                        <LabelTitle
                            label={
                                <TipsLabel
                                    label={__('数据资源目录属性预设')}
                                    maxWidth="520px"
                                    icon={<QuestionCircleOutlined />}
                                    tips={
                                        <div>
                                            <div style={{ fontWeight: 550 }}>
                                                {__('数据资源目录属性预设')}
                                            </div>
                                            <div>
                                                {__(
                                                    '预设值：编目时，目录信息项选择的属性条件若符合当前级别的预设值，则信息项级别自动归类到当前分级；若不设置预设值或3个预设值均相同，则分级就高不就低（分级标签管理列表中，标签顺序越靠上的级别越高）。',
                                                )}
                                            </div>
                                        </div>
                                    }
                                />
                            }
                            extra={getTabByUsing(using)}
                        />
                        <div className={styles['checkbox-wrapper']}>
                            <Checkbox
                                onChange={(e) =>
                                    setHasSensitive(e.target.checked)
                                }
                                checked={hasSensitive}
                            >
                                {__('“敏感属性”预设值')}
                                {hasSensitive ? '：' : ''}
                            </Checkbox>
                            {hasSensitive ? (
                                <Form.Item label="" name="sensitive_attri">
                                    <CustomRadio
                                        options={sensitiveOptions}
                                        canCancel={false}
                                    />
                                </Form.Item>
                            ) : null}
                        </div>
                        <div className={styles['checkbox-wrapper']}>
                            <Checkbox
                                onChange={(e) =>
                                    setHasClassified(e.target.checked)
                                }
                                checked={hasClassified}
                            >
                                {__('“涉密属性”预设值')}
                                {hasClassified ? '：' : ''}
                            </Checkbox>
                            {hasClassified ? (
                                <Form.Item label="" name="secret_attri">
                                    <CustomRadio
                                        options={classifiedOptoins}
                                        canCancel={false}
                                    />
                                </Form.Item>
                            ) : null}
                        </div>
                        <div className={styles['checkbox-wrapper']}>
                            <Checkbox
                                onChange={(e) => setHasShared(e.target.checked)}
                                checked={hasShared}
                            >
                                {__('“共享属性”预设值')}
                                {hasShared ? '：' : ''}
                            </Checkbox>
                            {hasShared ? (
                                <Form.Item label="" name="share_condition">
                                    <CustomRadio
                                        options={shareTypeOptoins as any[]}
                                        canCancel={false}
                                    />
                                </Form.Item>
                            ) : null}
                        </div>
                    </>
                ) : null}
                <LabelTitle
                    label={
                        <TipsLabel
                            label={__('库表数据保护')}
                            maxWidth="724px"
                            icon={<QuestionCircleOutlined />}
                            tips={
                                <div>
                                    <div style={{ fontWeight: 550 }}>
                                        {__('库表数据保护')}
                                    </div>
                                    {__(
                                        '对库表的数据进行保护，若表内的字段属于当前级别，则此字段下方的数据遵循已选择的保护方式。另外，启用数据保护后，对库表有管理权限的用户仍然可以正常查询数据以及做相关的管理操作。',
                                    )}
                                </div>
                            }
                        />
                    }
                />
                <Form.Item label="" name="data_protection_query">
                    <Checkbox
                        onChange={(e) => setDataProtection(e.target.checked)}
                        checked={dataProtection}
                    >
                        {__('数据查询保护')}
                    </Checkbox>
                    <div className={styles['checkbox-tips']}>
                        {__('勾选后，当前级别的数据受到保护，禁止查询')}
                    </div>
                </Form.Item>
            </Form>
            <div className={styles.footer}>
                <Button onClick={onClose}>{__('取消')}</Button>
                <Button
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    {__('确定')}
                </Button>
            </div>
        </Drawer>
    )
}

export default AddTag
