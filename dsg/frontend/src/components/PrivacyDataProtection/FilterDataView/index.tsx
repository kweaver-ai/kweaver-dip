import React, { useEffect, useState } from 'react'
import { Drawer } from 'antd'
import styles from './styles.module.less'
import __ from '../locale'
import DataView from './DataView'

interface IFilterDataView {
    open: boolean
    onClose: () => void
    configInfo: any
}

const FilterDataView = (props: IFilterDataView, ref) => {
    const { open, onClose, configInfo } = props

    return (
        <div className={styles.createWrapper}>
            <Drawer
                title={__('测试过滤效果')}
                onClose={onClose}
                open={open}
                width={968}
                bodyStyle={{
                    padding: '16px 24px',
                }}
                destroyOnClose
                footer={false}
            >
                <DataView configInfo={configInfo} />
            </Drawer>
        </div>
    )
}

export default FilterDataView
