import { FC, useEffect, useState } from 'react'
import { InfoCircleFilled } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import DatasourceTree from '../DatasheetView/DatasourceTree'
import { allNodeInfo, DatasourceTreeNode, DsType } from '../DatasheetView/const'
import { RescCatlgType } from '../ResourcesDir/const'
import {
    createDataForm,
    formatError,
    formsCreate,
    getDataViewDatasouces,
} from '@/core'
import { Loader } from '@/ui'
import DataViewList from './DataViewList'
import DataViewItem from './DataViewItem'
import { FormTableKind, NewFormType } from './const'
import { DataSourceOrigin } from '../DataSource/helper'
import CatlgInfoChooseDrawer from './CatlgInfoChooseDrawer'

interface CreateDataOriginFormProps {
    visible: boolean
    onClose: () => void
    onConfirm: () => void
    mid: string
}
const CreateDataOriginForm: FC<CreateDataOriginFormProps> = ({
    visible,
    onClose,
    onConfirm,
    mid,
}) => {
    const [dataType, setDataType] = useState<DsType>(DsType.all)
    const [selectedNode, setSelectedNode] = useState<DatasourceTreeNode>({
        name: '全部',
        id: '',
    })
    const [datasourceData, setDatasourceData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const [selectedDataViews, setSelectedDataViews] = useState<Array<any>>([])

    // useEffect(() => {
    //     getDatasourceData()
    // }, [])

    const handleConfirmForm = async (
        addItems: any[],
        delItems: any[],
        checkedItems: any[],
    ) => {
        try {
            // 发送请求

            await createDataForm({
                mid,
                view_id: addItems.map((item) => item.id),
            })
            onConfirm()
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 获取数据源
     */
    // const getDatasourceData = async () => {
    //     try {
    //         const res = await getDataViewDatasouces({
    //             limit: 1000,
    //             direction: 'desc',
    //             sort: 'updated_at',
    //             source_types: `${DataSourceOrigin.INFOSYS},${DataSourceOrigin.DATAWAREHOUSE}`,
    //         })
    //         const list = res?.entries || []
    //         setDatasourceData(list)
    //     } catch (err) {
    //         formatError(err)
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    // 获取选中的节点
    // const getSelectedNode = (sn?: DatasourceTreeNode, type?: RescCatlgType) => {
    //     const snType =
    //         sn?.id === ''
    //             ? DsType.all
    //             : sn?.id === sn?.type
    //             ? DsType.datasourceType
    //             : DsType.datasource
    //     setDataType(snType)

    //     setSelectedNode(sn || allNodeInfo)
    //     const data = !sn?.id
    //         ? datasourceData
    //         : sn?.id === sn?.type
    //         ? datasourceData?.filter((item) => item.type === sn?.type)
    //         : datasourceData?.filter((item) => item.id === sn?.id)
    // }
    // return (
    //     <Modal
    //         title={__('新建数据原始表')}
    //         width={800}
    //         onCancel={onClose}
    //         footer={
    //             <Space size={8}>
    //                 <Button onClick={onClose}>{__('取消')}</Button>
    //                 <Button onClick={handleConfirmForm} type="primary">
    //                     {__('确认生成')}
    //                 </Button>
    //             </Space>
    //         }
    //         open={visible}
    //     >
    //         <div className={styles.originFormContainer}>
    //             <div className={styles.title}>
    //                 {__('请选择库表，确认后将生成数据原始表')}
    //             </div>
    //             <div className={styles.contentWrapper}>
    //                 <div className={styles.fistItem}>
    //                     <div className={styles.itemTitle}>{__('数据源')}</div>
    //                     <div>
    //                         {isLoading ? (
    //                             <div className={styles.indexEmptyBox}>
    //                                 <Loader />
    //                             </div>
    //                         ) : (
    //                             <DatasourceTree
    //                                 getSelectedNode={getSelectedNode}
    //                                 datasourceData={datasourceData}
    //                             />
    //                         )}
    //                     </div>
    //                 </div>
    //                 <div className={styles.spiltLine} />
    //                 <div className={styles.secondItem}>
    //                     <div className={styles.itemTitle}>{__('库表')}</div>
    //                     <div>
    //                         <DataViewList
    //                             selectedNode={selectedNode}
    //                             selectedDataViews={selectedDataViews}
    //                             onChange={(info, isSelected) => {
    //                                 if (isSelected) {
    //                                     setSelectedDataViews([
    //                                         ...selectedDataViews,
    //                                         info,
    //                                     ])
    //                                 } else {
    //                                     setSelectedDataViews(
    //                                         selectedDataViews.filter(
    //                                             (item) => item.id !== info.id,
    //                                         ),
    //                                     )
    //                                 }
    //                             }}
    //                             mid={mid}
    //                         />
    //                     </div>
    //                 </div>
    //                 <div className={styles.spiltLine} />
    //                 <div className={styles.lastItem}>
    //                     <div className={styles.titleBar}>
    //                         <div>
    //                             {__('已选择：${count}个', {
    //                                 count: selectedDataViews?.length || '0',
    //                             })}
    //                         </div>
    //                         <div>
    //                             <Button
    //                                 type="link"
    //                                 onClick={() => {
    //                                     setSelectedDataViews([])
    //                                 }}
    //                             >
    //                                 {__('全部移除')}
    //                             </Button>
    //                         </div>
    //                     </div>
    //                     <div className={styles.listWrapper}>
    //                         {selectedDataViews.map((item) => {
    //                             return (
    //                                 <DataViewItem
    //                                     nodeInfo={item}
    //                                     showDelete
    //                                     onDelete={(id) => {
    //                                         setSelectedDataViews(
    //                                             selectedDataViews.filter(
    //                                                 (it) => it.id !== item.id,
    //                                             ),
    //                                         )
    //                                     }}
    //                                 />
    //                             )
    //                         })}
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     </Modal>
    // )
    return (
        <CatlgInfoChooseDrawer
            open={visible}
            onClose={onClose}
            onSure={handleConfirmForm}
            selDataItems={selectedDataViews}
            mode="single"
            selectType="catlg"
            title={__('新建数据原始表')}
            catlgParams={{
                online_status: 'online',
            }}
            footerTitle={
                <div className={styles.footerTitle}>
                    <InfoCircleFilled className={styles.infoIcon} />
                    {__('选择数据资源目录，确认后生成数据原始表。')}
                </div>
            }
        />
    )
}

export default CreateDataOriginForm
