import { Button } from 'antd'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { CheckOutlined } from '@/icons'
import styles from './styles.module.less'
import Standard from './standard'
import { getReport, updateReport, formatError, IReportDetails } from '@/core'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import report from '@/assets/report.svg'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import ReportAnchor from './ReportAnchor'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IReportComponent {
    modelId: string
}

const Report: React.FC<IReportComponent> = ({ modelId }) => {
    const { checkPermission } = useUserPermCtx()

    const [reportDetails, setReportDetails] = useState<IReportDetails>()
    const [unCheckedFormLength, setUnCheckedFormLength] = useState(0)
    const [loading, setLoading] = useState(true)

    const getData = async () => {
        try {
            const res = await getReport(modelId)
            setReportDetails(res)
            setUnCheckedFormLength(res?.forms?.length)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getData()
    }, [])

    const handleGetNewReport = async () => {
        try {
            setLoading(true)
            await updateReport(modelId)
            const res = await getReport(modelId)
            setReportDetails(res)
            setUnCheckedFormLength(res?.forms?.length)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const renderEmpty = () => {
        // 特殊处理，只要有除查看以外任一权限，均可诊断
        const hasAccess = checkPermission('manageDataOperationBusinessForm')
        return hasAccess ? (
            <>
                <Empty
                    iconSrc={report}
                    desc={__('可点击按钮，生成最新检测结果')}
                />
                <Button
                    onClick={handleGetNewReport}
                    type="primary"
                    icon={<CheckOutlined />}
                    className={styles.undiagnosedButton}
                >
                    {__('业务检测')}
                </Button>
            </>
        ) : (
            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
        )
    }

    return (
        <div className={styles.wrapper}>
            {loading ? (
                <div className={styles.loadingWrapper}>
                    <Loader tip={__('检测中...')} />
                </div>
            ) : Number(reportDetails?.updated_at) !== 0 ? (
                <>
                    <div className={styles.left}>
                        <div className={styles.headerWrapper}>
                            <Button
                                onClick={handleGetNewReport}
                                type="primary"
                                icon={<CheckOutlined />}
                                hidden={
                                    !checkPermission(
                                        'manageDataOperationBusinessForm',
                                    )
                                }
                            >
                                {__('重新检测')}
                            </Button>
                            <div className={styles.updateTime}>
                                {__('更新时间：${time}', {
                                    time: moment(
                                        reportDetails?.updated_at,
                                    ).format('YYYY-MM-DD HH:mm:ss'),
                                })}
                            </div>
                        </div>
                        <Standard
                            modelId={modelId}
                            forms={reportDetails?.forms}
                            onChecked={() =>
                                setUnCheckedFormLength(unCheckedFormLength - 1)
                            }
                            onReselect={() => {
                                setUnCheckedFormLength(unCheckedFormLength + 1)
                            }}
                        />
                    </div>
                    {/* <div className={styles.right}>
                        <ReportAnchor
                            unCheckedFormLength={unCheckedFormLength}
                        />
                    </div> */}
                </>
            ) : (
                <div className={styles.undiagnosedWrapper}>{renderEmpty()}</div>
            )}
        </div>
    )
}

export default Report
