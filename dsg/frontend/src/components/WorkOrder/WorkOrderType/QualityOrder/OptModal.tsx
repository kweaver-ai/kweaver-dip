import {
    Anchor,
    Button,
    Col,
    Descriptions,
    Drawer,
    Form,
    Input,
    Row,
    Select,
    Space,
    Tooltip,
    message,
} from 'antd'
import classNames from 'classnames'
import { trim } from 'lodash'
import { useContext, useEffect, useRef, useState } from 'react'
import moment from 'moment'
import EmptyAdd from '@/assets/emptyAdd.svg'
import {
    AnchorType,
    KVMap,
} from '@/components/DatasheetView/DataPreview/helper'
import DatasourceDetails from '@/components/DataSource/Details'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameWorkOrder,
    createWorkOrder,
    formatError,
    getDataBaseDetails,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getExploreReport,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { Empty } from '@/ui'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'
import { SelectPriorityOptions } from '../../helper'
import Return from '../../Return'
import CorrectionFieldsModal from './CorrectionFieldsModal'
import CorrectionTable from './CorrectionTable'
import __ from './locale'
import styles from './styles.module.less'
import SureResultModal from './SureResultModal'
import ArchitectureDirTree from '@/components/BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '@/components/BusinessArchitecture/const'
import DepartSelect from './DepartSelect'

const ModalEmpty = ({ onAdd }: any) => {
    return (
        <div>
            <Empty
                iconSrc={EmptyAdd}
                desc={
                    <div>
                        {__('点击')}
                        <a onClick={onAdd}>【+{__('添加')}】</a>
                        {__('按钮')},{__('可添加整改内容')}
                    </div>
                }
            />
        </div>
    )
}

const { Link } = Anchor

/**
 * 新建质量整改
 */
const OptModal = ({ item, visible, type, onClose }: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const needDeclaration = useRef<boolean>(false)
    const container = useRef<any>(null)
    const [reportRuleFields, setReportRuleFields] = useState<any[]>([])

    // 选择整改字段
    const [chooseVisible, setChooseVisible] = useState<boolean>(false)
    const [sureVisible, setSureVisible] = useState<boolean>(false)
    const [datasourceVisible, setDatasourceVisible] = useState<boolean>(false)
    // 字段列表
    const [correctionFields, setCorrectionFields] = useState<any[]>([])
    const [formView, setFormView] = useState<any>()
    const [exploreReportData, setExploreReportData] = useState<any>()
    const [datasource, setDatasource] = useState<any>()
    const [{ third_party }] = useGeneralConfig()

    const [defaultDepart, setDefaultDepart] = useState<any>()

    const initData = (dataViewId: string, datasource_id: string) => {
        Promise.allSettled([
            getExploreReport({
                id: dataViewId,
                third_party: !!third_party,
            }),
            // 库表字段信息
            getDatasheetViewDetails(dataViewId),
            getDataBaseDetails(datasource_id),
            // 库表基本信息
            getDataViewBaseInfo(dataViewId),
        ]).then((results: any) => {
            const [
                { value: reportRes },
                { value: dataViewRes },
                { value: datasourceRes },
                { value: viewBaseRes },
            ] = results
            const errors = results?.filter(
                (o, idx) => idx !== 0 && o.status === 'rejected',
            )
            if (errors?.length) {
                formatError(errors[0]?.reason)
            }
            // 优先使用库表部门 其次 数据源部门 再次自选
            const depart = viewBaseRes?.department_id
                ? {
                      id: viewBaseRes?.department_id,
                      name: viewBaseRes?.department,
                  }
                : {
                      id: datasourceRes?.department_id,
                      name: datasourceRes?.department_name,
                  }
            setDefaultDepart(depart?.id ? depart : undefined)
            setFormView({
                id: dataViewId,
                ...dataViewRes,
            })
            setDatasource(datasourceRes)
            setExploreReportData((prev) => ({
                ...prev,
                ...(reportRes || {}),
                formView: dataViewRes,
            }))
            const fields = (reportRes?.explore_field_details || []).reduce(
                (prev, cur) => {
                    const field_id = cur?.field_id
                    const rules = cur?.details || []
                    const curViewField = dataViewRes?.fields?.find(
                        (f) => f?.id === field_id,
                    )

                    const ruleFieldArr = rules
                        .filter((o) => o?.dimension !== KVMap.data_statistics) // 屏蔽数据统计类型规则
                        .map((rule) => {
                            return {
                                id: `${field_id}-${rule?.rule_id}`,
                                field_id,
                                field_business_name:
                                    curViewField?.business_name,
                                field_technical_name:
                                    curViewField?.technical_name,
                                field_type: curViewField?.data_type,
                                rule_type: AnchorType[KVMap[rule?.dimension]],
                                inspected_count: rule?.inspected_count,
                                issue_count: rule?.issue_count,
                                rule_id: rule?.rule_id,
                                rule_name: rule?.rule_name,
                                dimension: rule?.dimension,
                                original_score: rule?.[KVMap[rule?.dimension]],
                                score:
                                    Math.ceil(
                                        (rule?.[KVMap[rule?.dimension]] || 0) *
                                            10000,
                                    ) / 100,
                            }
                        })

                    return [...prev, ...ruleFieldArr]
                },
                [],
            )
            setReportRuleFields(fields)
        })
    }

    useEffect(() => {
        if (item?.form_view_id) {
            initData(item?.form_view_id, item?.datasource_id)
        }
    }, [item])

    useEffect(() => {
        if (item) {
            const {
                business_name,
                report_id,
                report_version,
                owner_id,
                owner,
            } = item

            const curTime = moment().format('YYYYMMDDHHmmss')
            const param: any = {
                name: `质量整改-${business_name}-${curTime}`,
                source_type: 'form_view', // 报告
                data_source_department: owner_id // TODO： 查询数源部门
                    ? { value: owner_id, label: owner }
                    : undefined,
                report: report_id
                    ? {
                          value: report_id,
                          label: `${business_name}(v.${report_version})`,
                      }
                    : undefined,
            }
            form?.setFieldsValue(param)
        } else {
            form?.resetFields()
        }
    }, [item, form])

    useEffect(() => {
        if (defaultDepart) {
            form?.setFieldsValue({
                data_source_department: {
                    value: defaultDepart?.id,
                    label: defaultDepart?.name,
                },
            })
        }
    }, [defaultDepart])

    // 验证工单名称是否重复
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
                checkNameWorkOrder({
                    name: trimValue,
                    type,
                    id: fid,
                })
                    .then((res) => {
                        if (res) {
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
        const {
            priority,
            data_source_department,
            source_type,
            source_id,
            source,
            report,
            ...rest
        } = values
        const params = {
            ...rest,
            improvements: correctionFields?.map((o) => ({
                dimension: o?.dimension,
                field_id: o?.field_id,
                rule_id: o?.rule_id,
                rule_name: o?.rule_name,
                inspected_count: o?.inspected_count,
                issue_count: o?.issue_count,
                score: o?.original_score,
            })),
            source_type: 'form_view', // 报告
            source_id: item?.form_view_id,
            report_version: item?.report_version,
            report_time: item?.report_at,
            report_id: report?.value,
            type,
            priority: priority ? priority.value : undefined,
            data_source_department_id: data_source_department?.value,
            draft: !needDeclaration.current,
        }

        try {
            const tip = __('新建成功')
            await createWorkOrder(params)

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            setSureVisible(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    // 质量整改内容
    const getModalContent = () => {
        return correctionFields?.length > 0 ? (
            <>
                <div className={styles['modal-table-top']}>
                    <div className={styles.title}>{__('需要整改字段列表')}</div>
                    <div>
                        <Button
                            type="link"
                            onClick={() => {
                                setChooseVisible(true)
                            }}
                        >
                            + {__('添加')}
                        </Button>
                    </div>
                </div>

                <CorrectionTable
                    data={correctionFields}
                    onChange={(items) => {
                        setCorrectionFields(items)
                    }}
                />
            </>
        ) : (
            <ModalEmpty
                onAdd={() => {
                    setChooseVisible(true)
                }}
            />
        )
    }

    return (
        <Drawer
            open={visible}
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
                        title={`${__('新建')}${__('质量整改工单')}`}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content} ref={container}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                            >
                                <div
                                    className={styles.moduleTitle}
                                    id="base-info"
                                >
                                    <h4>{__('基本信息')}</h4>
                                </div>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('整改单名称')}
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
                                                        validateNameRepeat(),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入工单名称',
                                                )}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('来源报告')}
                                            name="report"
                                        >
                                            <Select
                                                labelInValue
                                                placeholder={__(
                                                    '请选择来源报告',
                                                )}
                                                disabled={!!item?.report_id}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('数源部门')}
                                            name="data_source_department"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择数源部门'),
                                                },
                                            ]}
                                        >
                                            <DepartSelect
                                                placeholder={__(
                                                    '请选择数源部门',
                                                )}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('优先级')}
                                            name="priority"
                                        >
                                            <Select
                                                labelInValue
                                                placeholder={__('请选择优先级')}
                                                options={SelectPriorityOptions}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('工单说明')}
                                            name="description"
                                            rules={[
                                                {
                                                    pattern: keyboardReg,
                                                    message:
                                                        ErrorInfo.EXCEPTEMOJI,
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                placeholder={__(
                                                    '请输入工单说明',
                                                )}
                                                maxLength={800}
                                                style={{
                                                    height: 100,
                                                    resize: 'none',
                                                }}
                                                className={styles['show-count']}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div
                                    className={styles.moduleTitle}
                                    id="correction-content"
                                >
                                    <h4>{__('整改内容')}</h4>
                                </div>
                                <div>
                                    <Descriptions
                                        column={3}
                                        labelStyle={{
                                            width: '80px',
                                            color: 'rgba(0, 0, 0, 0.45)',
                                        }}
                                    >
                                        <Descriptions.Item label={__('数据源')}>
                                            <div
                                                className={classNames(
                                                    styles.ellipsisTxt,
                                                    styles.link,
                                                )}
                                                onClick={() => {
                                                    setDatasourceVisible(true)
                                                }}
                                            >
                                                {item?.datasource || '--'}
                                            </div>
                                        </Descriptions.Item>

                                        <Descriptions.Item label={__('库表')}>
                                            <div className={styles.ellipsisTxt}>
                                                {item?.business_name || '--'}
                                            </div>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </div>
                                <div className={styles['correction-table']}>
                                    {getModalContent()}
                                </div>
                            </Form>
                        </div>

                        <div className={styles.menuContainer}>
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
                                    href="#correction-content"
                                    title={__('整改内容')}
                                />
                            </Anchor>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>
                            <Tooltip
                                title={
                                    correctionFields?.length === 0
                                        ? __('未添加整改字段，无法提交')
                                        : ''
                                }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        needDeclaration.current = true
                                        form.submit()
                                    }}
                                    disabled={correctionFields?.length === 0}
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>

            {sureVisible && (
                <SureResultModal
                    visible={sureVisible}
                    onClose={() => {
                        setSureVisible(false)
                        onClose?.(true)
                    }}
                />
            )}
            {chooseVisible && (
                <CorrectionFieldsModal
                    fields={reportRuleFields}
                    visible={chooseVisible}
                    bindKeys={(correctionFields || []).map((o) => o?.id)}
                    onClose={() => {
                        setChooseVisible(false)
                    }}
                    onSure={(items) => {
                        setCorrectionFields((prev) => [
                            ...(prev || []),
                            ...(items || []),
                        ])
                        setChooseVisible(false)
                    }}
                />
            )}

            {datasourceVisible && (
                <DatasourceDetails
                    open={datasourceVisible}
                    onClose={() => {
                        setDatasourceVisible(false)
                    }}
                    id={item?.datasource_id}
                />
            )}
        </Drawer>
    )
}
export default OptModal
