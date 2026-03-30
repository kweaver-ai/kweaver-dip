import {
    Alert,
    Button,
    Col,
    message,
    Row,
    Space,
    StepProps,
    Steps,
    Tooltip,
} from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ExclamationCircleFilled, LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { confirm } from '@/utils/modalHelper'

import Confirm from '@/components/Confirm'
import { StandardDataDetail } from '@/components/FormTableMode/const'
import GlobalMenu from '@/components/GlobalMenu'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    addInfoCatlg,
    changeInfoResCatlg,
    formatError,
    getFormsFieldsList,
    getInfoCatlgDetail,
    getInfoCatlgDetailByOper,
    getMainDepartInfo,
    HasAccess,
    IInfoCatlgRelateBusinForm,
    queryInfoResCatlgColumns,
    resetInfoResCatlg,
    updInfoCatlg,
} from '@/core'
import { ResourcesDirOutlined } from '@/icons'
import { ReturnConfirmModal } from '@/ui'
import { OperateType, useQuery } from '@/utils'
import { DataNode, InfoResourcesType, PublishStatus } from '../const'
import BasicInfo from './BasicInfo'
import {
    businFormToInfoCatlgDataType,
    IEditInfoCatlg,
    InfoCatlgItemDataType,
    selectNullOption,
    StepOptionKey,
} from './helper'
import InfoItems from './InfoItems'
import __ from './locale'
import SelectBusinStandTable from './SelectBusinStandTable'
import { SubmitActionType } from './SelectRescCatlg/helper'
import styles from './styles.module.less'

interface IEditInfoRescCatlg {}

const EditInfoRescCatlg = (props: IEditInfoRescCatlg) => {
    const query = useQuery()
    const navigator = useNavigate()

    const catlgId = query.get('id') || ''
    const alterId = query.get('nextId') || ''
    const optType: any = query.get('opt') || ''

    const optId = optType === OperateType.CHANGE ? alterId || catlgId : catlgId

    // const oprType: OperateType = catlgId ? OperateType.EDIT : OperateType.CREATE
    // 操作类型  新建、编辑、变更
    const oprType: OperateType = useMemo(() => {
        return optType || (optId ? OperateType.EDIT : OperateType.CREATE)
    }, [optId, optType])

    const [stepsCurrent, setStepsCurrent] = useState(0)
    const basicInfoRef: any = useRef()
    const editTableRef: any = useRef()
    const [resetVisible, setResetVisible] = useState<boolean>(false)
    const [resetBtnLoading, setResetBtnLoading] = useState<boolean>(false)

    // 下一步按钮禁用
    const [nextBtnDisabled, setNextBtnDisabled] = useState<boolean>(true)
    const [loading, setLoading] = useState(false)

    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [fieldLoading, setFieldLoading] = useState<boolean>(false)
    const [primaryRequired, setPrimaryRequired] = useState(false)
    const [mountResourceInfo, setMountResourceInfo] = useState<any>([])
    const [mountResourceForm, setMountResourceForm] = useState<any>({})
    const [categorysInfo, setCategorysInfo] = useState<any>([])
    const [originViewFields, setOriginViewFields] = useState<any[]>([])

    // 第一步选中的业务表
    const [selBusinForm, setSelBusinForm] = useState<any>({})
    // 基本信息Form
    const [baseInfoForm, setBaseInfoForm] = useState<any>({})
    const [infoCatlgData, setInfoCatlgData] = useState<
        IEditInfoCatlg | undefined
    >(undefined)

    // 信息项字段
    const [fieldData, setFieldData] = useState<any[]>([])
    // 字段查询参数，不分页
    const fieldSearchCondition = {
        offset: 1,
        limit: 1000,
        keyword: '',
    }

    //  信息项-是否为正在完成配置状态
    const [saveBtnStatus, setSaveBtnStatus] = useState<boolean>(false)
    // 编码规则/码表集合
    const standardRuleDetail: StandardDataDetail = new StandardDataDetail(
        [],
        [],
    )
    // 编辑，刚打开目录选择的业务表
    const [originBusinForm, setOriginBusinForm] = useState<any>({})

    const { checkPermissions } = useUserPermCtx()

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    /**
     * 设置变更状态
     */
    const setChangedStatus = () => {
        if (!isChanged) {
            setIsChanged(true)
        }
    }
    const stepsItems =
        [
            optId
                ? undefined
                : {
                      key: StepOptionKey.SELBUSINFORM,
                      title: __('选择业务标准表'),
                      content: (
                          <SelectBusinStandTable
                              business_form={selBusinForm}
                              onDataChange={(
                                  selData: IInfoCatlgRelateBusinForm,
                                  selNode?: DataNode,
                              ) => {
                                  setSelBusinForm(selData)
                                  setNextBtnDisabled(!selData)
                                  const {
                                      id,
                                      name,
                                      department_id,
                                      department_name,
                                      label_list_resp,
                                      ...rest
                                  } = selData
                                  const {
                                      source_info = {},
                                      relation_info = {},
                                      belong_info = {},
                                  } = baseInfoForm || {}
                                  // 改变业务表
                                  if (source_info?.business_form?.id !== id) {
                                      const newBaseInfoForm = {
                                          selFormId: id,
                                          name,
                                          source_info: {
                                              business_form: id
                                                  ? { id, name }
                                                  : undefined,
                                              department: department_id
                                                  ? {
                                                        id: department_id,
                                                        name: department_name,
                                                    }
                                                  : undefined,
                                          },
                                          relation_info: {
                                              // ...relation_info,
                                              info_systems:
                                                  selData?.related_info_systems ||
                                                  relation_info?.info_systems,
                                          },
                                          isOriginBusinForm:
                                              !optId ||
                                              selData?.id ===
                                                  originBusinForm?.source_info
                                                      ?.business_form?.id,
                                          label_ids: label_list_resp?.map(
                                              (o) => o.id,
                                          ),
                                          belong_info,
                                      }
                                      setBaseInfoForm(newBaseInfoForm)
                                      setIsChanged(true)
                                      setInfoCatlgData({
                                          ...(infoCatlgData || {}),
                                          name: selData?.name,
                                          // source_info: {
                                          //     business_form: selData,
                                          //     department: selData?.department_id
                                          //         ? {
                                          //               id: selData?.department_id,
                                          //               name: selData?.department_name,
                                          //           }
                                          //         : undefined,
                                          // },
                                      })
                                  }
                                  // if (
                                  //     selData?.id !==
                                  //         infoCatlgData?.source_info?.business_form?.id ||
                                  //     selData?.department_id !==
                                  //         infoCatlgData?.source_info?.department?.id
                                  // ) {
                                  //     setIsChanged(true)
                                  //     setInfoCatlgData({
                                  //         ...(infoCatlgData || {}),
                                  //         name: selData?.name,
                                  //         source_info: {
                                  //             business_form: selData,
                                  //             department: {
                                  //                 id: selData?.department_id,
                                  //                 name: selData?.department_name,
                                  //             },
                                  //         },
                                  //     })
                                  // }
                              }}
                          />
                      ),
                  },
            {
                key: StepOptionKey.INFOITEMS,
                title: __('确定信息项'),
                content: (
                    <InfoItems
                        // primaryRequired={primaryRequired}
                        ref={editTableRef}
                        bizForm={selBusinForm}
                        fieldData={fieldData}
                        loading={fieldLoading}
                        originFields={originViewFields}
                        standardRuleDetail={standardRuleDetail}
                        // updateSaveBtn={(status) => {
                        //     setSaveBtnStatus(status)
                        // }}
                        onSave={setFieldData}
                        onChange={(val) => {
                            setFieldData(val)
                            setChangedStatus()
                        }}
                    />
                ),
            },
            {
                key: StepOptionKey.BASICINFO,
                title: __('确定目录基本信息'),
                content: (
                    <BasicInfo
                        ref={basicInfoRef}
                        optionsType={oprType}
                        defaultForm={baseInfoForm}
                        onDataChanged={setChangedStatus}
                        applyScopeId="00000000-0000-0000-0000-000000000003"
                    />
                ),
            },
        ].filter((item) => {
            return !!item
        }) || []

    useEffect(() => {
        if (stepsItems[stepsCurrent]?.key === StepOptionKey.INFOITEMS) {
            // 每个选中项均有值
            const canNextStep = fieldData?.every((o) =>
                [
                    o?.reflectTxt,
                    o?.name,
                    o?.data_type,
                    o?.is_sensitive,
                    o?.is_secret,
                ].every(
                    (val) => val != null && val !== '' && val !== undefined,
                ),
            )

            setNextBtnDisabled(fieldData?.length === 0 || !canNextStep)
        }
    }, [fieldData, stepsCurrent, stepsItems])
    useEffect(() => {
        getDetails()
        setNextBtnDisabled(!optId)
    }, [optId, hasDataOperRole])

    useEffect(() => {
        if (oprType === OperateType.CREATE) {
            queryMainDepartInfo()
        }
    }, [oprType])

    useEffect(() => {
        getBusinFormFields(selBusinForm?.id, fieldSearchCondition)
    }, [selBusinForm])

    // 编辑 -- 获取编辑参数
    const getDetails = async () => {
        if (!optId) return
        const action = hasDataOperRole
            ? getInfoCatlgDetailByOper
            : getInfoCatlgDetail
        const res = await action(optId)

        const categorys = res?.category_infos
        // 处理自定义类目数据
        const categoryInfo = {}
        categorys?.forEach((item) => {
            categoryInfo[`category_node_ids_${item.category_id}`] =
                item.category_node_id
        })

        const { belong_info = {}, relation_info = {} } = res
        const { related_business_scenes, source_business_scenes } =
            relation_info

        const relateSceneType = related_business_scenes?.[0]?.type
        const relateSceneValue =
            related_business_scenes?.map?.((tag) => {
                return tag.value
            }) || []
        const sourceSceneType = source_business_scenes?.[0]?.type
        const sourceSceneValue =
            source_business_scenes?.map?.((tag: any) => {
                return tag.value
            }) || []

        const baseInfo = {
            ...baseInfoForm,
            ...res,
            ...categoryInfo,
            // subject_id: res?.subject_info?.map((item) => item.subject_id),
            belong_info: {
                ...belong_info,
                business_responsibility:
                    belong_info?.office?.business_responsibility,
            },
            relation_info: {
                ...relation_info,
                related_business_scenes:
                    relateSceneType && relateSceneValue
                        ? {
                              type: relateSceneType,
                              value: relateSceneValue,
                          }
                        : undefined,
                source_business_scenes:
                    sourceSceneType && sourceSceneValue
                        ? {
                              type: sourceSceneType,
                              value: sourceSceneValue,
                          }
                        : undefined,
            },
        }

        // const {
        //     info_systems,
        //     data_resource_catalogs,
        //     info_resource_catalogs,
        //     info_items,
        //     related_business_scenes,
        //     source_business_scenes,
        // } = baseInfo?.relation_info

        const sleForm = baseInfo?.source_info?.business_form
        setSelBusinForm(sleForm)
        setOriginBusinForm(baseInfo)
        setBaseInfoForm(baseInfo)
    }

    // 获取业务表字段
    const getBusinFormFields = async (fId: string, params) => {
        if (!fId) return
        setFieldLoading(true)
        try {
            let res: any = {}
            let fieldsTemp: any[] = []

            // 业务表字段 用作新建填充和 编辑/变更比对
            const fieldsRes = await getFormsFieldsList(fId, params)
            setOriginViewFields(fieldsRes?.entries || [])
            const originFields = fieldsRes?.entries.map((item) => {
                return {
                    ...item,
                    // isSelectedFlag: true,
                    data_type:
                        businFormToInfoCatlgDataType[item.data_type] ||
                        InfoCatlgItemDataType.Other,
                    reflectTxt: `${item.name}（${item.name_en}）`,
                    field_name_en: item?.name_en,
                    field_name_cn: item?.name,
                }
            })

            if (optId) {
                // 编辑目录
                res = await queryInfoResCatlgColumns({
                    id: optId,
                    ...params,
                })
                const curFields = res?.entries?.map((item) => {
                    return {
                        ...item,
                        ...item.metadata,
                        name: item.name,
                        name_en: item.field_name_en,
                        reflectTxt: `${item.field_name_cn}（${item.field_name_en}）`,
                        // isSelectedFlag: true,
                    }
                })

                // 原业务表在配置信息项基础上的变动字段
                const extraFields = originFields?.filter(
                    (item) =>
                        !curFields?.some((cur) => cur.name_en === item.name_en),
                )
                // 现有字段技术名称与原业务表中技术名称不一致的
                const nameChangeFields = curFields?.map((item) => {
                    const hasField = originFields?.some(
                        (cur) => cur.name_en === item.name_en,
                    )
                    return hasField
                        ? item
                        : {
                              ...item,
                              reflectTxt: undefined,
                          }
                })
                fieldsTemp = [...nameChangeFields, ...extraFields]
            } else {
                // 新建目录
                fieldsTemp = originFields || []
            }
            setFieldData([...(fieldsTemp || [])])
        } catch (e) {
            formatError(e)
        } finally {
            setFieldLoading(false)
        }
    }
    const handleCancel = () => {
        const backUrl =
            query.get('backUrl') ||
            `/dataService/infoRescCatlg?tabKey=${InfoResourcesType.Depart}`
        navigator(backUrl)
    }

    const back = () => {
        if (isChanged) {
            ReturnConfirmModal({
                onCancel: () => handleCancel(),
            })
        } else {
            handleCancel()
        }
    }

    /**
     * 步骤条
     * @param stepsType: 类型 next 下一步 prev 上一步
     * @returns
     */
    const stepsOptions = async (stepsType: string) => {
        let contineStep = false

        switch (stepsItems[stepsCurrent]?.key) {
            case StepOptionKey.SELBUSINFORM:
                contineStep = true
                break
            case StepOptionKey.INFOITEMS:
                // 下一步需要校验参数
                if (stepsType === 'next') {
                    await editTableRef?.current
                        ?.validateFileds()
                        .then(() => {
                            contineStep = true
                        })
                        .catch((e) => {
                            if (e?.errorFields?.length === 0) {
                                contineStep = true
                            } else {
                                contineStep = false
                            }
                        })
                }
                if (stepsType === 'prev') {
                    setNextBtnDisabled(!selBusinForm)
                }
                break
            case StepOptionKey.BASICINFO:
                // eslint-disable-next-line no-case-declarations
                const baseInfo = {
                    ...baseInfoForm,
                    ...basicInfoRef?.current?.getForm(),
                }
                // 保存参数
                setBaseInfoForm(baseInfo)
                setCategorysInfo(basicInfoRef?.current?.categorys)
                contineStep = true
                // 下一步需要校验参数
                // if (stepsType === 'next') {
                //     await basicInfoRef?.current
                //         ?.getFormAndValidate()
                //         .then(() => {
                //             contineStep = true
                //         })
                //         .catch((e) => {
                //             if (e?.errorFields?.length === 0) {
                //                 contineStep = true
                //             } else {
                //                 contineStep = false
                //             }
                //         })
                // }
                break

            default:
                break
        }
        if (stepsType === 'next' && contineStep) {
            setStepsCurrent(stepsCurrent + 1)
        } else if (stepsType === 'prev') {
            setStepsCurrent(stepsCurrent - 1)
        }
    }

    const stepKey = useMemo(() => {
        return stepsItems[stepsCurrent]?.key
    }, [stepsCurrent])

    const updatFieldData = (info: any) => {
        setFieldData(
            fieldData?.map((item) => ({
                ...item,
            })),
        )
    }

    const handleStageSave = async () => {
        let flag = false
        // 复制最新的fieldData数据
        if (stepKey === StepOptionKey.BASICINFO) {
            // await basicInfoRef?.current
            //     ?.getFormAndValidate()
            //     .then(() => {
            //         flag = true
            //     })
            //     .catch(() => {
            //         flag = false
            //     })
            await basicInfoRef?.current
                ?.nameValidata()
                .then(() => {
                    flag = true
                })
                .catch(() => {
                    flag = false
                })
            setBaseInfoForm({
                ...baseInfoForm,
                ...basicInfoRef?.current?.getForm(),
            })
            setCategorysInfo(basicInfoRef?.current?.categorys)
        } else if (stepKey === StepOptionKey.SELBUSINFORM) {
            flag = true
        } else if (stepKey === StepOptionKey.INFOITEMS) {
            flag = true
            // “暂存”不需要校验错误信息，仅保存用户已存字段
            // if (flag) {
            //     list = editTableRef?.current?.getSelFields()
            // }

            // 使用InfoItemEditTable组件
            // const result = editTableRef?.current?.onValidate()
            // “暂存”不需要校验错误信息，仅保存用户已存字段
            // flag = true
            // list = result.list
        }
        if (flag) {
            // list = editTableRef?.current?.getSelFields() || fieldData
            onFinish(SubmitActionType.SAVE)
        }
    }

    /**
     * 确认提交对话框
     */
    const hanldeSubmitConfirm = () => {
        confirm({
            title: __('确认要提交吗？'),
            content: __('信息资源目录提交后，需要相关部门审核。'),
            okText: __('确定'),
            cancelText: __('取消'),
            icon: <ExclamationCircleFilled style={{ color: '#faac14' }} />,
            onOk: async () => {
                onFinish(SubmitActionType.SUBMIT)
            },
            onCancel: () => {},
        })
    }

    // 格式化数组为{id, name}格式
    const formateToIdName = (arr: Array<any>) => {
        // if (
        //     arr?.[0]?.id === selectNullOption?.value ||
        //     arr?.[0]?.value === selectNullOption?.value
        // ) {
        //     return []
        // }

        const value = arr
            ?.map((item = {}) => ({
                id: item.id || item.value,
                name: item.name || item.label,
            }))
            ?.filter((item) => item.id)
        return value
    }

    /**
     * @param submitType save:暂存;submit:提交
     * @param list 信息项
     */
    const onFinish = async (submitType: SubmitActionType) => {
        const isPublish = submitType === 'submit'
        const columns =
            fieldData
                // ?.filter?.((item) => item.isSelectedFlag) // isSelectedFlag 不影响暂存和下一步  只影响批量操作
                ?.map((item) => {
                    const {
                        name,
                        name_en,
                        data_refer,
                        code_set,
                        data_type,
                        data_length,
                        data_range,
                        is_sensitive,
                        is_secret,
                        is_primary_key,
                        is_incremental,
                        is_local_generated,
                        is_standardized,
                    } = item

                    return {
                        ...item,
                        data_refer: item?.data_refer?.id
                            ? data_refer
                            : undefined,
                        code_set: item?.code_set?.id ? code_set : undefined,
                        metadata: {
                            data_type,
                            data_length,
                            data_range,
                        },
                        field_name_en: item?.field_name_en,
                        field_name_cn: item?.field_name_cn,
                        is_sensitive: !!is_sensitive,
                        is_secret: !!is_secret,
                        // 如果没有选择主键，就把选择的第一个给提示
                        is_primary_key: !!is_primary_key,
                        is_incremental: !!is_incremental,
                        is_local_generated: !!is_local_generated,
                        is_standardized: !!is_standardized,
                    }
                }) || []

        if (!columns?.length && isPublish) {
            message.error(__('信息项不能为空'))
            return
        }
        const baseInfo = {
            ...baseInfoForm,
            ...basicInfoRef?.current?.getForm(),
            action: submitType,
        }
        const categorys = categorysInfo?.length
            ? categorysInfo
            : basicInfoRef?.current?.categorys
        const category_node_ids: string[] = []
        categorys?.forEach((it, index) => {
            const val: string = baseInfo?.[`category_node_ids_${it.id}`]
            if (val) {
                category_node_ids.push(val)
                delete baseInfo[`category_node_ids_${it.id}`]
            }
        })
        const {
            source_info = {},
            relation_info = {},
            belong_info = {},
        } = baseInfo

        const { department: sourceDepart = {} } = source_info
        const {
            info_systems,
            data_resource_catalogs,
            info_resource_catalogs,
            info_items,
            related_business_scenes,
            source_business_scenes,
        } = relation_info

        const {
            business_process,
            department: belongDepart,
            office,
            business_responsibility,
        } = belong_info

        const relateSceneType = related_business_scenes?.type
        const relateSceneValue = related_business_scenes?.value?.map?.(
            (tag) => {
                return {
                    type: relateSceneType,
                    value: tag,
                }
            },
        )
        const sourceSceneType = source_business_scenes?.type
        const sourceSceneValue = source_business_scenes?.value?.map?.((tag) => {
            return {
                type: sourceSceneType,
                value: tag,
            }
        })
        const officeIdAndName = formateToIdName([office])?.[0]
        const new_belong_info = {
            business_process: formateToIdName(business_process),
            department: formateToIdName([belongDepart])?.[0],
            office:
                office && office?.value !== selectNullOption.value
                    ? business_responsibility
                        ? {
                              ...formateToIdName([office])?.[0],
                              business_responsibility,
                          }
                        : formateToIdName([office])?.[0]
                    : undefined,
        }
        const { ID, Msg, ...rest } = baseInfo
        const submitForm: any = {
            // 基本信息
            ...rest,
            columns,
            belong_info: Object.keys(belong_info).length
                ? new_belong_info
                : undefined,
            source_info: {
                ...source_info,
                department: formateToIdName([sourceDepart])?.[0],
                office: office?.id
                    ? {
                          ...officeIdAndName,
                          business_responsibility,
                      }
                    : undefined,
                business_form: {
                    id: selBusinForm?.id || '',
                    name: selBusinForm?.name || '',
                },
            },
            subject_id: baseInfo?.subject_id?.length
                ? baseInfo?.subject_id?.join()?.split(',')
                : undefined,
            category_node_ids,
            relation_info: {
                info_systems: formateToIdName(info_systems),
                data_resource_catalogs: formateToIdName(data_resource_catalogs),
                info_resource_catalogs: formateToIdName(info_resource_catalogs),
                info_items: formateToIdName(info_items),
                related_business_scenes: relateSceneValue,
                source_business_scenes: sourceSceneValue,
            },
        }
        // 前2步不需要信息项参数
        // if (stepsCurrent < 2) {
        //     delete submitForm.columns
        // }

        try {
            setLoading(true)
            if (OperateType.EDIT === oprType) {
                submitForm.id = optId
            }

            if (OperateType.CHANGE === oprType) {
                submitForm.catlgId = catlgId
                submitForm.id = alterId
            }
            const req =
                oprType === OperateType.CREATE
                    ? addInfoCatlg
                    : oprType === OperateType.CHANGE
                    ? changeInfoResCatlg
                    : updInfoCatlg
            // 提交
            if (isPublish) {
                const res = await req({ ...submitForm })
                // if (isPublish && res?.id) {
                //     await createAuditFlow({
                //         catalogID: res.id,
                //         flowType: 'af-info-catalog-publish',
                //     })
                // }
                message.success('审核发起成功')
            } else {
                // 暂存
                await req({
                    ...submitForm,
                })

                message.success('暂存成功')
            }

            setTimeout(() => {
                handleCancel()
            }, 300)
        } catch (err) {
            const { data } = err || {}
            const errCode = data?.code
            if (errCode === 400) {
                const invalidItems = data?.detail?.invalid_items
            }
            if (err?.data?.code === 'DataCatalog.Public.NoAuditDefFoundError') {
                message.error({
                    content: __('审核发起失败，未找到匹配的审核流程'),
                    duration: 5,
                })

                setTimeout(() => {
                    handleCancel()
                }, 300)
            } else if (
                err?.data?.code ===
                'DataCatalog.Public.ConfigCenterDepOwnerUsersRequestErr'
            ) {
                message.error({
                    content: err?.data?.description,
                    duration: 5,
                })
            } else {
                formatError(err)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResetChange = async () => {
        try {
            setResetBtnLoading(true)
            // 恢复到已发布的内容
            await resetInfoResCatlg({
                id: catlgId,
                alterId,
            })
            // 恢复成功后  返回到原来页面
            handleCancel()
        } catch (error) {
            formatError(error)
        } finally {
            setResetBtnLoading(false)
        }
    }

    const isChangeReject = useMemo(() => {
        return baseInfoForm?.status?.publish === PublishStatus.ChangeReject
    }, [baseInfoForm])

    const getChangeTips = () => {
        return (
            <Alert
                message={
                    <span className={styles.changeTips}>
                        <span style={{ display: 'inline' }}>
                            {isChangeReject ? (
                                <>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {__('变更未通过审批意见')}：
                                    </span>
                                    {baseInfoForm?.alter_audit_msg || '--'}
                                </>
                            ) : (
                                __('当前草稿 ${time} 由【${user}】产生', {
                                    time: baseInfoForm?.alter_at
                                        ? moment(baseInfoForm?.alter_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--',
                                    user: baseInfoForm?.alter_name || '--',
                                })
                            )}
                        </span>
                        <a
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                setResetVisible(true)
                            }}
                        >
                            {__('恢复到${type}的内容', {
                                type: '已发布',
                            })}
                        </a>
                    </span>
                }
                type={isChangeReject ? 'error' : 'info'}
                showIcon
            />
        )
    }

    const queryMainDepartInfo = async () => {
        try {
            const res = await getMainDepartInfo()
            setBaseInfoForm((pre) => ({
                ...pre,
                belong_info: {
                    ...(pre.belong_info || {}),
                    department: res,
                },
            }))
        } catch (e) {
            formatError(e)
        }
    }

    return (
        <div className={styles.infoCatlgWrapper}>
            <div className={styles.infoCatlgTitle}>
                <Row style={{ width: '100%' }}>
                    <Col span={6} className={styles.titleLeft}>
                        <GlobalMenu />
                        <Button
                            icon={<LeftOutlined />}
                            type="text"
                            className={styles.backBtn}
                            onClick={() => back()}
                        >
                            {__('返回')}
                        </Button>
                        <span className={styles.titleLine} />
                        <ResourcesDirOutlined className={styles.titleIcon} />
                        <span className={styles.title}>
                            {__('${type}信息资源目录', {
                                type:
                                    oprType === OperateType.EDIT
                                        ? __('编辑')
                                        : oprType === OperateType.CHANGE
                                        ? __('变更')
                                        : __('新建'),
                            })}
                        </span>
                    </Col>
                    <Col span={12}>
                        <div className={styles.stepsBox}>
                            {stepsItems?.length > 0 && (
                                <Steps
                                    current={stepsCurrent}
                                    items={stepsItems as Array<StepProps>}
                                />
                            )}
                        </div>
                    </Col>
                    <Col span={6} />
                </Row>
            </div>
            <div className={styles.infoCatlgContainer}>
                <div
                    className={styles.infoCatlgTip}
                    hidden={!(oprType === OperateType.CHANGE && alterId)}
                >
                    {getChangeTips()}
                </div>
                <div className={styles.infoCatlgBox}>
                    <div
                        className={classnames(
                            styles.infoCatlgBody,
                            stepKey === StepOptionKey.SELBUSINFORM &&
                                styles.selectBusinStandTableWrapper,
                        )}
                    >
                        {stepsItems[stepsCurrent]?.content}
                    </div>
                    {/* 步骤条footer按钮 */}

                    <div className={styles.optionBox}>
                        <Space size={16} className={styles.optionsBtn}>
                            {stepKey !== StepOptionKey.SELBUSINFORM && (
                                <Button
                                    // className={styles.prevBtn}
                                    onClick={() => back()}
                                >
                                    {__('取消')}
                                </Button>
                            )}
                            {![
                                StepOptionKey.SELBUSINFORM,
                                StepOptionKey.INFOITEMS,
                            ].includes(stepKey as StepOptionKey) && (
                                <Button
                                    // className={styles.prevBtn}
                                    onClick={() => handleStageSave()}
                                >
                                    {__('暂存')}
                                </Button>
                            )}
                            {(catlgId
                                ? stepKey !== StepOptionKey.INFOITEMS
                                : stepKey !== StepOptionKey.SELBUSINFORM) && (
                                <Button
                                    // className={styles.prevBtn}
                                    // icon={<LeftOutlined />}
                                    onClick={() => stepsOptions('prev')}
                                >
                                    {__('上一步')}
                                </Button>
                            )}
                            {stepKey !== StepOptionKey.BASICINFO && (
                                <Tooltip
                                    title={
                                        nextBtnDisabled &&
                                        !catlgId &&
                                        stepKey === StepOptionKey.SELBUSINFORM
                                            ? __('请选择业务标准表再点击')
                                            : ''
                                    }
                                >
                                    <Button
                                        className={styles.nextBtn}
                                        type="primary"
                                        disabled={nextBtnDisabled}
                                        onClick={() => stepsOptions('next')}
                                        style={{ width: 80 }}
                                    >
                                        {__('下一步')}
                                    </Button>
                                </Tooltip>
                            )}

                            {stepKey === StepOptionKey.BASICINFO && (
                                <Button
                                    loading={loading}
                                    type="primary"
                                    // className={styles.prevBtn}
                                    style={{ padding: '4px 31px' }}
                                    // disabled={saveBtnStatus}
                                    onClick={async () => {
                                        let validateStatus = false

                                        await basicInfoRef?.current
                                            ?.getFormAndValidate?.()
                                            .then(() => {
                                                validateStatus = true
                                            })
                                            .catch(() => {
                                                validateStatus = false
                                            })

                                        if (validateStatus) {
                                            hanldeSubmitConfirm()
                                        }
                                        // Infoitemstable提交流程
                                        // const result =
                                        //     editTableRef?.current?.onValidate() ||
                                        //     {}
                                        // // “暂存”不需要校验错误信息，仅保存用户已存字段
                                        // validateStatus = result.validateStatus
                                        // if (validateStatus) {
                                        //     const { list } = result
                                        //     hanldeSubmitConfirm(list)
                                        // }
                                    }}
                                >
                                    {__('提交')}
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>
            <Confirm
                open={resetVisible}
                title={__('确认要恢复吗？')}
                content={
                    isChangeReject
                        ? __('恢复后，变更审核未通过的内容将无法找回')
                        : __('恢复后，草稿内容将无法找回')
                }
                onOk={handleResetChange}
                onCancel={() => {
                    setResetVisible(false)
                }}
                width={432}
                okButtonProps={{ loading: resetBtnLoading }}
            />
        </div>
    )
}

export default memo(EditInfoRescCatlg)
