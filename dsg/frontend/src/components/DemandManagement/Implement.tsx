import { Button, Input, Space, message } from 'antd'
import classnames from 'classnames'
import { useEffect, useMemo, useState } from 'react'

import { CloseCircleFilled } from '@ant-design/icons'
import { trim } from 'lodash'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    IAnalysisResult,
    IDemandDetails,
    IDemandItemInfo,
    formatError,
    getAuditProcessFromConfCenter,
    getDemandDetailsV2,
    implementAcceptV2,
    implementBackV2,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { Return } from '@/ui'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import { getActualUrl } from '@/utils'
import CommonTitle from './CommonTitle'
import DemandInfo from './Details/DemandInfo'
import ImplementDemandItems from './Details/ImplementDemandItems'
import { DemandDetailView, rescApplyAuthEnd } from './const'
import __ from './locale'
import styles from './styles.module.less'

interface IImplementProps {
    // 是否为后台实施页面
    isBack?: boolean
}

const Implement = ({ isBack = false }: IImplementProps) => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [{ using }, updateUsing] = useGeneralConfig()

    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    const [analysisRes, setAnalysisRes] = useState<IAnalysisResult>()
    const [details, setDetails] = useState<IDemandDetails>()
    // 保存初始详情，点击返回时进行判断
    const [originDetails, setOriginDetails] = useState<IDemandDetails>()
    // const [items, setItems] = useState<IDemandItemInfo[]>([])
    const [applyRescList, setApplyRescList] = useState<IDemandItemInfo[]>()
    const [feedback, setFeedback] = useState('')
    const [existPermissionReq, setExistPermissionReq] = useState(true)

    const getDemandDetail = async () => {
        try {
            if (demandId) {
                const res = await getDemandDetailsV2({
                    id: demandId,
                    fields: 'basic_info,analysis_result,implement_result',
                    view: isBack
                        ? DemandDetailView.OPERAOTR
                        : DemandDetailView.APPLIER,
                })
                setDetails(res)
                if (!originDetails) {
                    setOriginDetails(res)
                }
                const items = res?.analysis_result?.items
                const apply_details = res?.implement_result?.apply_details
                const applyAuthPhaseList = {}
                apply_details?.forEach((applyItem) => {
                    applyAuthPhaseList[applyItem?.res_id] = applyItem
                })
                const newApplyResces = items?.map((item) => {
                    return {
                        ...item,
                        ...applyAuthPhaseList[item?.res_id],
                    }
                })
                setApplyRescList(newApplyResces)
            }
        } catch (err) {
            formatError(err)
        }
    }
    // 获取是否配置权限申请审核策略
    const getAuditProcess = async () => {
        try {
            const res = await getAuditProcessFromConfCenter({
                audit_type: 'af-data-permission-request',
            })
            setExistPermissionReq(res.entries?.length > 0)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getAuditProcess()
    }, [])

    useEffect(() => {
        setOriginDetails(undefined)
        getDemandDetail()
    }, [demandId])

    // 实施完成不可点击
    const disableImplement = useMemo(() => {
        if (!isBack) return false
        const flag = applyRescList?.find((item) => {
            const { auth_apply_id, phase, is_online, is_publish } = item
            // 已发布/上线状态
            const rescStatus =
                (using === 1 && is_publish) || (using === 2 && is_online)

            return (
                rescStatus &&
                auth_apply_id &&
                !rescApplyAuthEnd
                    ?.join()
                    ?.toLocaleLowerCase()
                    ?.includes(phase?.toLocaleLowerCase())
            )
        })

        return !!flag
    }, [applyRescList])

    const getImpRes = (data) => {
        setApplyRescList(data)
    }

    const handleChangeResces = (data) => {
        setApplyRescList(data)
    }

    const getBackUrl = () => {
        let backUrl = ''
        if (isBack) {
            backUrl = '/demand-mgt?tab=todo'
        } else {
            backUrl = '/demand-application'
        }
        return backUrl
    }

    const handleOk = async () => {
        try {
            let linkUrl = getBackUrl()
            if (isBack) {
                await implementBackV2(demandId)
                linkUrl = `/demand-mgt?tab=done&keyword=${details?.basic_info?.code}`
            } else {
                await implementAcceptV2(demandId, {
                    accept_feedback: feedback,
                })
            }
            message.success(isBack ? __('实施完成') : __('验收完成'))
            if (isBack) {
                // keyword中含有 / 导致本页面从审核策略页跳转回来时navigate跳转路径错误，所以使用window.open跳转
                window.open(getActualUrl(linkUrl), '_parent')
            } else {
                navigate(linkUrl)
            }
        } catch (error) {
            if (
                error?.data?.code ===
                'DemandManagement.Public.DemandImplementInvalidError'
            ) {
                error({
                    title: __('实施失败'),
                    className: 'commonInfoModalError',
                    icon: <CloseCircleFilled className={styles.errIcon} />,
                    content: error?.data?.description || '',
                    okText: __('确定'),
                })
                getDemandDetail()
                return
            }
            formatError(error)
        }
    }

    const onReturn = () => {
        const onClose = () => {
            navigate(getBackUrl())
        }
        let hasChanged: boolean = false
        try {
            const originFields = {}
            originDetails?.implement_result?.apply_details?.forEach((item) => {
                originFields[item.res_id] = item
            })
            hasChanged = !!applyRescList?.find((item) => {
                return item.phase !== originFields[item.res_id]?.phase
            })
        } catch (e) {
            formatError(e)
        } finally {
            if (hasChanged) {
                ReturnConfirmModal({
                    content: __('离开此页将放弃当前更改的内容，请确认操作。'),
                    onCancel: () => {
                        onClose()
                    },
                })
            } else {
                onClose()
            }
        }
    }

    return (
        <div
            className={classnames(
                styles['implement-wrapper'],
                styles['analysis-confirm-wrapper'],
            )}
        >
            <div className={styles.header}>
                <Return
                    title={isBack ? __('需求实施') : __('实施验收')}
                    onReturn={onReturn}
                />
            </div>
            <div className={styles['analysis-confirm-body']}>
                <div className={styles['analysis-confirm-content']}>
                    <div className={styles['analysis-confirm-content-title']}>
                        {isBack ? __('需求实施') : __('实施验收')}
                    </div>

                    <div className={styles['analysis-confirm-content-info']}>
                        <div
                            className={classnames(
                                styles['content-padding'],
                                styles['demand-info-title'],
                            )}
                        >
                            <CommonTitle title={__('需求信息')} />
                        </div>
                        <div className={styles['demand-info-container']}>
                            <DemandInfo
                                isShowTitle={false}
                                details={details?.basic_info}
                                analyserInfo={
                                    isBack
                                        ? details?.analysis_result
                                        : undefined
                                }
                            />
                        </div>
                        <div
                            className={classnames(
                                styles['content-padding'],
                                styles['demand-info-title'],
                            )}
                        >
                            <CommonTitle title={__('资源清单')} />
                        </div>
                        <div className={styles['demand-items-container']}>
                            <ImplementDemandItems
                                id={demandId}
                                analysisId={
                                    details?.analysis_result?.analysis_id
                                }
                                getImpRes={getImpRes}
                                initRescList={applyRescList}
                                handleChangeResces={handleChangeResces}
                                isBack={isBack}
                                existPermissionReq={existPermissionReq}
                            />
                        </div>
                        {!isBack && (
                            <>
                                <div
                                    className={classnames(
                                        styles['content-padding'],
                                        styles['demand-info-title'],
                                    )}
                                >
                                    <CommonTitle title={__('验收反馈')} />
                                </div>
                                <div className={styles['feedback-container']}>
                                    <div className={styles['feedback-label']}>
                                        {__('反馈内容：')}
                                    </div>
                                    <Input.TextArea
                                        className={styles['feedback-textarea']}
                                        maxLength={300}
                                        showCount
                                        placeholder={__('请输入')}
                                        value={feedback}
                                        onChange={(e) =>
                                            setFeedback(trim(e.target.value))
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className={styles.footer}>
                        <Space size={14}>
                            <Button onClick={onReturn}>{__('取消')}</Button>
                            <Button
                                type="primary"
                                onClick={() => handleOk()}
                                // disabled={disableImplement}
                                // title={
                                //     disableImplement
                                //         ? __(
                                //               '请确保所有资源都已完成实施后再点击此处',
                                //           )
                                //         : ''
                                // }
                            >
                                {isBack ? __('实施完成') : __('验收完成')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Implement
