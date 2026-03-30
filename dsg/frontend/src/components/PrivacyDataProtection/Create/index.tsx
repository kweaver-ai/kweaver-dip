import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Select, Form, Input, Modal, Button, Space, message } from 'antd'
import { AddOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import {
    formatError,
    dataTypeMapping,
    getDataPrivacyPolicyDetails,
    getDatasheetViewDetails,
    updateDataPrivacyPolicy,
    createDataPrivacyPolicy,
} from '@/core'
import { RuleExpression } from '@/components/DatasheetView/DatasourceExploration/const'
import ChooseLogicalViewSingle from '@/components/SensitiveDataWhiteList/LogicalViewModal'
import { handleRunSqlParam } from '@/components/DatasheetView/DatasourceExploration/helper'
import FilterDataView from '../FilterDataView'
import PrivacyTable from './PrivacyTable'
import FieldSelectModal from './FieldSelectModal'

interface ICreate {
    open: boolean
    onClose: (flag?: boolean) => void
    id?: any
}

const Create = (props: ICreate, ref) => {
    const { open, onClose, id } = props
    const [form] = Form.useForm()
    const ruleFieldRef = useRef<any>(null)

    const [fieldList, setFieldList] = useState<any[]>([])
    const [detailsInfos, setDetailsInfos] = useState<any>({})
    const [privacyTableData, setPrivacyTableData] = useState<any[]>([])
    const [selectedDataView, setSelectedDataView] = useState<any>({})
    const [viewVisible, setViewVisible] = useState<boolean>(false)
    const [fieldSelectModalVisible, setFieldSelectModalVisible] =
        useState<boolean>(false)
    const [filterDataViewVisible, setFilterDataViewVisible] =
        useState<boolean>(false)
    const [privacyErrTips, setPrivacyErrTips] = useState<string>('')
    const [configInfo, setConfigInfo] = useState<any>({})
    const [isValidate, setIsValidate] = useState<boolean>(false)

    const isEdit = useMemo(() => {
        return !!id
    }, [id])

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id])

    const getDetails = async () => {
        try {
            const res = await getDataPrivacyPolicyDetails(id)
            form.setFieldsValue({
                description: res?.description,
                business_name: res?.business_name,
            })
            setSelectedDataView({
                id: res?.form_view_id,
                business_name: res?.business_name,
            })
            setPrivacyTableData(
                res?.field_list?.map((item) => ({
                    ...item,
                    id: item.form_view_field_id,
                    business_name: item.form_view_field_business_name,
                    is_edit: true,
                })) || [],
            )
            setDetailsInfos(res)
            getFormViewDetails(res.form_view_id)
        } catch (err) {
            formatError(err)
        }
    }

    const onFinish = async (values) => {
        const res = {
            business_name: isEdit ? undefined : values.business_name,
            form_view_id: isEdit ? undefined : selectedDataView.id,
            description: values.description,
            id: id || undefined,
            field_list: privacyTableData?.map((item) => ({
                form_view_field_id: item.id,
                desensitization_rule_id: item.desensitization_rule_id,
            })),
        }
        if (
            !privacyTableData?.length ||
            privacyTableData.some((item) => !item.desensitization_rule_id)
        ) {
            setPrivacyErrTips(
                !privacyTableData?.length
                    ? __('脱敏字段不能为空')
                    : __('脱敏规则不能为空'),
            )
            setIsValidate(true)
            return
        }
        setIsValidate(false)
        setPrivacyErrTips('')

        const action = isEdit
            ? updateDataPrivacyPolicy
            : createDataPrivacyPolicy
        try {
            await action(res)
            message.success(isEdit ? __('编辑成功') : __('新建成功'))
            onClose(true)
        } catch (err) {
            formatError(err)
        }
    }

    const handleChooseView = (list: any[]) => {
        const [formView] = list
        setSelectedDataView(formView || {})
        form.setFieldValue('business_name', formView.business_name)
        getFormViewDetails(formView.id)
        setPrivacyTableData([])
    }

    const getFormViewDetails = async (formViewId: string) => {
        try {
            const res = await getDatasheetViewDetails(formViewId)
            // 过滤已删除、二进制字段
            const list = res?.fields?.filter(
                (item) =>
                    item.status !== 'delete' &&
                    !dataTypeMapping.binary.includes(item.data_type),
            )
            setFieldList(list)
        } catch (err) {
            formatError(err)
        }
    }

    const fieldHandleSubmit = (o: any[]) => {
        setPrivacyTableData(
            o?.map((item) => ({
                ...item,
                form_view_field_id: item.id,
                form_view_field_business_name: item.business_name,
            })),
        )
        setFieldSelectModalVisible(false)
    }

    return (
        <div className={styles.createWrapper}>
            <Modal
                title={isEdit ? __('编辑策略') : __('新建保护策略')}
                onCancel={() => onClose()}
                open={open}
                width={1024}
                bodyStyle={{
                    padding: '16px 24px',
                }}
                destroyOnClose
                footer={
                    <Space
                        size={12}
                        style={{
                            display: 'flex',
                            justifyContent: 'end',
                        }}
                    >
                        <Button onClick={() => onClose()}>{__('取消')}</Button>
                        {/* <Button
                            disabled={!selectedDataView?.id}
                            onClick={() => {
                                const invaildFields = privacyTableData?.filter(
                                    (item) => item.desensitization_rule_id,
                                )
                                const info = {
                                    form_view_id:
                                        selectedDataView.id ||
                                        detailsInfos.form_view_id,
                                    form_view_field_ids: invaildFields?.map(
                                        (item) => item.form_view_field_id,
                                    ),
                                    desensitization_rule: invaildFields?.map(
                                        (item) => item.desensitization_rule_id,
                                    ),
                                }
                                setConfigInfo(info)
                                setFilterDataViewVisible(true)
                            }}
                        >
                            {__('测试过滤效果')}
                        </Button> */}
                        <Button type="primary" onClick={() => form.submit()}>
                            {__('确定')}
                        </Button>
                    </Space>
                }
            >
                <div className={styles.formWrapper}>
                    <Form
                        autoComplete="off"
                        onFinish={onFinish}
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            label={__('策略应用对象')}
                            name="business_name"
                            validateFirst
                            rules={[
                                {
                                    required: true,
                                    message: __('策略应用对象不能为空'),
                                },
                            ]}
                        >
                            <div className={styles.selectView}>
                                <Input
                                    placeholder={__('请选择策略应用对象')}
                                    readOnly
                                    disabled={isEdit}
                                    value={selectedDataView.business_name}
                                />
                                {!isEdit && (
                                    <Button
                                        className={styles.selectViewBtn}
                                        onClick={() => setViewVisible(true)}
                                    >
                                        {__('选择库表')}
                                    </Button>
                                )}
                            </div>
                        </Form.Item>
                        <Form.Item label={__('策略描述')} name="description">
                            <Input.TextArea
                                placeholder={__('请输入策略描述')}
                                maxLength={300}
                                showCount
                                className={styles.textArea}
                                rows={1}
                                autoSize={false}
                                style={{ resize: 'none' }}
                            />
                        </Form.Item>
                        <div className={styles.configRow}>
                            <div className={styles.requiredFlag}>*</div>
                            {__('脱敏配置')}
                        </div>
                        <div className={styles.privacyConfig}>
                            {selectedDataView.id && (
                                <a
                                    onClick={() =>
                                        setFieldSelectModalVisible(true)
                                    }
                                >
                                    <AddOutlined className={styles.icon} />
                                    {__('添加脱敏字段')}
                                </a>
                            )}
                            {privacyTableData?.length ? (
                                <PrivacyTable
                                    isValidate={isValidate}
                                    dataSource={privacyTableData}
                                    onChange={(o) => setPrivacyTableData(o)}
                                />
                            ) : null}
                            {privacyErrTips && (
                                <div className={styles.requiredFlag}>
                                    {privacyErrTips}
                                </div>
                            )}
                        </div>
                    </Form>
                </div>
            </Modal>
            {viewVisible && (
                <ChooseLogicalViewSingle
                    open={viewVisible}
                    onClose={() => {
                        setViewVisible(false)
                    }}
                    isRelatePrivacyData
                    onSure={handleChooseView}
                />
            )}
            {filterDataViewVisible && (
                <FilterDataView
                    open={filterDataViewVisible}
                    onClose={() => {
                        setFilterDataViewVisible(false)
                    }}
                    configInfo={configInfo}
                />
            )}
            {fieldSelectModalVisible && (
                <FieldSelectModal
                    initialSelected={privacyTableData}
                    visible={fieldSelectModalVisible}
                    fieldList={fieldList}
                    onCancel={() => setFieldSelectModalVisible(false)}
                    onSubmit={fieldHandleSubmit}
                />
            )}
        </div>
    )
}

export default Create
