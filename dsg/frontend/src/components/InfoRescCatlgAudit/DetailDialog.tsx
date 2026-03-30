import React, { useRef } from 'react'
import { Tabs, Drawer } from 'antd'
import { basicAttrConfig } from './const'
import styles from './styles.module.less'
import __ from './locale'
import InfoCatlgDetails from '../InfoRescCatlg/Details'
import DirBasicInfo from '../InfoRescCatlg/Details/BasicInfo'
import DirColumnInfo from '../InfoRescCatlg/Details/InfoItems'
import DataCatlgAbstract from '../InfoRescCatlg/Details/RelatedCatlg'

function DetailDialog({ id, toast, open, onCancel }: any) {
    const handleCancel = () => {
        onCancel()
    }

    const ref = useRef({
        getDirName: () => {},
    })

    return (
        <Drawer
            title={__('查看信息资源目录详情')}
            placement="right"
            onClose={handleCancel}
            open={open}
            width="90%"
        >
            <div className={styles.modalContent}>
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab={__('基本信息')} key="1">
                        <DirBasicInfo catalogId={id} ref={ref} />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={__('信息项')} key="2">
                        <DirColumnInfo catalogId={id} />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={__('相关目录')} key="3">
                        <DataCatlgAbstract catalogId={id} />
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </Drawer>
    )
}

export default DetailDialog
