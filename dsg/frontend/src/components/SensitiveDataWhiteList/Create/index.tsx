import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Select, Form, Input, Modal, Button, Space, Radio, message } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import __ from '../locale'
import {
    formatError,
    getWhiteListDetails,
    createWhiteList,
    updateWhiteList,
    dataTypeMapping,
    getDatasheetViewDetails,
    IRuleCondition,
} from '@/core'
import { LabelTitle } from '@/components/BusinessTagClassify/helper'
import { detailsInfo } from '../const'
import { RuleExpression } from '@/components/DatasheetView/DatasourceExploration/const'
import RuleFieldConfig from '@/components/DatasheetView/DatasourceExploration/RuleFieldConfig'
import SqlConfig from '@/components/DatasheetView/DatasourceExploration/RulesModal/SqlConfig'
import ChooseLogicalViewSingle from '../LogicalViewModal'
import { handleRunSqlParam } from '@/components/DatasheetView/DatasourceExploration/helper'
import FilterDataView from '../FilterDataView'
import { isJsonString } from '@/components/DataDownload/const'

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
    const [ruleExpression, setRuleExpression] = useState<RuleExpression>(
        RuleExpression.Sql,
    )
    const [sqlScript, setSqlScript] = useState<string>('')
    const [customRuleConfig, setCustomRuleConfig] = useState<any>()
    const [configInfo, setConfigInfo] = useState<any>({})
    const [selectedDataView, setSelectedDataView] = useState<any>({})
    const [viewVisible, setViewVisible] = useState<boolean>(false)
    const [filterDataViewVisible, setFilterDataViewVisible] =
        useState<boolean>(false)
    const [errTips, setErrTips] = useState<string>('')

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
            const res = await getWhiteListDetails(id)
            form.setFieldsValue({
                description: res?.description,
                name: res?.form_view_name,
            })
            setSelectedDataView({
                id: res?.form_view_id,
                business_name: res?.form_view_name,
            })
            if (isJsonString(res?.configs)) {
                setRuleExpression(RuleExpression.Field)
                const config = JSON.parse(res?.configs)
                setCustomRuleConfig(config?.rule_expression)
            } else {
                setRuleExpression(RuleExpression.Sql)
                setSqlScript(res?.configs)
            }
            getFormViewDetails(res?.form_view_id)
            setDetailsInfos(res)
        } catch (err) {
            formatError(err)
        }
    }

    const getSubmitData = async (values) => {
        const rule_condition: IRuleCondition =
            await ruleFieldRef?.current?.onFinish()
        const sql_condition = handleRunSqlParam(sqlScript.trim())
        const configs: string = JSON.stringify(
            ruleExpression === RuleExpression.Sql
                ? { rule_expression: { sql: sql_condition || '' } }
                : rule_condition,
        )

        const info = {
            form_view_id: selectedDataView.id || detailsInfos.form_view_id,
            description: values.description,
            id: id || undefined,
            configs,
        }
        return info
    }

    const onFinish = async (values) => {
        const info = await getSubmitData(values)
        if (
            !info?.configs ||
            (ruleExpression === RuleExpression.Field &&
                !JSON.parse(info.configs)?.rule_expression?.where?.length)
        ) {
            setErrTips(__('请配置过滤条件'))
            return
        }
        setErrTips('')

        const action = isEdit ? updateWhiteList : createWhiteList
        try {
            await action(info)
            message.success(isEdit ? __('编辑成功') : __('新建成功'))
            onClose(true)
        } catch (err) {
            formatError(err)
        }
    }

    const handleChooseView = (list: any[]) => {
        const [formView] = list
        setSelectedDataView(formView || {})
        form.setFieldValue('name', formView.business_name)
        getFormViewDetails(formView.id)
        setSqlScript('')
    }

    const getFormViewDetails = async (formViewId: string) => {
        try {
            const res = await getDatasheetViewDetails(formViewId)
            // 过滤已删除、二进制字段
            const list = res?.fields
                ?.filter(
                    (item) =>
                        item.status !== 'delete' &&
                        !dataTypeMapping.binary.includes(item.data_type),
                )
                ?.map((item) => {
                    return {
                        ...item,
                        checked: false,
                    }
                })
            setFieldList(list)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.createWrapper}>
            <Modal
                title={isEdit ? __('编辑策略') : __('新建白名单策略')}
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
                        <Button
                            onClick={async () => {
                                const info = await getSubmitData(detailsInfos)
                                setConfigInfo(info)
                                setFilterDataViewVisible(true)
                            }}
                            disabled={!selectedDataView.id}
                        >
                            {__('测试过滤效果')}
                        </Button>
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
                            name="name"
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
                            />
                        </Form.Item>
                        <div className={styles.configRow}>
                            <div className={styles.requiredFlag}>*</div>
                            {__('敏感数据过滤配置')}
                            {errTips && (
                                <div className={styles.errTips}>{errTips}</div>
                            )}
                        </div>
                        <div className={styles.ruleExpression}>
                            <div className={styles.label}>{__('配置方式')}</div>
                            <Radio.Group
                                onChange={(e) => {
                                    setRuleExpression(e.target.value)
                                }}
                                value={ruleExpression}
                            >
                                <Radio value={RuleExpression.Sql}>
                                    {__('SQL')}
                                </Radio>
                                <Radio value={RuleExpression.Field}>
                                    {__('字段限定')}
                                </Radio>
                            </Radio.Group>
                        </div>
                        <div hidden={ruleExpression === RuleExpression.Sql}>
                            <RuleFieldConfig
                                value={customRuleConfig}
                                ref={ruleFieldRef}
                                formViewId={selectedDataView?.id}
                                commonItemWidth={{
                                    selectMaxWidt: '400px',
                                }}
                            />
                        </div>
                        <div hidden={ruleExpression === RuleExpression.Field}>
                            <SqlConfig
                                fieldList={fieldList}
                                defaultSql={sqlScript}
                                placeholder=""
                                onChange={(sql) => {
                                    setSqlScript(sql)
                                }}
                            />
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
                    onSure={handleChooseView}
                    isRelateWhiteList
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
        </div>
    )
}

export default Create
