import React, { useState } from 'react'
import { Space, Tooltip, message } from 'antd'
import FormViewExampleData from '@/components/DatasheetView/FormViewExampleData'
import styles from './styles.module.less'
import { CopyOutlined, DatasheetViewColored } from '@/icons'
import __ from './locale'
import { copyToClipboard } from '@/components/MyAssets/helper'

const SampleComp = (props: any) => {
    const { data } = props
    // 是否有数据
    const [dataNormal, setDataNormal] = useState<boolean>(false)

    return (
        <div className={styles.innerCompWrapper}>
            {dataNormal && (
                <div className={styles.tableHeader}>
                    <div className={styles.headerLeft}>
                        <DatasheetViewColored style={{ fontSize: 24 }} />
                        <span
                            className={styles.headerText}
                            title={data?.business_name}
                        >
                            {data?.business_name}
                        </span>
                        <Tooltip placement="bottom" title={__('复制')}>
                            <div
                                className={styles.copyIcon}
                                onClick={() => {
                                    copyToClipboard(
                                        `${data?.view_source_catalog_name}.${data?.technical_name}` ||
                                            '--',
                                    )
                                    message.success('复制成功')
                                }}
                            >
                                <CopyOutlined style={{ fontSize: 16 }} />
                            </div>
                        </Tooltip>
                    </div>
                    <div className={styles.headerRight}>
                        <Space size={24}>
                            <span>
                                {__('编码')}: {data?.uniform_catalog_code}
                            </span>
                            <span>
                                {__('技术名称')}: {data?.technical_name}
                            </span>
                        </Space>
                    </div>
                </div>
            )}
            <div className={styles.sampleDataWrapper}>
                <FormViewExampleData
                    id={data?.id}
                    getDataNormal={(value) => setDataNormal(value)}
                    scrollY="calc(100vh - 245px)"
                    isMarket
                />
            </div>
        </div>
    )
}

export default SampleComp
