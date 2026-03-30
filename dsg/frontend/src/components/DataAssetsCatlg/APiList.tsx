import * as React from 'react'
import { useState, useEffect, FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { chunk, flatten, noop } from 'lodash'
import { Row, Space } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { queryFrontendServiceOverviewList } from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import { ServiceType, SubTitle } from './helper'
import ApplicationServiceDetail from './ApplicationServiceDetail'

interface APIListType {
    id: string
    isIntroduced?: boolean
    getClickAsset?: (asset: any, st: ServiceType) => void
    getAddAsset?: (asset: any) => void
}

const APIList: FC<APIListType> = (props) => {
    const {
        id,
        isIntroduced = false,
        getClickAsset = noop,
        getAddAsset = noop,
    } = props
    const [apiData, setAPIData] = useState<Array<Array<any>>>([])
    const [totalCount, setTotalCount] = useState<number>(0)
    const [openStatus, setOpenStatus] = useState<boolean>(false)
    const [selectedService, setSelectedService] = useState<string>('')
    const navigator = useNavigate()

    useEffect(() => {
        if (id) {
            getAPIData([])
        }
    }, [id])

    const getAPIData = async (initData) => {
        const { entries, total_count } = await queryFrontendServiceOverviewList(
            {
                limit: 15,
                offset: initData.length ? initData.length / 15 + 1 : 1,
                data_catalog_id: id,
            },
        )
        setTotalCount(total_count)
        setAPIData(chunk([...initData, ...entries], 5))
    }
    return apiData.length ? (
        <div>
            <SubTitle text={__('接口服务')} showIcon={false} />
            <div className={styles.apiListContainer}>
                <Space size={16} direction="vertical">
                    {apiData.map((apis) => {
                        return (
                            <Space size={20}>
                                {apis.map((api) => {
                                    return (
                                        <div
                                            className={styles.apiBox}
                                            title={api.service_name}
                                            onClick={() => {
                                                if (isIntroduced) {
                                                    getClickAsset(
                                                        {
                                                            serviceCode:
                                                                api.service_code,
                                                        },
                                                        ServiceType.APPLICATIONSERVICE,
                                                    )
                                                } else {
                                                    setOpenStatus(true)
                                                    setSelectedService(
                                                        api.service_id,
                                                    )
                                                }
                                            }}
                                        >
                                            <div className={styles.iconText}>
                                                API
                                            </div>
                                            <div className={styles.text}>
                                                {api.service_name}
                                            </div>
                                        </div>
                                    )
                                })}
                            </Space>
                        )
                    })}
                </Space>
                {flatten(apiData).length < totalCount ? (
                    <div
                        onClick={() => {
                            getAPIData(flatten(apiData))
                        }}
                        className={styles.more}
                    >
                        {__('更多')}
                        <DownOutlined className={styles.icon} />
                    </div>
                ) : null}
            </div>
            <ApplicationServiceDetail
                open={openStatus}
                onClose={() => {
                    setOpenStatus(false)
                }}
                serviceCode={selectedService}
                isIntroduced={false}
            />
        </div>
    ) : null
}

export default APIList
