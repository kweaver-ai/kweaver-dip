import React, { useState } from 'react'
import { Col, Row, Space, Tag } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import { isNumber } from 'lodash'
import {
    DownOutlined,
    LeftOutlined,
    RightOutlined,
    UpOutlined,
} from '@ant-design/icons'
import Loader from '@/ui/Loader'
import { catlgBasicInfoConfig } from '../helper'
import styles from './styles.module.less'
import {
    InfoTypeEnum,
    ShareTypeEnum,
    shareTypeList,
    traverseArray,
    updateCycleOptions,
} from '@/components/ResourcesDir/const'
import { IDataCatlgBasicInfo } from '@/core'
import __ from '../locale'
import { LocationOtlined } from '@/icons'
import { dataKindOptions } from '@/components/ResourcesDir/helper'
import ApplicationServiceDetail from '../ApplicationServiceDetail'
import { ApiServicesDisplayMaxCount } from './const'

interface IBasicInfo {
    basicInfo: IDataCatlgBasicInfo
    servicesInfo: any
    getIsExpandBasicInfo: (expand: boolean) => void
}
const BasicInfo: React.FC<IBasicInfo> = ({
    basicInfo,
    servicesInfo,
    getIsExpandBasicInfo,
}) => {
    const [isExpand, setIsExpand] = useState(true)
    // 展开按钮是否显示
    const [showExpBtn, setShowExpBtn] = useState(false)
    // 描述-展开/收起
    const [apiExpand, setApiExpand] = useState(false)
    // 接口服务详情
    const [openStatus, setOpenStatus] = useState<boolean>(false)
    const [selectedService, setSelectedService] = useState<string>('')

    const handleToApiDetail = (service_code: string) => {
        setOpenStatus(true)
        setSelectedService(service_code)
    }

    const loadInfoValue = (configName: string, configType?: number) => {
        let data: any = []
        let dataKey = 'value'
        let dataLabel = 'label'

        let res: any

        let value: any
        if (configName === 'services') {
            value = servicesInfo?.entries || []
        } else {
            value = basicInfo?.[configName] || ''
        }

        if (configName === 'data_kind') {
            data = dataKindOptions.filter(
                (item) => value?.length && value?.includes(item.value),
            )
        } else if (configName === 'update_cycle') {
            data = updateCycleOptions
        } else if (configName === 'infos') {
            data =
                basicInfo?.infos?.find((item) => item.info_type === configType)
                    ?.entries || []
        } else if (configName === 'business_object_path') {
            const path = basicInfo?.[configName]
            data = path?.map((item) => {
                const joinPath = item.map((it) => it.name).join('/')
                dataKey = 'joinPath'
                dataLabel = 'joinPath'
                return {
                    joinPath,
                }
            })
        } else if (configName === 'services') {
            data = servicesInfo?.entries
            // 收起就只展示4个
            if (!apiExpand) {
                data = data?.slice(0, ApiServicesDisplayMaxCount)
            }
            dataKey = 'service_code'
            dataLabel = 'service_name'
        }

        switch (configName) {
            case 'infos':
                // 关联信息类型 1 标签 2 来源业务场景 3 关联业务场景 4 关联系统 5 关联目录、信息项
                if (configType === InfoTypeEnum.TAG) {
                    return data?.length ? (
                        <Space size={4} wrap className={styles.multTagSpace}>
                            {data?.map((eItem: any) => (
                                <Tag
                                    key={eItem.info_key}
                                    title={eItem?.info_value}
                                    className={classnames(styles.basicTag)}
                                >
                                    <span>{eItem.info_value}</span>
                                </Tag>
                            ))}
                        </Space>
                    ) : (
                        '--'
                    )
                }
                if (configType === InfoTypeEnum.ASSOCIATEDSYSTEM) {
                    const infoVal =
                        data?.map((item) => item.info_value).join('') || '--'
                    return <span title={infoVal}>{infoVal}</span>
                }
                return '--'
            case 'data_kind':
            case 'business_object_path':
                return data?.length ? (
                    <Space size={4} wrap className={styles.multTagSpace}>
                        {data?.map((eItem) => {
                            return (
                                <Tag
                                    title={eItem?.[dataLabel]}
                                    key={eItem?.dataKey}
                                    className={styles.basicTag}
                                >
                                    {configName === 'business_object_path' && (
                                        <LocationOtlined
                                            className={styles.pathIcon}
                                        />
                                    )}
                                    <span>{eItem?.[dataLabel]}</span>
                                </Tag>
                            )
                        })}
                    </Space>
                ) : (
                    '--'
                )
            case 'services':
                return data?.length ? (
                    <div className={styles.apiServiceWrapper}>
                        <Space size={4} wrap>
                            {data?.map((eItem) => {
                                return (
                                    <Tag
                                        title={eItem?.[dataLabel]}
                                        key={eItem?.dataKey}
                                        className={classnames(
                                            styles.basicTag,
                                            styles.serviceTag,
                                        )}
                                    >
                                        <a
                                            className={styles.serviceLink}
                                            onClick={() => {
                                                handleToApiDetail(
                                                    eItem.service_id,
                                                )
                                            }}
                                        >
                                            {`${eItem?.[dataLabel]}`}
                                        </a>
                                    </Tag>
                                )
                            })}
                        </Space>
                        {showExpBtn && (
                            <div
                                className={styles.apiExpand}
                                onClick={() => {
                                    setApiExpand(!apiExpand)
                                }}
                            >
                                {apiExpand ? __('收起') : __('展开')}
                                {apiExpand ? (
                                    <UpOutlined className={styles.expIcon} />
                                ) : (
                                    <DownOutlined className={styles.expIcon} />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    '--'
                )
            case 'update_cycle':
                return (
                    data.find((mItem) => value === mItem.value)?.label || '--'
                )

            case 'updated_at':
            case 'created_at':
            case 'published_at':
                return (
                    <span className={styles.expEllipsis}>
                        {isNumber(value)
                            ? moment(value).format('YYYY-MM-DD')
                            : '--'}
                    </span>
                )
            case 'row_count':
            case 'preview_count':
            case 'score_count':
            case 'apply_count':
                return isNumber(value) ? value : '--'
            case 'orgname':
                return <span title={value || '--'}>{value || '--'}</span>
            case 'shared_type':
                return traverseArray(shareTypeList, value)
            default:
                return value || '--'
        }
    }

    // 加载单个配置信息
    const loadRowInfo = (rowConfig: any) => {
        const value = loadInfoValue(rowConfig.key, rowConfig.type)
        return (
            <div
                className={styles.rowWrapper}
                key={`${rowConfig.key}${rowConfig.type ? rowConfig.type : ''}`}
            >
                <div className={styles.label}>{`${rowConfig.label}：`}</div>
                <div
                    className={classnames(
                        styles.value,
                        rowConfig.key === 'business_object_path' && styles.path,
                    )}
                >
                    {value}
                </div>
            </div>
        )
    }

    return (
        <div
            className={classnames(
                !isExpand && styles['fold-basic-info'],
                styles['basic-info'],
            )}
        >
            <div className={classnames(styles.header)}>
                <div
                    className={styles.arrow}
                    onClick={() => {
                        setIsExpand(!isExpand)
                        getIsExpandBasicInfo(!isExpand)
                    }}
                >
                    {isExpand ? <RightOutlined /> : <LeftOutlined />}
                </div>
                <div className={styles.title}>
                    {isExpand ? __('收起相关信息') : __('查看相关信息')}
                </div>
            </div>
            <div className={styles.content} hidden={!isExpand}>
                <Row key="basic" className={styles.basicRow}>
                    {catlgBasicInfoConfig.map((config) => {
                        let configTemp = config
                        if (config.key === 'shared_condition') {
                            if (
                                ShareTypeEnum.NOSHARE === basicInfo?.shared_type
                            ) {
                                configTemp = {
                                    ...config,
                                    label: __('不予共享依据'),
                                }
                            } else if (
                                ShareTypeEnum.UNCONDITION ===
                                basicInfo?.shared_type
                            ) {
                                //  无条件共享,则不展示共享条件、不予共享依据；
                                return ''
                            }
                        }
                        const content = loadRowInfo(configTemp)
                        const loadRowInfoNode = content && (
                            <Col
                                span={configTemp.colSpan}
                                key={`${configTemp.key}`}
                            >
                                {content}
                            </Col>
                        )
                        return !!loadRowInfoNode && loadRowInfoNode
                    })}
                </Row>
            </div>

            {openStatus && (
                <ApplicationServiceDetail
                    open={openStatus}
                    onClose={() => {
                        setOpenStatus(false)
                    }}
                    serviceCode={selectedService}
                    isIntroduced
                    style={{
                        position: 'fixed',
                        width: '100vw',
                        height: '100vh',
                        top: '52px',
                        borderTop: '1px solid rgb(0 0 0 / 10%)',
                    }}
                    getContainer={
                        document.getElementById('root') as HTMLElement
                    }
                />
            )}
        </div>
    )
}

export default BasicInfo
