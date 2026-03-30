import { useEffect, useState } from 'react'
import { Node } from '@antv/x6'
import { Modal, ModalProps } from 'antd'
import styles from './styles.module.less'
import {
    formatError,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    queryFrontendInterfaceServiceList,
} from '@/core'
import { filterEmptyProperties, IEditFormData } from '../DatasheetView/const'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import FieldList from '@/components/DatasheetView/FieldList'

interface IFieldTableLogicProps extends ModalProps {
    visible: boolean
    onClose: () => void
    id: string
}
const FieldTableLogic = ({
    visible,
    onClose,
    id,
    ...props
}: IFieldTableLogicProps) => {
    const [loading, setLoading] = useState(true)
    const [baseInfoData, setBaseInfoData] = useState<any>({})
    const [hasTimestamp, setHasTimestamp] = useState<boolean>(false)
    const [detailsData, setDetailsData] = useState<any>()
    const [fieldsTableData, setFieldsTableData] = useState<any[]>([])
    const [isGradeOpen] = useGradeLabelState()

    useEffect(() => {
        if (visible) {
            getDetails()
        }
    }, [id])

    /**
     * 获取表单详情
     */
    const getDetails = async () => {
        if (!id) return
        try {
            setLoading(true)
            const res = await getDatasheetViewDetails(id)
            const baseRes = await getDataViewBaseInfo(id)

            let asscoiateInterfaces: any = []
            try {
                asscoiateInterfaces = (
                    await queryFrontendInterfaceServiceList(id)
                )?.entries
            } catch (e) {
                // formatError(e)
            }

            // 去除空字段
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            setBaseInfoData({
                ...baseResValue,
                id,
                business_name: res?.business_name,
                technical_name: res?.technical_name,
                viewStatus: res?.status,
                datasource_id: res?.datasource_id,
                last_publish_time: res?.last_publish_time,
                // 关联接口
                asscoiateInterfaces,
            })
            setHasTimestamp(res.fields?.some((o) => o.business_timestamp))
            setDetailsData({ ...res, owner_id: baseResValue?.owner_id })
            // 屏蔽切换库表功能，指定详情数据为当前数据，后续放开需调整
            setFieldsTableData(res?.fields)
        } catch (err) {
            const { code } = err?.data ?? {}
            if (code === 'DataView.FormView.FormViewIdNotExist') {
                // setIsNotExistDatasheet(
                //     err?.data?.code === 'DataView.FormView.FormViewIdNotExist',
                // )
                onClose()
                return
            }

            setFieldsTableData([])

            formatError(err)
            onClose()
        } finally {
            setLoading(false)
        }
    }
    return (
        <Modal
            width="calc(100% - 48px)"
            open={visible}
            onCancel={onClose}
            bodyStyle={{
                padding: 0,
            }}
            style={{ top: 24, height: 'calc(100% - 24px)' }}
            title={
                <div className={styles.tableFormTitle}>
                    <div className={styles.formTitleLabel}>
                        <span
                            className={styles.formTitleText}
                            title={detailsData?.business_name || ''}
                        >
                            {detailsData?.business_name || ''}
                        </span>
                    </div>
                </div>
            }
            footer={null}
            wrapClassName={styles.formViewWrapper}
            {...props}
        >
            <div>
                <FieldList
                    fieldList={fieldsTableData}
                    currentData={detailsData}
                    isStart={isGradeOpen}
                    style={{
                        // margin: '0  0 24px 0',
                        margin: '0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100vh - 267px)',
                    }}
                    tableScroll={{
                        y: 'calc(100vh - 448px)',
                    }}
                    getContainer={document.getElementById('root')}
                    isMarket
                    hiddenFilters
                />
            </div>
        </Modal>
    )
}

export default FieldTableLogic
