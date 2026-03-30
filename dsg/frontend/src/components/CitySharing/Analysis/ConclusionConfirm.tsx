import {
    Badge,
    Button,
    Col,
    Drawer,
    Form,
    Input,
    message,
    Radio,
    Row,
    Select,
    Space,
    Tooltip,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import {
    formatError,
    getAppRegisterList,
    getCityShareApplyDetail,
    IAppRegisterListItem,
    ISharedApplyDetail,
    putCityShareApplyAnalysisConfirm,
} from '@/core'
import __ from '../locale'
import { CommonTitle } from '@/ui'
import styles from './styles.module.less'
import { analysisFieldsConfig, applyFieldsConfig } from '../Details/helper'
import CommonDetails from '../Details/CommonDetails'
import ResourceTable from './ResourceTable'
import AdditionalInfo from './AdditionalInfo'
import { ResTypeEnum } from '../helper'
import { getActualUrl } from '@/utils'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { ApplyResource } from '../const'

interface ConclusionConfirmProps {
    open: boolean
    onClose: () => void
    applyId: string
    onOk: () => void
}
const ConclusionConfirm = ({
    open,
    onClose,
    applyId,
    onOk,
}: ConclusionConfirmProps) => {
    const [form] = Form.useForm()
    const [details, setDetails] = useState<ISharedApplyDetail>()
    const [catalogsData, setCatalogsData] = useState<any[]>([])
    const [operateItem, setOperateItem] = useState<any>()
    const [apps, setApps] = useState<IAppRegisterListItem[]>([])
    const [confirmResult, setConfirmResult] = useState<string>('pass')
    const [appId, setAppId] = useState<string>()

    const isNeedSelectApp = useMemo(() => {
        // 1: 列表中有接口资源 且分析结果为合理
        const condition1 = catalogsData.some(
            (item) =>
                ((item.res_type === ResTypeEnum.Api ||
                    item.apply_conf.supply_type === ApplyResource.Interface) &&
                    item.is_reasonable) ||
                (item.replace_res?.res_type === ResTypeEnum.Api &&
                    item.replace_res?.is_reasonable),
        )
        // 2: 申报时未选择应用系统
        const condition2 = !details?.base.app_id
        // 3: 确认结果通过
        const condition3 = confirmResult === 'pass'

        return condition1 && condition2 && condition3
    }, [confirmResult, catalogsData, details])

    const isNeedShowApp = useMemo(() => {
        return !!(details?.base.app_id && confirmResult === 'pass')
    }, [confirmResult, details])

    useEffect(() => {
        if (applyId) {
            getDetails()
        }
    }, [applyId])

    const getApps = async (depId: string) => {
        const res = await getAppRegisterList({
            offset: 1,
            limit: 2000,
            is_register_gateway: true,
            department_id: depId,
        })
        setApps(res.entries)
    }

    const isDisabled = useMemo(() => {
        // 存在未补充信息的资源，或者关联应用系统未选择
        return (
            catalogsData.some(
                (item) => item.additional_info_types && !item.additional_infos,
            ) ||
            (isNeedSelectApp && !appId)
        )
    }, [catalogsData, isNeedSelectApp, appId])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(applyId!, {
                fields: 'base,analysis',
            })
            getApps(res.base.apply_org_code)
            setDetails(res)
            if (res.base.app_id) {
                form.setFieldsValue({
                    app_id: res.base.app_id,
                })
                setAppId(res.base.app_id)
            }
            const baseResources = res.base.resources || []
            const analysisResources = res.analysis.resources || []
            const clgData = baseResources.map((resource) => {
                // const { apply_conf, ...restSource } = resource
                // const { view_apply_conf, api_apply_conf, ...restApplyConf } =
                //     apply_conf
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )

                const {
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    id,
                    column_ids,
                    column_names,
                    is_res_replace,
                } = analysisRes || {}

                return {
                    ...resource,
                    column_ids,
                    column_names,
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    analysis_item_id: id,
                    replace_res:
                        is_reasonable || !is_res_replace
                            ? undefined
                            : {
                                  res_type: ResTypeEnum.Catalog,
                                  res_id: analysisRes?.new_res_id,
                                  res_code: analysisRes?.new_res_code,
                                  res_name: analysisRes?.new_res_name,
                                  org_path: analysisRes?.org_path,
                                  apply_conf: analysisRes?.apply_conf,
                              },
                }
            })
            setCatalogsData(clgData)
        } catch (error) {
            formatError(error)
        }
    }

    const getExtraOptions = (record: any) => {
        return record.additional_info_types ? (
            <Badge dot={!record.additional_infos}>
                <Button
                    type="link"
                    onClick={() => {
                        setOperateItem(record)
                    }}
                >
                    {__('补充信息')}
                </Button>
            </Badge>
        ) : null
    }

    const handleSaveAdditionalInfo = (values: any) => {
        setCatalogsData(
            catalogsData.map((item) => {
                if (item.analysis_item_id === values.analysis_item_id) {
                    const { analysis_item_id, ...rest } = values
                    return { ...item, additional_infos: { ...rest } }
                }
                return item
            }),
        )
    }

    const onFinish = async (values: any) => {
        try {
            const data = catalogsData.filter(
                (item) => item.additional_info_types,
            )
            await putCityShareApplyAnalysisConfirm(applyId!, {
                additional_infos:
                    data.length > 0
                        ? data.map((item) => ({
                              id: item.analysis_item_id,
                              dst_data_source_id:
                                  item.additional_infos?.dst_data_source_id,
                              dst_view_name:
                                  item.additional_infos?.dst_view_name,
                              usage: item.additional_infos?.usage,
                              attachment_id: item.additional_infos
                                  ?.attachment_id
                                  ? [item.additional_infos?.attachment_id]
                                  : undefined,
                          }))
                        : undefined,
                confirm_result: values.confirm_result,
                confirm_remark: values.confirm_remark,
                app_id: values.app_id,
            })
            message.success(__('提交成功'))
            onClose()
            onOk()
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            title={__('分析结论确认')}
            width={1520}
            open={open}
            onClose={onClose}
            bodyStyle={{ padding: 0, overflow: 'hidden' }}
            footer={
                <Space className={styles['conclusion-confirm-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Tooltip
                        title={
                            isDisabled
                                ? isNeedSelectApp
                                    ? __('请选择应用系统')
                                    : __('请补充信息')
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            onClick={() => form.submit()}
                            disabled={isDisabled}
                        >
                            {__('提交')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles['conclusion-confirm-wrapper']}>
                <div className={styles['info-container']}>
                    <div className={styles['common-title']}>
                        <CommonTitle title={__('申请信息')} />
                    </div>
                    <CommonDetails
                        data={details?.base}
                        configData={applyFieldsConfig}
                    />
                    <div className={styles['common-title']}>
                        <CommonTitle title={__('分析结论')} />
                    </div>
                    <CommonDetails
                        data={{
                            ...(details?.base || {}),
                            ...(details?.analysis || {}),
                        }}
                        configData={analysisFieldsConfig}
                    />

                    <div className={styles['common-title']}>
                        <CommonTitle title={__('分析资源')} />
                    </div>
                    <ResourceTable
                        isView
                        getExtraOptions={getExtraOptions}
                        items={catalogsData || []}
                    />
                </div>
                <div className={styles['form-container']}>
                    <Form
                        style={{ marginTop: 20 }}
                        form={form}
                        onFinish={onFinish}
                    >
                        <Form.Item
                            label={__('确认结果')}
                            name="confirm_result"
                            required
                            rules={[{ required: true }]}
                            initialValue="pass"
                            colon
                        >
                            <Radio.Group
                                onChange={(e) => {
                                    setConfirmResult(e.target.value)
                                }}
                            >
                                <Radio value="pass">{__('通过')}</Radio>
                                <Radio value="reject">{__('驳回')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                        {(isNeedShowApp || isNeedSelectApp) && (
                            <Space size={10} className={styles['app-space']}>
                                <Form.Item
                                    name="app_id"
                                    label={
                                        <span>
                                            {__('关联应用系统')}
                                            <Tooltip
                                                placement="bottom"
                                                color="#fff"
                                                title={
                                                    <div
                                                        style={{
                                                            width: 238,
                                                            color: 'rgba(0,0,0,0.65)',
                                                        }}
                                                    >
                                                        {__(
                                                            '提供资源中，存在资源提供方式是接口服务，需要补充本部门已注册的应用。',
                                                        )}
                                                    </div>
                                                }
                                            >
                                                <FontIcon
                                                    name="icon-xinxitishi"
                                                    type={IconType.FONTICON}
                                                    className={
                                                        styles['app-info-icon']
                                                    }
                                                />
                                            </Tooltip>
                                        </span>
                                    }
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择'),
                                        },
                                    ]}
                                    className={styles['app-form-item']}
                                    colon={false}
                                >
                                    <Select
                                        options={apps}
                                        placeholder={__('请选择应用')}
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.name ?? '')
                                                .toLowerCase()
                                                .includes(input.toLowerCase())
                                        }
                                        fieldNames={{
                                            label: 'name',
                                            value: 'id',
                                        }}
                                        style={{ width: 510 }}
                                        disabled={isNeedShowApp}
                                        onChange={(value) => {
                                            setAppId(value)
                                        }}
                                    />
                                </Form.Item>
                                <Button
                                    type="link"
                                    onClick={() =>
                                        window.open(
                                            getActualUrl(
                                                '/personal-center',
                                                true,
                                                2,
                                            ),
                                            '_blank',
                                        )
                                    }
                                >
                                    {__(
                                        '找不到应用？请到个人中心-我的应用-网关应用中添加并注册>>',
                                    )}
                                </Button>
                            </Space>
                        )}

                        <Form.Item
                            label={<span>{__('说明')}：</span>}
                            name="confirm_remark"
                            labelCol={{ span: 24 }}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请输入'),
                                },
                            ]}
                        >
                            <Input.TextArea
                                placeholder={__('请输入')}
                                maxLength={300}
                                showCount
                                className={styles['confirm-remark-textarea']}
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
            {operateItem && (
                <AdditionalInfo
                    resource={operateItem}
                    open={operateItem !== undefined}
                    onClose={() => {
                        setOperateItem(undefined)
                    }}
                    onOk={handleSaveAdditionalInfo}
                />
            )}
        </Drawer>
    )
}

export default ConclusionConfirm
