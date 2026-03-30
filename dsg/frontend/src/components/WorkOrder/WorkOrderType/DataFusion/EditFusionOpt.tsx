import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    Anchor,
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Radio,
    Row,
    Select,
    Space,
    Tooltip,
    message,
} from 'antd'
import { isEmpty, isEqual, omit, toNumber, trim } from 'lodash'
import moment from 'moment'
import { InfoCircleOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameWorkOrder,
    createWorkOrder,
    formatError,
    getWorkOrderDetail,
    updateWorkOrder,
    getDataProcessingPlan,
    getDataSourceList,
    DataSourceFromType,
} from '@/core'
import {
    enBeginNameRegNew,
    ErrorInfo,
    keyboardReg,
    nameReg,
    validateName,
} from '@/utils'
import DepartResponsibleSelect from '../../DepartResponsibleSelect'
import __ from './locale'
import styles from './styles.module.less'
import {
    OrderType,
    OrderTypeOptions,
    SelectPriorityOptions,
} from '../../helper'
import Return from '../../Return'
import { Empty, ReturnConfirmModal, SearchInput } from '@/ui'
import EmptyAdd from '@/assets/emptyAdd.svg'
import FusionFieldEditTable2 from './FusionFieldEditTable'
import PlanSelect from '../../PlanSelect'
import { DataType } from '@/components/DataEleManage/const'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'
import { cronStrategyOptions, FusionType, modelTypeMap } from './helper'
import { FontIcon } from '@/icons'
import FusionGraphDrawer from './viewMode/FusionGraphDrawer'
import FusionGraphView from './viewMode/FusionGraphView'
import ScrollLoadSelect from '@/components/ScrollLoadSelect'
import { DataColoredBaseIcon } from '@/core/dataSource'
import { IconType } from '@/icons/const'
import SqlViewModal from './SqlViewModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const { RangePicker } = DatePicker

const ModalEmpty = ({ onAdd }: any) => {
    return (
        <div>
            <Empty
                iconSrc={EmptyAdd}
                desc={
                    <div>
                        点击<a onClick={onAdd}>【+添加】</a>按钮,可添加融合模型
                    </div>
                }
            />
        </div>
    )
}

const { Link } = Anchor
const EditFusionOpt = ({
    id,
    visible,
    type,
    onClose,
    projectNodeStageInfo,
}: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [modelForm] = Form.useForm()
    const fieldsTableRef: any = useRef()
    const graphViewRef: any = useRef()
    const [userInfo] = useCurrentUser()
    const [detail, setDetail] = useState<any>()
    const [fusionModelDetail, setFusionModelDetail] = useState<any>({
        scene_sql:
            'SELECT "未命名_1"."管理费用" AS "管理费用","未命名_1"."资产处置收益" AS "资产处置收益","未命名_1"."资产减值损失" AS "资产减值损失","未命名_1"."基本每股收益" AS "基本每股收益","未命名_1"."公司简称" AS "公司简称","未命名_1"."（一）持续经营净利润" AS "（一）持续经营净利润","未命名_1"."信用减值损失" AS "信用减值损失","未命名_1"."稀释每股收益" AS "稀释每股收益","未命名_1"."加：公允价值变动收益" AS "加：公允价值变动收益","未命名_1"."财务费用" AS "财务费用","未命名_1"."其中：非流动资产处置利得" AS "其中：非流动资产处置利得","未命名_1"."减：所得税费用" AS "减：所得税费用","未命名_1"."其中：利息费用" AS "其中：利息费用","未命名_1"."利息收入" AS "利息收入","未命名_1"."其中：对联营企业和合营企业的投资收益" AS "其中：对联营企业和合营企业的投资收益","未命名_1"."投资收益" AS "投资收益","未命名_1"."其中：非流动资产处置损失" AS "其中：非流动资产处置损失","未命名_1"."少数股东损益" AS "少数股东损益","未命名_1"."净利润(万元)" AS "净利润(万元)","未命名_1"."净利润差额(合计平衡项目)" AS "净利润差额(合计平衡项目)","未命名_1"."扣除非经常性损益后的净利润" AS "扣除非经常性损益后的净利润","未命名_1"."减：营业外支出" AS "减：营业外支出","未命名_1"."加：营业外收入" AS "加：营业外收入","未命名_1"."其中：营业成本" AS "其中：营业成本","未命名_1"."营业利润" AS "营业利润","未命名_1"."其中：营业收入(万元)" AS "其中：营业收入(万元)","未命名_1"."其他综合收益" AS "其他综合收益","未命名_1"."归属母公司所有者的其他综合收益" AS "归属母公司所有者的其他综合收益","未命名_1"."其他收益" AS "其他收益","未命名_1"."归属于母公司股东的净利润" AS "归属于母公司股东的净利润","未命名_1"."研发费用" AS "研发费用","未命名_1"."报告日期" AS "报告日期","未命名_1"."报告期" AS "报告期","未命名_1"."证券代码" AS "证券代码","未命名_1"."销售费用" AS "销售费用","未命名_1"."营业税金及附加" AS "营业税金及附加","未命名_1"."综合收益总额" AS "综合收益总额","未命名_1"."归属于少数股东的综合收益总额" AS "归属于少数股东的综合收益总额","未命名_1"."归属于母公司股东的综合收益总额" AS "归属于母公司股东的综合收益总额","未命名_1"."营业总成本" AS "营业总成本","未命名_1"."营业总收入(万元)" AS "营业总收入(万元)","未命名_1"."利润总额" AS "利润总额" FROM ((((SELECT "admin_exp" AS "管理费用","asset_disp_gain" AS "资产处置收益","asset_loss" AS "资产减值损失","basic_eps" AS "基本每股收益","company_chinese_abbr" AS "公司简称","cont_ops_net_profit" AS "（一）持续经营净利润","credit_loss" AS "信用减值损失","diluted_eps" AS "稀释每股收益","fair_val_gain" AS "加：公允价值变动收益","fin_exp" AS "财务费用","gain_non_curr_disp" AS "其中：非流动资产处置利得","inc_tax_exp" AS "减：所得税费用","int_expense" AS "其中：利息费用","int_income" AS "利息收入","inv_assoc_joint" AS "其中：对联营企业和合营企业的投资收益","inv_income" AS "投资收益","loss_non_curr_disp" AS "其中：非流动资产处置损失","minority_int" AS "少数股东损益","net_profit" AS "净利润(万元)","net_profit_diff" AS "净利润差额(合计平衡项目)","net_prof_ex_items" AS "扣除非经常性损益后的净利润","non_op_exp" AS "减：营业外支出","non_op_income" AS "加：营业外收入","op_cost" AS "其中：营业成本","op_profit" AS "营业利润","op_revenue" AS "其中：营业收入(万元)","other_comp_income" AS "其他综合收益","other_comp_parent" AS "归属母公司所有者的其他综合收益","other_income" AS "其他收益","parent_net_profit" AS "归属于母公司股东的净利润","rd_exp" AS "研发费用","report_date" AS "报告日期","report_period" AS "报告期","security_code" AS "证券代码","sell_exp" AS "销售费用","taxes_surcharges" AS "营业税金及附加","tot_comp_income" AS "综合收益总额","tot_comp_minority" AS "归属于少数股东的综合收益总额","tot_comp_parent" AS "归属于母公司股东的综合收益总额","tot_op_cost" AS "营业总成本","tot_op_income" AS "营业总收入(万元)","tot_profit" AS "利润总额" FROM (vdm_maria_6hwcfuiu.default.income)))) "未命名_1")',
    })
    const needDeclaration = useRef<boolean>(false)
    const container = useRef<any>(null)
    const [fromType, setFromType] = useState<any>()
    // // 表单原有值
    // const [formOriginValue, setFormOriginValue] = useState<any>()
    // 是否修改
    const [isModified, setIsModified] = useState<boolean>(false)
    // 编辑画布
    const [graphViewMode, setGraphViewMode] = useState<'edit' | 'view'>()
    // sql预览
    const [sqlViewVisible, setSqlViewVisible] = useState<boolean>(false)

    const sqlViewData = useMemo(() => {
        if (fusionModelDetail?.fusion_type !== FusionType.SCENE_ANALYSIS) {
            return undefined
        }
        // 检查融合语句是否配置
        if (!fusionModelDetail.scene_sql) {
            return undefined
        }
        // 检查模型信息是否完整
        const modelValues = modelForm.getFieldsValue()
        const { datasource_id, table_name } = modelValues
        if (!datasource_id || !table_name) {
            return undefined
        }
        return {
            ...modelValues,
            datasource_id:
                typeof modelValues?.datasource_id === 'string'
                    ? modelValues?.datasource_id
                    : modelValues?.datasource_id?.value,
            scene_sql: fusionModelDetail.scene_sql,
            fields: fusionModelDetail.fields,
        }
    }, [JSON.stringify(modelForm.getFieldsValue()), fusionModelDetail])

    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
            // 融合表详情
            const fusionTable = {
                ...(res.fusion_table || {}),
                fusion_type: res.fusion_table?.fusion_type || FusionType.NORMAL,
                fields:
                    res.fusion_table?.fusion_type === FusionType.SCENE_ANALYSIS
                        ? res.fusion_table?.fields
                        : res.fusion_table?.fields?.map((item) => {
                              return {
                                  ...item,
                                  data_type:
                                      item.data_type === -1
                                          ? undefined
                                          : item.data_type,
                                  standard_id: {
                                      id: item.standard_id,
                                      name: item.standard_name_zh,
                                  },
                                  code_table_id: {
                                      id: item.code_table_id,
                                      name: item.code_table_name_zh,
                                  },
                                  code_rule_id: {
                                      id: item.code_rule_id,
                                      name: item.code_rule_name,
                                  },
                              }
                          }),
            }
            setDetail({ ...res, fusion_table: fusionTable })
            setFusionModelDetail(fusionTable)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (!visible) return
        if (id) {
            getDetail()
        }
    }, [id, visible])

    const [projectOptions, nodeOptions] = useMemo(() => {
        const { project, node, stage } = projectNodeStageInfo || {}
        return projectNodeStageInfo
            ? [
                  [
                      {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      },
                  ],
                  [
                      stage
                          ? {
                                key: `${stage.id}-${node.id}`,
                                value: `${stage.id}-${node.id}`,
                                label: `${stage.name}/${node.name}`,
                            }
                          : {
                                key: node.id,
                                value: node.id,
                                label: node.name,
                            },
                  ],
              ]
            : [[], []]
    }, [projectNodeStageInfo])

    useEffect(() => {
        if (detail) {
            const {
                description,
                finished_at,
                name,
                remark,
                priority,
                responsible_uid,
                responsible_uname,
                source_id,
                source_name,
                source_type,
                fusion_table,
            } = detail
            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : source_type || SourceTypeEnum.STANDALONE

            setFromType(fType)
            const param: any = {
                name,
                description,
                // remark,
                source_type: fType,
                priority: priority ? { value: priority } : undefined,
                finished_at: finished_at
                    ? moment(finished_at * 1000)
                    : undefined,
                responsible: responsible_uid
                    ? { value: responsible_uid, label: responsible_uname }
                    : undefined,
            }
            // 项目创建
            if (projectNodeStageInfo) {
                const { project, node, stage } = projectNodeStageInfo || {}
                param.source = project
                    ? {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      }
                    : undefined
                param.node = node
                    ? stage?.id
                        ? {
                              key: `${stage.id}-${node.id}`,
                              value: `${stage.id}-${node.id}`,
                              label: `${stage.name}/${node.name}`,
                          }
                        : {
                              key: node.id,
                              value: node.id,
                              label: node.name,
                          }
                    : undefined
            } else if (source_type === SourceTypeEnum.PLAN) {
                param.source = source_id
                    ? { key: source_id, value: source_id, label: source_name }
                    : undefined
            }
            // setFormOriginValue(param)
            form?.setFieldsValue(param)
            modelForm?.setFieldsValue({
                table_name: fusion_table?.table_name || undefined,
                run_cron_strategy: fusion_table?.run_cron_strategy || undefined,
                run_at: [
                    fusion_table?.run_start_at
                        ? moment(fusion_table.run_start_at * 1000)
                        : undefined,
                    fusion_table?.run_end_at
                        ? moment(fusion_table.run_end_at * 1000)
                        : undefined,
                ],
                datasource_id: {
                    value: fusion_table?.datasource_id || undefined,
                    label: fusion_table?.datasource_name || undefined,
                },
            })
        } else {
            form?.resetFields()
            modelForm?.resetFields()
            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : SourceTypeEnum.STANDALONE
            setFromType(fType)

            const param: any = { source_type: fType }
            param.responsible = {
                value: userInfo?.ID,
                key: userInfo?.ID,
                label: userInfo?.VisionName,
            }
            if (projectNodeStageInfo) {
                const { project, node, stage } = projectNodeStageInfo || {}
                param.source = project
                    ? {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      }
                    : undefined
                param.node = node
                    ? stage?.id
                        ? {
                              key: `${stage.id}-${node.id}`,
                              value: `${stage.id}-${node.id}`,
                              label: `${stage.name}/${node.name}`,
                          }
                        : {
                              key: node.id,
                              value: node.id,
                              label: node.name,
                          }
                    : undefined
            }
            form?.setFieldsValue(param)
        }
    }, [detail, form, projectNodeStageInfo])

    // useEffect(() => {
    //     if (!formOriginValue) {
    //         setFormOriginValue(form?.getFieldsValue())
    //     }
    // }, [form?.getFieldsValue()])

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
                    id: fid,
                    type: OrderType.FUNSION,
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
        try {
            await modelForm?.validateFields()
        } catch (error) {
            return
        }
        const {
            priority,
            responsible,
            finished_at,
            source_type,
            source,
            name,
            ...rest
        } = values

        const modelValues = modelForm?.getFieldsValue()
        if (fusionModelDetail?.fusion_type === FusionType.NORMAL) {
            if (!fieldsTableRef?.current?.onValidate()) {
                message.error(__('请完善融合模型'))
                return
            }
        }
        if (
            fusionModelDetail?.fusion_type === FusionType.SCENE_ANALYSIS &&
            !fusionModelDetail?.scene_sql
        ) {
            message.error(__('请配置融合模型'))
            return
        }
        const infoItemFormValues =
            fieldsTableRef?.current?.getFormValues() || []
        const params = {
            ...rest,
            name: trim(name),
            source_type,
            type,
            priority: priority ? priority.value : undefined,
            finished_at: finished_at
                ? finished_at.endOf('day').unix()
                : undefined,
            responsible_uid: responsible?.value,
            draft: !needDeclaration.current,
            fusion_table:
                fusionModelDetail.fusion_type === FusionType.SCENE_ANALYSIS
                    ? {
                          ...omit(modelValues, 'run_at'),
                          table_name: modelValues?.table_name?.trim(),
                          fusion_type: FusionType.SCENE_ANALYSIS,
                          datasource_id:
                              typeof modelValues?.datasource_id === 'string'
                                  ? modelValues?.datasource_id
                                  : modelValues?.datasource_id?.value,
                          run_start_at: modelValues?.run_at?.[0]?.unix(),
                          run_end_at: modelValues?.run_at?.[1]?.unix(),
                          fields: fusionModelDetail.fields,
                          scene_sql: fusionModelDetail?.scene_sql,
                          scene_analysis_id:
                              fusionModelDetail?.scene_analysis_id,
                      }
                    : {
                          ...modelValues,
                          fusion_type: FusionType.NORMAL,
                          fields: infoItemFormValues.map((fItem, fIndex) => {
                              return {
                                  c_name: fItem.c_name,
                                  catalog_id: fItem.catalog_id,
                                  code_rule_id: fItem.code_rule_id?.id,
                                  code_table_id: fItem.code_table_id?.id,
                                  data_accuracy:
                                      fItem.data_type === DataType.TDECIMAL
                                          ? toNumber(fItem.data_accuracy)
                                          : undefined,
                                  data_length: fItem.data_length
                                      ? toNumber(fItem.data_length)
                                      : undefined,
                                  data_range: fItem.data_range,
                                  data_type: fItem.data_type,
                                  e_name: fItem.e_name,
                                  field_relationship: fItem.field_relationship,
                                  index: fIndex,
                                  info_item_id: fItem.info_item_id,
                                  is_increment: !!fItem.is_increment,
                                  is_required: !!fItem.is_required,
                                  is_standard: !!fItem.is_standard,
                                  primary_key: !!fItem.primary_key,
                                  standard_id: fItem.standard_id?.id,
                              }
                          }),
                      },
        }

        if (projectNodeStageInfo) {
            params.source_type = SourceTypeEnum.PROJECT
            params.source_id = source?.value
            params.source_name = source?.label
            params.node_id = projectNodeStageInfo?.node?.id
            params.node_name = projectNodeStageInfo?.node?.name
            params.stage_id = projectNodeStageInfo?.stage?.id
            params.stage_name = projectNodeStageInfo?.stage?.name
        } else if (source_type === SourceTypeEnum.PLAN) {
            params.source_id = source?.value
        }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateWorkOrder(id, params)
                // fieldsTableRef?.current?.submit(id)
            } else {
                const res = await createWorkOrder(params)
                // fieldsTableRef?.current?.submit(res.id)
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

    const typeLabel = useMemo(() => {
        return OrderTypeOptions.find((o) => o.value === type)?.label ?? ''
    }, [type])

    // const hadFusionModel = useMemo(() => {
    //     return (id && fusionModelDetail?.table_name) || isAddedFusionModel
    // }, [id, fusionModelDetail, isAddedFusionModel])

    // const getModalContent = () => {
    //     // return modalViews?.length > 0 ? (
    //     //     <>
    //     //         <div className={styles['fusion-model-table-top']}>
    //     //             <Form.Item
    //     //                 label={__('融合表名称')}
    //     //                 name="fusion_table_name"
    //     //             >
    //     //                 <Input placeholder={__('请输入')} />
    //     //             </Form.Item>
    //     //             <Space size={12}>
    //     //                 <Button
    //     //                     type="primary"
    //     //                     onClick={() => {
    //     //                         setChooseFieldVisible(true)
    //     //                     }}
    //     //                 >
    //     //                     {__('添加字段')}
    //     //                 </Button>
    //     //                 <Button
    //     //                     onClick={() => {
    //     //                         setChooseFieldVisible(true)
    //     //                     }}
    //     //                 >
    //     //                     {__('从资源中添加')}
    //     //                 </Button>
    //     //             </Space>
    //     //         </div>
    //     //         <FusionModalTable data={modalViews} />
    //     //     </>
    //     // ) : (
    //     //     <ModalEmpty
    //     //         onAdd={() => {
    //     //             setChooseFieldVisible(true)
    //     //         }}
    //     //     />
    //     // )

    //     return (
    //         <>
    //             <div className={styles['fusion-model-table-name']}>
    //                 <Form.Item
    //                     label={__('融合表名称')}
    //                     name="fusion_table_name"
    //                 >
    //                     <Input placeholder={__('请输入')} />
    //                 </Form.Item>
    //                 <div className={styles['fusion-model-table-opr']}>
    //                     <Space size={12}>
    //                         <Button
    //                             type="primary"
    //                             onClick={() => {
    //                                 setChooseFieldVisible(true)
    //                             }}
    //                         >
    //                             {__('添加字段')}
    //                         </Button>
    //                         <Button
    //                             onClick={() => {
    //                                 setChooseFieldVisible(true)
    //                             }}
    //                         >
    //                             {__('从资源中添加')}
    //                         </Button>
    //                     </Space>
    //                     <SearchInput
    //                         onKeyChange={(keyword) => {
    //                             setSearchKey(keyword)
    //                         }}
    //                         style={{ width: 272 }}
    //                         placeholder={__('搜索中英文名称')}
    //                     />
    //                 </div>
    //             </div>
    //             {/* <FusionModalTable data={modalViews} /> */}
    //             {/* <Form.List name="tableData">
    //                 {(fields, { add, remove }) => {
    //                     return (
    //                         <>
    //                             <FusionFieldEditTable />
    //                             <Form.Item>
    //                                 <Button
    //                                     type="dashed"
    //                                     onClick={add}
    //                                     style={{ marginTop: 8 }}
    //                                     block
    //                                     icon={<PlusOutlined />}
    //                                 >
    //                                     {__('添加字段')}
    //                                 </Button>
    //                             </Form.Item>
    //                         </>
    //                     )
    //                 }}
    //             </Form.List> */}
    //             <Form.Item name="tableData">
    //                 <FusionFieldEditTable2 form={tableForm} />
    //             </Form.Item>
    //         </>
    //     )
    // }

    // 获取数据源数据
    const getDatasourceData = async (params: any) => {
        try {
            const res = await getDataSourceList({
                limit: params.limit || 20,
                offset: params.offset || 1,
                keyword: params.keyword || '',
                source_type: DataSourceFromType.Analytical,
            })
            return res?.entries?.filter((item) => item.type !== 'excel') || []
        } catch (error) {
            formatError(error)
            return []
        }
    }

    // 禁用时间
    const disabledDateTime = (date: moment.Moment | null) => {
        const selectedData = date || moment()
        const isToday = selectedData.isSame(moment(), 'day')

        if (!isToday) {
            return {
                disabledHours: () => [],
                disabledMinutes: () => [],
                disabledSeconds: () => [],
            }
        }

        return {
            disabledHours: () => {
                const hours: number[] = []
                const currentHour = moment().hour()
                for (let i = 0; i < currentHour; i += 1) {
                    hours.push(i)
                }
                return hours
            },
            disabledMinutes: () => {
                const currentHour = moment().hour()
                const selectedHour = selectedData.hour()
                if (currentHour < selectedHour) {
                    return []
                }
                const minutes: number[] = []
                const currentMinute = moment().minute()
                for (let i = 0; i <= currentMinute; i += 1) {
                    minutes.push(i)
                }
                return minutes
            },
            disabledSeconds: () => [],
        }
    }

    const handleReturn = () => {
        if (isModified) {
            ReturnConfirmModal({
                onCancel: () => {
                    onClose()
                },
            })
        } else {
            onClose()
        }
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
            <div className={styles.editFusionContentWrapper}>
                <div className={styles.header}>
                    <Return
                        onReturn={handleReturn}
                        title={`${id ? __('编辑') : __('新建')}${__(
                            '${type}工单',
                            {
                                type: typeLabel,
                            },
                        )}`}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content} ref={container}>
                        <div className={styles.infoList}>
                            <div className={styles.moduleTitle} id="base-info">
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                                onChange={() => {
                                    setIsModified(true)
                                }}
                            >
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('工单名称')}
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
                                                placeholder={__(
                                                    '请输入工单名称',
                                                )}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('责任人')}
                                            name="responsible"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择责任人'),
                                                },
                                            ]}
                                        >
                                            <DepartResponsibleSelect
                                                placeholder={__('请选择责任人')}
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
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('截止日期')}
                                            name="finished_at"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                        >
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                disabledDate={(current) => {
                                                    return (
                                                        current &&
                                                        current <
                                                            moment().startOf(
                                                                'day',
                                                            )
                                                    )
                                                }}
                                                placeholder={__(
                                                    '请选择截止日期',
                                                )}
                                                getPopupContainer={(node) =>
                                                    node.parentElement ||
                                                    document.body
                                                }
                                            />
                                        </Form.Item>
                                    </Col>

                                    {projectNodeStageInfo ? (
                                        <>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('来源项目')}
                                                    name="source"
                                                >
                                                    <Select
                                                        labelInValue
                                                        placeholder={__(
                                                            '请选择来源项目',
                                                        )}
                                                        options={projectOptions}
                                                        disabled
                                                        getPopupContainer={(
                                                            node,
                                                        ) => node.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('工单所在节点')}
                                                    name="node"
                                                >
                                                    <Select
                                                        labelInValue
                                                        placeholder={__(
                                                            '请选择工单所在节点',
                                                        )}
                                                        options={nodeOptions}
                                                        disabled
                                                        getPopupContainer={(
                                                            node,
                                                        ) => node.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    ) : (
                                        <Col
                                            span={
                                                fromType === SourceTypeEnum.PLAN
                                                    ? 12
                                                    : 24
                                            }
                                        >
                                            <Form.Item
                                                label={__('来源')}
                                                name="source_type"
                                            >
                                                <Radio.Group
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value
                                                        setFromType(val)
                                                        form?.setFieldsValue({
                                                            source_type: val,
                                                        })
                                                    }}
                                                    value={fromType}
                                                >
                                                    <Radio value="standalone">
                                                        {__('无')}
                                                    </Radio>
                                                    <Radio value="plan">
                                                        {__('处理计划')}
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {fromType === SourceTypeEnum.PLAN && (
                                        <Col span={12}>
                                            <Form.Item
                                                key="source"
                                                label={__('来源计划')}
                                                name="source"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('请选择计划'),
                                                    },
                                                ]}
                                            >
                                                <PlanSelect
                                                    placeholder={__(
                                                        '请选择计划',
                                                    )}
                                                    fetchMethod={
                                                        getDataProcessingPlan
                                                    }
                                                    params={{
                                                        audit_status: 'pass',
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
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
                                                placeholder={__('请输入')}
                                                maxLength={800}
                                                showCount
                                                className={styles.showCount}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                            <div
                                className={styles.moduleTitle}
                                id="fusion-modal"
                            >
                                <h4>{__('融合模型')}</h4>
                                {fusionModelDetail?.fusion_type ===
                                    FusionType.SCENE_ANALYSIS && (
                                    <Tooltip
                                        title={
                                            sqlViewData
                                                ? ''
                                                : __('请先配置融合模型信息')
                                        }
                                    >
                                        <span
                                            className={classnames(
                                                styles.previewSql,
                                                {
                                                    [styles.previewSqlDisabled]:
                                                        !sqlViewData,
                                                },
                                            )}
                                            onClick={() => {
                                                if (!sqlViewData) {
                                                    return
                                                }
                                                setSqlViewVisible(true)
                                            }}
                                        >
                                            <FontIcon
                                                name="icon-SQL"
                                                type={IconType.COLOREDICON}
                                                className={
                                                    styles.previewSqlIcon
                                                }
                                            />
                                            <span
                                                className={
                                                    styles.previewSqlTitle
                                                }
                                            >
                                                {__('预览融合语句')}
                                            </span>
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                            <div className={styles.fusionModelTable}>
                                <Form
                                    form={modelForm}
                                    layout={
                                        fusionModelDetail?.fusion_type ===
                                        FusionType.SCENE_ANALYSIS
                                            ? 'vertical'
                                            : 'horizontal'
                                    }
                                    autoComplete="off"
                                    className={styles.form}
                                    onChange={() => {
                                        setIsModified(true)
                                    }}
                                >
                                    <Form.Item
                                        label={__('融合表名称')}
                                        name="table_name"
                                        required
                                        validateTrigger={['onChange', 'onBlur']}
                                        rules={[
                                            {
                                                required: true,
                                                transform: (val) => trim(val),
                                                message: __('请输入融合表名称'),
                                            },
                                            {
                                                pattern: enBeginNameRegNew,
                                                message: __(
                                                    '仅支持英文、数字、下划线，且必须以字母开头',
                                                ),
                                                transform: (val) => trim(val),
                                            },
                                        ]}
                                    >
                                        <Input
                                            maxLength={64}
                                            placeholder={__('请输入融合表名称')}
                                            onChange={(e) => {
                                                setFusionModelDetail(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        table_name:
                                                            e.target.value?.trim(),
                                                    }),
                                                )
                                            }}
                                        />
                                    </Form.Item>
                                    {fusionModelDetail?.fusion_type ===
                                        FusionType.SCENE_ANALYSIS && (
                                        <Row gutter={24}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="datasource_id"
                                                    label={__('目标数据源')}
                                                    required
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                __(
                                                                    '请选择目标数据源',
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <ScrollLoadSelect
                                                        placeholder={__(
                                                            '请选择目标数据源',
                                                        )}
                                                        fetchOptions={
                                                            getDatasourceData
                                                        }
                                                        fieldValueKey="id"
                                                        fieldNameKey="name"
                                                        className={
                                                            styles.datasourceScrollLoadSelect
                                                        }
                                                        renderOption={(
                                                            option,
                                                        ) => {
                                                            return (
                                                                <div
                                                                    className={
                                                                        styles.selectOption
                                                                    }
                                                                >
                                                                    <DataColoredBaseIcon
                                                                        type={
                                                                            option?.type
                                                                        }
                                                                        iconType="Colored"
                                                                        style={{
                                                                            fontSize:
                                                                                '18px',
                                                                        }}
                                                                    />
                                                                    <span
                                                                        title={
                                                                            option.name
                                                                        }
                                                                        className={
                                                                            styles.optionName
                                                                        }
                                                                    >
                                                                        {
                                                                            option.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )
                                                        }}
                                                        onChange={(
                                                            val,
                                                            option,
                                                        ) => {
                                                            setFusionModelDetail(
                                                                (
                                                                    prev: any,
                                                                ) => ({
                                                                    ...prev,
                                                                    datasource_type_name:
                                                                        option
                                                                            ?.optionData
                                                                            ?.type,
                                                                    database_name:
                                                                        option
                                                                            ?.optionData
                                                                            ?.database_name,
                                                                    schema: option
                                                                        ?.optionData
                                                                        ?.schema,
                                                                }),
                                                            )
                                                        }}
                                                        limit={50}
                                                        disableDetailFetch
                                                        getPopupContainer={(
                                                            n,
                                                        ) => n.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <div
                                                    className={
                                                        styles.subDetailInfo
                                                    }
                                                >
                                                    {[
                                                        {
                                                            key: 'database_name',
                                                            label: __('数据库'),
                                                        },

                                                        {
                                                            key: 'datasource_type_name',
                                                            label: __(
                                                                '数据库类型',
                                                            ),
                                                        },
                                                        {
                                                            key: 'schema',
                                                            label: 'schema',
                                                        },
                                                    ].map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={
                                                                styles.detailInfoItem
                                                            }
                                                        >
                                                            <span>
                                                                {item.label}
                                                                <Tooltip
                                                                    title={__(
                                                                        '选择数据源后展示数据',
                                                                    )}
                                                                >
                                                                    <InfoCircleOutlined
                                                                        className={
                                                                            styles.detailInfoIcon
                                                                        }
                                                                    />
                                                                </Tooltip>
                                                                {__('：')}
                                                            </span>
                                                            <span
                                                                title={
                                                                    fusionModelDetail?.[
                                                                        item.key
                                                                    ]
                                                                }
                                                                className={
                                                                    styles.detailInfoValue
                                                                }
                                                            >
                                                                {fusionModelDetail?.[
                                                                    item.key
                                                                ] || '--'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('运行时间范围')}
                                                    name="run_at"
                                                    required
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                __(
                                                                    '请选择运行时间范围',
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <RangePicker
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        showTime
                                                        getPopupContainer={(
                                                            n,
                                                        ) => n}
                                                        placeholder={[
                                                            __('开始时间'),
                                                            __('结束时间'),
                                                        ]}
                                                        onChange={(
                                                            values: any,
                                                        ) => {
                                                            const [start, end] =
                                                                values
                                                            if (
                                                                moment(
                                                                    start,
                                                                ).isBefore(
                                                                    moment(),
                                                                )
                                                            ) {
                                                                modelForm?.setFieldsValue(
                                                                    {
                                                                        run_at: [
                                                                            moment(),
                                                                            end,
                                                                        ],
                                                                    },
                                                                )
                                                            }
                                                        }}
                                                        disabledDate={(
                                                            current,
                                                        ) => {
                                                            return (
                                                                current &&
                                                                current <
                                                                    moment().startOf(
                                                                        'day',
                                                                    )
                                                            )
                                                        }}
                                                        disabledTime={
                                                            disabledDateTime
                                                        }
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('执行定时策略')}
                                                    name="run_cron_strategy"
                                                    required
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                __(
                                                                    '请选择执行定时策略',
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                        options={
                                                            cronStrategyOptions
                                                        }
                                                        getPopupContainer={(
                                                            n,
                                                        ) => n}
                                                        placeholder={__(
                                                            '请选择执行定时策略',
                                                        )}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    )}
                                </Form>

                                {!fusionModelDetail?.fusion_type && (
                                    <div className={styles.selectModelWrap}>
                                        <div className={styles.modelTip}>
                                            <div>{__('注意：')}</div>
                                            <div>
                                                {__(
                                                    '选定模式后，无法切换模式，请按需选择。',
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.modelBtn}>
                                            {Object.entries(modelTypeMap).map(
                                                ([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className={
                                                            styles.modelBtnItem
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.modelBtnName
                                                            }
                                                        >
                                                            <FontIcon
                                                                style={{
                                                                    lineHeight: 1,
                                                                }}
                                                                name={
                                                                    value.icon
                                                                }
                                                            />
                                                            <span>
                                                                {value.name}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.modelBtnDesc
                                                            }
                                                        >
                                                            {value.desc}
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.modelBtnCreate
                                                            }
                                                            onClick={() => {
                                                                setFusionModelDetail(
                                                                    (
                                                                        prev: any,
                                                                    ) => ({
                                                                        ...prev,
                                                                        fusion_type:
                                                                            key,
                                                                    }),
                                                                )
                                                                if (
                                                                    key ===
                                                                    FusionType.SCENE_ANALYSIS
                                                                ) {
                                                                    setIsModified(
                                                                        true,
                                                                    )
                                                                    setGraphViewMode(
                                                                        'edit',
                                                                    )
                                                                }
                                                            }}
                                                        >
                                                            {__('开始新建模型')}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                                {fusionModelDetail?.fusion_type ===
                                    FusionType.NORMAL && (
                                    <FusionFieldEditTable2
                                        ref={fieldsTableRef}
                                        value={fusionModelDetail}
                                        onModify={() => {
                                            setIsModified(true)
                                        }}
                                    />
                                )}
                                {fusionModelDetail?.fusion_type ===
                                    FusionType.SCENE_ANALYSIS &&
                                    !graphViewMode && (
                                        <div
                                            style={{
                                                height: 480,
                                                border: '1px solid #F6F9FB',
                                            }}
                                        >
                                            <FusionGraphView
                                                inMode="edit"
                                                sceneData={fusionModelDetail}
                                                ref={graphViewRef}
                                                onExpand={(val) => {
                                                    setGraphViewMode('view')
                                                }}
                                                onEdit={() => {
                                                    setGraphViewMode('edit')
                                                }}
                                            />
                                        </div>
                                    )}
                            </div>
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
                                    href="#fusion-modal"
                                    title={__('融合模型')}
                                />
                            </Anchor>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={8}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>

                            <Button
                                type="primary"
                                onClick={async () => {
                                    needDeclaration.current = true
                                    if (!fusionModelDetail?.fusion_type) {
                                        message.error(__('请配置融合模型'))
                                        return
                                    }
                                    form.submit()
                                }}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
            <FusionGraphDrawer
                viewMode={graphViewMode}
                open={!!graphViewMode}
                sceneData={fusionModelDetail}
                onClose={() => {
                    setGraphViewMode(undefined)
                }}
                onSave={(value) => {
                    setFusionModelDetail((prev: any) => ({
                        ...prev,
                        ...value,
                    }))
                    setGraphViewMode(undefined)
                }}
            />
            <SqlViewModal
                inMode="edit"
                sqlViewData={sqlViewData}
                open={sqlViewVisible}
                onClose={() => setSqlViewVisible(false)}
            />
        </Drawer>
    )
}
export default EditFusionOpt
