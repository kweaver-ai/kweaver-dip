import React, { useMemo, useState } from 'react'
import { Button, message, Modal, Table } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { PageType, resourceTypeInfo } from '../Requirement/const'
import styles from './styles.module.less'
import { IDemandItemConfig } from '@/core'
import ConfigDetails from '../Requirement/ConfigDetails'

interface IPreviewResource {
    serviceShopData: IDemandItemConfig[]
    blankData: IDemandItemConfig[]
}

const PreviewResource: React.FC<IPreviewResource> = ({
    serviceShopData,
    blankData,
}) => {
    const [open, setOpen] = useState(false)
    const [configShow, setConfigShow] = useState(false)
    const [itemInfo, setItemInfo] = useState<IDemandItemConfig>()

    const resourceColumns = [
        {
            title: '资源名称',
            dataIndex: 'res_name',
            key: 'res_name',
            render: (_, record) => (
                <div
                    className={styles.resNameWrapper}
                    title={record.res_name}
                    onClick={() => {
                        if (record.res_status === 2) return
                        setItemInfo(record)
                        setConfigShow(true)
                    }}
                >
                    <div
                        className={classnames({
                            [styles.resourceName]: true,
                            [styles.loseEffectResourceName]:
                                record.res_status === 2,
                            [styles.loseEffect]: record.res_status === 2,
                        })}
                    >
                        {record.res_name}
                    </div>
                    {record.res_status === 2 && (
                        <div className={styles.loseEffectiveFlag}>已失效</div>
                    )}
                </div>
            ),
        },
        {
            title: '资源类型',
            dataIndex: 'res_type',
            key: 'res_type',
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.loseEffect]: record.res_status === 2,
                    })}
                >
                    {resourceTypeInfo[val]}
                </div>
            ),
        },

        {
            title: '资源描述',
            dataIndex: 'res_desc',
            key: 'res_desc',
            ellipsis: true,
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.loseEffect]: record.res_status === 2,
                        [styles.resDesc]: true,
                    })}
                >
                    {val || '--'}
                </div>
            ),
        },

        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: string, record) => (
                <Button
                    type="link"
                    disabled={record.res_status === 2}
                    onClick={() => {
                        setItemInfo(record)
                        setConfigShow(true)
                    }}
                >
                    查看配置
                </Button>
            ),
        },
    ]

    const showServiceShopData = useMemo(
        () => serviceShopData.filter((item) => item.apply_status !== 1) || [],
        [serviceShopData],
    )
    const handlePreview = () => {
        if (showServiceShopData.length === 0 && blankData.length === 0) {
            message.error('无资源可预览')
            return
        }
        setOpen(true)
    }

    return (
        <div className={styles.previewResourceWrapper}>
            <div className={styles.title}>资源清单</div>
            <div className={styles.tips}>
                点击下方按钮可预览根据资源分析结果生成的资源清单
            </div>
            <div className={styles.previewBtn} onClick={handlePreview}>
                预览资源清单
            </div>
            <Modal
                title={
                    configShow ? (
                        <div>
                            <LeftOutlined
                                className={styles.returnArrow}
                                onClick={() => setConfigShow(false)}
                            />
                            查看配置
                        </div>
                    ) : (
                        '预览'
                    )
                }
                open={open}
                onCancel={() => {
                    setOpen(false)
                    setConfigShow(false)
                }}
                width={1000}
                getContainer={false}
                bodyStyle={{ maxHeight: 545, overflowY: 'auto' }}
                footer={null}
            >
                {!configShow ? (
                    <>
                        {showServiceShopData.length > 0 && (
                            <>
                                <div className={styles.previewTitle}>
                                    数据服务超市
                                </div>
                                <Table
                                    columns={resourceColumns}
                                    dataSource={showServiceShopData}
                                    pagination={false}
                                    rowKey="id"
                                    className={styles.shopTable}
                                />
                            </>
                        )}
                        {blankData.length > 0 && (
                            <>
                                <div className={styles.previewTitle}>
                                    空白资源
                                </div>
                                <Table
                                    columns={resourceColumns}
                                    dataSource={blankData}
                                    pagination={false}
                                    rowKey="id"
                                />
                            </>
                        )}
                    </>
                ) : (
                    <ConfigDetails
                        itemInfo={itemInfo}
                        pageType={PageType.ANALYSIS}
                    />
                )}
            </Modal>
        </div>
    )
}

export default PreviewResource
