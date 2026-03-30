import React, { useMemo, useRef } from 'react'
import { Tabs, Drawer } from 'antd'
import DirColumnInfo from '@/components/ResourcesDir/DirColumnInfo'
import DirBasicInfo from '@/components/ResourcesDir/DirBasicInfo'
import { basicAttrConfig } from './const'
import styles from './styles.module.less'
import __ from './locale'
import { ResourceType } from '../ResourcesDir/const'

function DetailDialog({ id, detail = {}, toast, open, onCancel }: any) {
    const handleCancel = () => {
        onCancel()
    }

    const ref = useRef({
        getDirName: () => {},
    })

    const isOnlyFileResc = useMemo(() => {
        return (
            detail?.mountInfo?.length &&
            detail?.mountInfo?.every(
                (o) => o.resource_type === ResourceType.File,
            )
        )
    }, [detail])

    return (
        <Drawer
            title={__('查看数据资源目录详情')}
            placement="right"
            onClose={handleCancel}
            open={open}
            width="calc(100vw - 220px)"
            push={false}
        >
            <div className={styles.modalContent}>
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab={__('基本信息')} key="1">
                        <DirBasicInfo
                            catalogId={id}
                            ref={ref}
                            isMarket
                            isAudit
                        />
                    </Tabs.TabPane>
                    {!isOnlyFileResc && (
                        <Tabs.TabPane tab={__('信息项')} key="2">
                            <DirColumnInfo catalogId={id} isMarket />
                        </Tabs.TabPane>
                    )}
                </Tabs>
            </div>
        </Drawer>
    )
}

export default DetailDialog
