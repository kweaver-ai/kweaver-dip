import { Button, Form, Input, Radio, Select, Space, Tooltip } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { ReturnConfirmModal, Return } from '@/ui'
import styles from '../styles.module.less'
import currentStyles from './styles.module.less'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import BasicInfo from '../ProvinceDetails/BasicInfo'
import { DemandInfoFields } from '../ProvinceDetails/const'
import DataSource from '../ProvinceDetails/DataSource'
import { AnalysisConclusionFields, ResourceType } from './const'
import RelatedDataSource from './RelatedDataSource'
import Confirm from '@/components/Confirm'
import {
    formatError,
    getCurUserDepartment,
    getSSZDDemandDetails,
    implementSSZDDemand,
    ISSZDCatalog,
    ISSZDDemandDetails,
} from '@/core'

const Implement = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    const [completeVisible, setCompleteVisible] = useState(false)
    const [details, setDetails] = useState<ISSZDDemandDetails>()
    const [department, setDepartment] = useState<{ id: string; name: string }>()
    const [relatedRes, setRelatedRes] = useState<ISSZDCatalog>()
    const [resourceType, setResourceType] = useState<ResourceType>()

    const handleReturn = () => {
        ReturnConfirmModal({
            onCancel: () => {
                navigate('/demand-mgt?tab=todo')
            },
        })
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const deps = await getCurUserDepartment()
            const [firstDept] = deps ?? []
            setDepartment(firstDept)
        } catch (error) {
            formatError(error)
        }
    }

    const getDetails = async () => {
        const res = await getSSZDDemandDetails({
            id: demandId,
            fields: ['basic_info', 'analysis_result'].join(','),
            view: 'operator',
        })
        setDetails(res)
    }

    useEffect(() => {
        getDetails()
        getCurDepartment()
    }, [])

    const onFinish = async () => {
        try {
            await implementSSZDDemand(demandId, {
                resources: [
                    {
                        catalog_id: relatedRes?.id!,
                        resource_id:
                            relatedRes?.resource_groups[resourceType!]?.[0]
                                .resource_id!,
                    },
                ],
            })
            navigate('/demand-mgt?tab=done&isProvince=1')
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div
            className={classNames(
                styles['analysis-wrapper'],
                currentStyles['province-implement-wrapper'],
            )}
        >
            <div className={styles.header}>
                <Return title={demandName} onReturn={() => handleReturn()} />
            </div>
            <div className={styles['analysis-body']}>
                <div className={styles['analysis-content']}>
                    <div className={styles['analysis-content-title']}>
                        {__('需求实施')}
                    </div>
                    <div className={styles['analysis-content-info']}>
                        <BasicInfo
                            details={details?.basic_info}
                            basicInfoFields={DemandInfoFields}
                            title={__('需求信息')}
                        />
                        <DataSource
                            showOperate={false}
                            basicInfo={details?.basic_info}
                        />
                        <BasicInfo
                            details={details?.analysis_result}
                            basicInfoFields={AnalysisConclusionFields}
                            title={__('签收结果')}
                        />
                        <RelatedDataSource
                            resType={
                                details?.analysis_result.duty_resource_type as
                                    | ResourceType
                                    | undefined
                            }
                            depId={department?.id || ''}
                            getRelatedRes={(res, type) => {
                                setRelatedRes(res)
                                setResourceType(type)
                            }}
                        />
                    </div>
                    <div className={styles.footer}>
                        <Space size={14}>
                            <Button
                                onClick={() => navigate('/demand-mgt?tab=todo')}
                            >
                                {__('取消')}
                            </Button>
                            <Tooltip
                                title={relatedRes ? '' : __('请关联需求资源')}
                            >
                                <Button
                                    type="primary"
                                    onClick={() => setCompleteVisible(true)}
                                    disabled={!relatedRes}
                                >
                                    {__('实施完成')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>
            <Confirm
                open={completeVisible}
                title={__('确定要提交需求实施结果吗？')}
                content={__('实施结果提交后不可修改，请确认。')}
                onOk={onFinish}
                onCancel={() => {
                    setCompleteVisible(false)
                }}
                width={432}
            />
        </div>
    )
}

export default Implement
