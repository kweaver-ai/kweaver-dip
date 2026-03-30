import { Button, Form, Space, message, Tooltip } from 'antd'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from 'react'
import { omit } from 'lodash'
import {
    formatError,
    editDataViewBaseInfo,
    LogicViewType,
    reqInfoSystemList,
    HasAccess,
} from '@/core'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { BasicCantainer, LabelTitle } from '../ApiServices/helper'
import EditBasicInfoForm from './EditBasicInfoForm'
import OwnerDisplay from '../OwnerDisplay'
import {
    IEditFormData,
    moreInfoList,
    stateType,
    dataViewOtherInfo,
    onLineStatusList,
    sourceSignOpions,
    VIEWERRORCODElIST,
} from './const'
import { getState } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import { TimeRender } from '../DataAssetsCatlg/LogicViewDetail/helper'
import { useDataViewContext } from './DataViewProvider'
import { useQuery, isSemanticGovernanceApp } from '@/utils'
import { DetailsLabel } from '@/ui'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import ScrollLoadSelect from '../ScrollLoadSelect'

interface IMoreInfo {
    getFormIschanged?: (isChanged: boolean) => void
    onOk?: () => void
    logic: LogicViewType
    baseInfo?: any
    formDataApp?: boolean
}

const MoreInfo: React.FC<IMoreInfo> = ({
    getFormIschanged,
    onOk,
    logic,
    baseInfo,
    formDataApp = false,
}) => {
    const query = useQuery()
    const [form] = Form.useForm()
    const {
        datasheetInfo,
        optionType,
        setOptionType,
        isSubmitBasicInfoForm,
        setDatasheetInfo,
        isValueEvaluation,
        fieldsTableData,
        baseInfoData,
    } = useDataViewContext()
    const [moreInfoData, setMoreInfoData] = useState<any>()
    const [dataViewOtherData, setDataViewOtherData] =
        useState<any>(dataViewOtherInfo)
    const [moreInfoContent, setMoreInfoContent] = useState<any>(
        logic === LogicViewType.DataSource
            ? moreInfoList
            : moreInfoList.map((info, idx) => {
                  if (idx === 0) {
                      const { list } = info
                      return {
                          ...info,
                          list: list.filter(
                              (li) =>
                                  ![
                                      'status',
                                      'datasource_name',
                                      'schema',
                                      'info_system',
                                  ].includes(li.key),
                          ),
                      }
                  }
                  return info
              }),
    )

    const { checkPermissions } = useUserPermCtx()
    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [infoSystem, setInfoSystem] = useState<string>()
    const [{ using }] = useGeneralConfig()
    // semanticGovernance 专用
    const isSemanticGovernance = isSemanticGovernanceApp()

    /**
     * 是否是安全管理员
     */
    const isTrueRole = true

    useEffect(() => {
        if (moreInfoData?.id) {
            getMoreInfoContent()
        }
    }, [moreInfoData, fieldsTableData, baseInfoData])

    useEffect(() => {
        if (datasheetInfo?.id || baseInfo?.id) {
            setMoreInfoData(datasheetInfo?.id ? datasheetInfo : baseInfo)
        }
    }, [datasheetInfo, baseInfo])
    useEffect(() => {
        getFormIschanged?.(isChanged)
    }, [isChanged])

    useEffect(() => {
        if (optionType === 'view' || !isTrueRole) {
            form.resetFields()
        }
    }, [optionType])

    useEffect(() => {
        if (isSubmitBasicInfoForm) {
            form.submit()
        }
    }, [isSubmitBasicInfoForm])

    useEffect(() => {
        if (optionType === 'edit' && isTrueRole) {
            form.setFields([
                {
                    name: 'business_name',
                    value: datasheetInfo?.business_name,
                    errors: datasheetInfo?.business_name_tips
                        ? [datasheetInfo?.business_name_tips]
                        : [],
                },
                {
                    name: 'technical_name',
                    value: datasheetInfo?.technical_name,
                    errors: datasheetInfo?.technical_name_tips
                        ? [datasheetInfo?.technical_name_tips]
                        : [],
                },
            ])
        }
    }, [datasheetInfo?.business_name])

    const onFinish = async (values) => {
        try {
            if (isSubmitBasicInfoForm) {
                // 自定义库表、逻辑实体库表创建
                setDatasheetInfo?.((prev) => ({
                    ...prev,
                    ...values,
                }))
            } else {
                // if (!values.owner_id) {
                //     message.info(__('请先完善库表的更多信息（有必填信息未填）'))
                //     return
                // }
                let data = {
                    ...values,
                    form_view_id: moreInfoData?.id,
                    owners: values?.owners?.map((id) => ({ owner_id: id })),
                }
                if (logic === LogicViewType.LogicEntity) {
                    data = omit(data, 'subject_id')
                } else if (logic === LogicViewType.DataSource) {
                    data = omit(data, 'technical_name')
                }
                await editDataViewBaseInfo(data)
                // setOptionType('view')
                onOk?.()
                setIsChanged(false)
                message.success(__('保存成功'))
            }
        } catch (err) {
            if (err?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                message.error(
                    __('当前库表中引用的库表被删除，您可编辑后重新发布'),
                )
            } else {
                formatError(err)
            }
        }
    }

    const getMoreInfoContent = () => {
        // 从 fieldsTableData 或 baseInfoData.fields 中获取字段数据来判断是否有业务时间戳
        const fields =
            fieldsTableData?.length > 0
                ? fieldsTableData
                : baseInfoData?.fields || moreInfoData?.fields || []
        const hasTimestamp = fields.some((o) => o.business_timestamp)
        if (moreInfoData?.info_system_id) {
            setInfoSystem(moreInfoData?.info_system_id)
        }
        const list = moreInfoContent.map((item) => {
            const filterKes: string[] = []
            if (using === 1) {
                filterKes.push('online_status')
            }
            if (!hasTimestamp) {
                filterKes.push('data_updated_at')
            }
            if (isValueEvaluation) {
                filterKes.push('source_sign')
            }
            if (isSemanticGovernance) {
                filterKes.push('online_status')
            } else {
                filterKes.push('status')
            }
            const detailsField = item.list.filter(
                (o) => !filterKes.includes(o.key),
            )
            return {
                ...item,
                list: detailsField.map((it) => {
                    let value: any
                    if (it.key === 'created_at' || it.key === 'updated_at') {
                        value = moment(moreInfoData?.[it.key]).format(
                            'YYYY-MM-DD HH:mm:ss',
                        )
                    } else if (it.key === 'source_sign') {
                        value =
                            sourceSignOpions?.find(
                                (o) => o.value === moreInfoData?.[it.key],
                            )?.label || '--'
                    } else {
                        value = moreInfoData?.[it.key] || ''
                    }
                    const obj = {
                        ...it,
                        value,
                    }
                    switch (it.key) {
                        case 'status':
                            obj.render = () =>
                                getState(
                                    moreInfoData?.last_publish_time
                                        ? 'publish'
                                        : 'unpublished',
                                )
                            break
                        case 'online_status':
                            obj.render = () =>
                                getState(
                                    moreInfoData?.online_status,
                                    onLineStatusList,
                                )
                            break
                        case 'data_updated_at':
                            obj.render = () => (
                                <TimeRender formViewId={datasheetInfo?.id} />
                            )
                            break
                        case 'owners':
                            obj.render = () => (
                                <OwnerDisplay value={moreInfoData?.owners} />
                            )
                            break
                        default:
                            break
                    }
                    return obj
                }),
            }
        })
        setMoreInfoContent(list)
        setDataViewOtherData(
            dataViewOtherInfo.map((item) => {
                return {
                    ...item,
                    value: moreInfoData?.[item.key],
                }
            }),
        )
    }

    const getInfoSystem = async (params: any) => {
        try {
            const res = await reqInfoSystemList({
                limit: 50,
                offset: 1,
                ...params,
            })
            return res.entries || []
        } catch (error: any) {
            formatError(error)
            return []
        }
    }
    return (
        <div
            className={
                !formDataApp
                    ? `${styles.moreInfoWrapper}`
                    : `${styles.moreInfoWrapper} ${styles.moreInfoFormDataAppWrapper}`
            }
        >
            <div className={styles.moreInfoBox}>
                {(optionType === 'view' || !isTrueRole) && (
                    <div className={styles.moreInfoView}>
                        <div style={{ marginTop: -20 }}>
                            <BasicCantainer
                                labelWidth="142px"
                                basicCantainerContent={moreInfoContent}
                            />
                        </div>
                    </div>
                )}
                {(optionType === 'edit' || optionType === 'create') &&
                    isTrueRole && (
                        <div className={styles.editMoreInfoView}>
                            <div style={{ marginTop: -20 }}>
                                <LabelTitle label={__('基本属性')} />
                            </div>
                            <div className={styles.moreInfoEdit}>
                                <EditBasicInfoForm
                                    onFinish={onFinish}
                                    form={form}
                                    type="view"
                                    onDataChange={() => setIsChanged(true)}
                                    logic={logic}
                                />
                            </div>
                            <div className={styles.otherInfo}>
                                <DetailsLabel
                                    labelWidth="110px"
                                    wordBreak
                                    detailsList={dataViewOtherData}
                                />
                                {/* <span className={styles.infoSystemTips}>
                                    {__('来源所属数据源，不可直接更改')}
                                </span> */}
                                <div className={styles.infoSystem}>
                                    <div style={{ flexShrink: 0 }}>
                                        {__('关联信息系统')}：
                                    </div>
                                    <ScrollLoadSelect
                                        className={styles.infoSystemSelect}
                                        fetchOptions={getInfoSystem}
                                        placeholder={`${__('请选择')}${__(
                                            '所属信息系统',
                                        )}`}
                                        value={infoSystem}
                                        allowClear
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        onChange={(val, options) => {
                                            setInfoSystem(val)
                                            setDatasheetInfo((pre) => ({
                                                ...pre,
                                                info_system_id:
                                                    val || undefined,
                                            }))
                                        }}
                                    />
                                    {/* <ScrollLoadInfoSystemSelect
                                        className={styles.infoSystemSelect}
                                        placeholder={`${__('请选择')}${__(
                                            '关联信息系统',
                                        )}`}
                                        value={infoSystem}
                                        disableDetailFetch
                                        onChange={(val, options) => {
                                            setInfoSystem(val)
                                            form.setFieldValue(
                                                'info_systems',
                                                val || undefined,
                                            )
                                        }}
                                    /> */}
                                </div>
                            </div>
                            {/* {logic !== LogicViewType.DataSource &&
                            !datasheetInfo?.isCustomOrLogicEntityEdit && (
                                <div className={styles.moreInfoEditFooter}>
                                    <Space size={16}>
                                        <Button
                                            onClick={() => {
                                                if (isChanged) {
                                                    ReturnConfirmModal({
                                                        onCancel: () => {
                                                            // setOptionType('view')
                                                            setIsChanged(false)
                                                            form.resetFields()
                                                        },
                                                    })
                                                } else {
                                                    // setOptionType('view')
                                                }
                                            }}
                                        >
                                            {__('取消')}
                                        </Button>
                                        <Button
                                            type="primary"
                                            onClick={() => form.submit()}
                                        >
                                            {__('保存')}
                                        </Button>
                                    </Space>
                                </div>
                            )} */}
                        </div>
                    )}
            </div>
        </div>
    )
}

export default MoreInfo
