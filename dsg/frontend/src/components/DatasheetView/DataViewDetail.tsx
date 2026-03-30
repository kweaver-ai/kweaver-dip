import React, { useEffect, useRef } from 'react'
import { Drawer } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { RightOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { LogicViewType } from '@/core'
import MoreInfo from './MoreInfo'
import EditExcelInfoForm from './EditExcelInfoForm'

interface IDataViewDetail {
    open: boolean
    onClose: () => void
    optionType?: string
    logic: LogicViewType
    onOk?: () => void
    isDataView?: boolean
    marketViewDetail?: any
    style?: any
    isExcel?: boolean
}

const DataViewDetail = (props: IDataViewDetail, ref) => {
    const {
        open,
        onClose,
        onOk,
        optionType = 'view',
        logic,
        isDataView,
        marketViewDetail,
        style,
        isExcel = false,
    } = props

    return (
        <div>
            <Drawer
                title={
                    <span style={{ cursor: 'pointer' }} onClick={onClose}>
                        <RightOutlined style={{ marginRight: '12px' }} />
                        <span className={styles.detailsBtn}>
                            {__('收起库表信息')}
                        </span>
                    </span>
                }
                placement="right"
                onClose={onClose}
                open={open}
                closable={false}
                width={400}
                style={
                    style || {
                        height: `calc(100% - ${
                            isDataView
                                ? optionType === 'view'
                                    ? 114
                                    : 52
                                : 165
                        }px)`,
                        marginTop: isDataView
                            ? optionType === 'view'
                                ? 114
                                : 52
                            : 165,
                    }
                }
                getContainer={false}
                mask={false}
                destroyOnClose
            >
                {isExcel ? (
                    <EditExcelInfoForm />
                ) : (
                    <MoreInfo logic={logic} baseInfo={marketViewDetail} />
                )}
            </Drawer>
        </div>
    )
}

export default DataViewDetail
