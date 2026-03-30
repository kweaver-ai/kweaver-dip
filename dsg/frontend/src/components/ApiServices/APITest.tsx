import { Drawer, Form } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { FC, useEffect, useState } from 'react'
import styles from './styles.module.less'
import GlobalMenu from '@/components/GlobalMenu'
import __ from './locale'
import ServiceTest from '../ConfigDataSerivce/ServiceTest'
import { detailServiceOverview, formatError } from '@/core'

interface APITestProps {
    open: boolean
    onClose: () => void
    serviceId: string
}

const APITest: FC<APITestProps> = ({ open, onClose, serviceId }) => {
    const [testForm] = Form.useForm()
    const [detailData, setDetailData] = useState<any>(null)

    useEffect(() => {
        if (open) {
            getPublishDetail()
        }
    }, [open])

    /**
     * 获取服务详情
     */
    const getPublishDetail = async () => {
        try {
            const detail = await detailServiceOverview(serviceId)
            setDetailData(rebuildParams(detail))
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 重构参数
     * @param params
     * @returns
     */
    const rebuildParams = (params) => {
        const { service_info, service_param, service_response, service_test } =
            params
        return {
            ...params,
            service_info: {
                datasheet_id: service_param.data_view_id,
                ...service_info,
            },
        }
    }

    return (
        <Drawer
            open
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
                position: 'fixed',
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
            <div className={styles.testApiWrapper}>
                <div className={styles.title}>
                    <GlobalMenu />
                    <div
                        onClick={() => onClose()}
                        className={styles.returnInfo}
                    >
                        <LeftOutlined className={styles.returnArrow} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.titleText}>{__('接口测试')}</div>
                </div>

                <div className={styles.content}>
                    {detailData?.service_test ? (
                        <div className={styles.serviceTestWrapper}>
                            <ServiceTest
                                form={testForm}
                                defaultValues={detailData?.service_test}
                                serviceData={detailData}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </Drawer>
    )
}

export default APITest
