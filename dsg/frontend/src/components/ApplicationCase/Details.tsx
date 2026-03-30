import { useState, useEffect } from 'react'
import { Row, Col, Table } from 'antd'
import { CommonTitle } from '@/ui'
import __ from './locale'
import { basicInfoAttrs, RefResourceType } from './const'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { AppCaseItem, formatError, getAppCaseDetailById } from '@/core'

interface DetailsProps {
    id: string
}
const Details = ({ id }: DetailsProps) => {
    const [detailInfo, setDetailInfo] = useState<AppCaseItem>()

    useEffect(() => {
        if (id) {
            getDetailInfo()
        }
    }, [id])

    const getDetailInfo = async () => {
        try {
            const res = await getAppCaseDetailById(id)
            setDetailInfo(res)
        } catch (error) {
            formatError(error)
        }
    }

    const columns: any = [
        {
            title: __('数据资源名称'),
            dataIndex: 'name',
            key: 'name', //
            render: (text, record) => {
                const { type, name, name_en } = record || {}
                return (
                    <div className={styles.nameContainer}>
                        <FontIcon
                            name={
                                type === RefResourceType.DB
                                    ? 'icon-shujubiaoshitu'
                                    : 'icon-jiekoufuwuguanli'
                            }
                            type={IconType.COLOREDICON}
                            className={styles.icon}
                        />
                        <div className={styles.names}>
                            <div className={styles.name} title={name}>
                                {name}
                            </div>
                            {/* <div className={styles.techName} title={name}>
                                {name_en}
                            </div> */}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('所属数据资源目录'),
            dataIndex: 'catalog_name',
            key: 'catalog_name',
            ellipsis: true,
            render: (catlg) => catlg || '--',
        },
        {
            title: __('资源描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || '--',
        },
    ]

    return (
        <div className={styles['details-container']}>
            <CommonTitle title={__('基本信息')} />
            <Row gutter={24} className={styles['detail-row']}>
                {basicInfoAttrs.map((item) => {
                    return (
                        <Col span={item.span || 12} key={item.key}>
                            <div className={styles['detail-item']}>
                                <div className={styles['detail-label']}>
                                    {item.label}
                                </div>
                                <div className={styles['detail-value']}>
                                    {detailInfo?.[item.key]}
                                </div>
                            </div>
                        </Col>
                    )
                })}
            </Row>
            <CommonTitle title={__('应用场景')} />
            <div className={styles['detail-item']}>
                <div className={styles['detail-label']}>{__('业务事项：')}</div>
                <div className={styles['detail-value']}>
                    {detailInfo?.process_name}
                </div>
            </div>
            <div className={styles['detail-item']}>
                <div className={styles['detail-label']}>{__('数据资源：')}</div>
            </div>
            <Table
                dataSource={detailInfo?.resources}
                columns={columns}
                className={styles.table}
                pagination={{ hideOnSinglePage: true }}
            />
        </div>
    )
}

export default Details
