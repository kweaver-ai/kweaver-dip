import { useNavigate, useSearchParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import classNames from 'classnames'
import __ from '../locale'
import styles from '../Details/styles.module.less'
import { BackUrlType } from '../const'
import {
    ISSZDDemandDetails,
    formatError,
    getSSZDDemandDetails,
    ISSZDDict,
    getSSZDDict,
    SSZDDictTypeEnum,
} from '@/core'
import BasicInfo from './BasicInfo'
import {
    AnalysisInfoFields,
    DemandInfoFields,
    DepartmentInfoFields,
    SceneInfoFields,
} from './const'
import DataSource from './DataSource'
import RelatedDataSource from './RelatedDataSource'
import OperateRecord from './OperateRecord'
import AuditDetails from './AuditDetails'
import { Return } from '@/ui'

const Details = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    const view = searchParams.get('view') || 'applier'
    const backUrl = searchParams.get('backUrl') || ''
    const [details, setDetails] = useState<ISSZDDemandDetails>()
    const [open, setOpen] = useState(false)
    const [dict, setDict] = useState<ISSZDDict>()

    const getDict = async () => {
        try {
            const res = await getSSZDDict([
                SSZDDictTypeEnum.Scene,
                SSZDDictTypeEnum.SceneType,
                SSZDDictTypeEnum.UpdateCycle,
                SSZDDictTypeEnum.OneThing,
            ])
            setDict(res)
            // 将详情中的相关枚举code 转换 value 供展示
            getDetails()
        } catch (error) {
            formatError(error)
        }
    }

    const getDetails = async () => {
        const res = await getSSZDDemandDetails({
            id: demandId,
            fields: [
                'basic_info',
                'log',
                'analysis_result',
                'implement_result',
            ].join(','),
            view,
        })
        setDetails(res)
    }

    useEffect(() => {
        getDict()
    }, [])

    const onReturn = () => {
        switch (backUrl) {
            case BackUrlType.Apply:
                navigate('/demand-application')
                break
            case BackUrlType.Sign:
                navigate('/demand-hall')
                break
            case BackUrlType.Todo:
                navigate('/demand-mgt?tab=todo')
                break
            case BackUrlType.Handle:
                navigate('/demand-mgt?tab=done')
                break
            default:
        }
    }

    return (
        <div
            className={classNames(
                styles['details-wrapper'],
                styles['province-details-wrapper'],
            )}
        >
            <div className={styles.header}>
                <Return onReturn={onReturn} title={demandName} />
            </div>
            <div className={styles.body}>
                <div className={styles['details-content-container']}>
                    <div className={styles['details-content']}>
                        {/* <Button onClick={() => setOpen(true)}>
                            点击查看审核详情
                        </Button> */}
                        <BasicInfo
                            basicInfoFields={DemandInfoFields}
                            details={details?.basic_info}
                            title={__('需求信息')}
                        />
                        <DataSource basicInfo={details?.basic_info} />
                        <BasicInfo
                            basicInfoFields={DepartmentInfoFields}
                            details={details?.basic_info}
                            title={__('部门信息')}
                        />
                        <BasicInfo
                            basicInfoFields={SceneInfoFields}
                            details={details?.basic_info}
                            title={__('业务场景')}
                        />
                        <BasicInfo
                            basicInfoFields={AnalysisInfoFields}
                            details={details?.analysis_result}
                            title={__('需求分析结论')}
                        />
                        {details?.implement_result && (
                            <RelatedDataSource
                                dataSource={
                                    details?.implement_result.catalogs || []
                                }
                            />
                        )}
                    </div>
                </div>
                <OperateRecord logs={details?.log || []} />
                <AuditDetails
                    open={open}
                    onClose={() => setOpen(false)}
                    title={demandName}
                    demandId={demandId}
                />
            </div>
        </div>
    )
}

export default Details
