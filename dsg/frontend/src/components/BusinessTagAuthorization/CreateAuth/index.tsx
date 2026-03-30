import React, { useEffect, useState } from 'react'
import { Form, message, Drawer, Button } from 'antd'
import styles from './styles.module.less'
import {
    formatError,
    tagAuthBatchCreate,
    AssetTypeEnum,
    getTagAuthList,
} from '@/core'
import __ from '../locale'
import VisitorCard from '@/components/AccessPolicy/components/VisitorCard'
import { VisitorProvider } from '@/components/AccessPolicy/components/VisitorProvider'

interface ICreateAuth {
    visible: boolean
    onClose: (flag?: boolean) => void
    selectedTagClassify?: any
}

/**
 * 创建/编辑 类目
 */
const CreateAuth: React.FC<ICreateAuth> = ({
    visible,
    onClose,
    selectedTagClassify,
}) => {
    const [loading, setLoading] = useState(false)
    const [visitors, setVisitors] = useState<any>([])
    const [errorMsg, setErrorMsg] = useState<string>('')

    useEffect(() => {
        if (visitors?.length) {
            setErrorMsg('')
        }
    }, [visitors])

    // useEffect(() => {
    //     if (selectedTagClassify?.id) {
    //         getTagAuthAppList()
    //     }
    // }, [selectedTagClassify?.id])

    // 对话框onCancel
    const handleCancel = () => {
        onClose()
    }

    // // 获取列表
    // const getTagAuthAppList = async () => {
    //     try {
    //         const res: any = await getTagAuthList({
    //             id: selectedTagClassify.id,
    //             offset: 1,
    //             limit: 100,
    //         })
    //         setVisitors(
    //             res?.entries?.map((info) => ({
    //                 name: info.name,
    //                 subject_name: info.name,
    //                 id: info.id,
    //                 subject_id: info.subject_id,
    //                 intelligentTag: info.type === 1,
    //                 subject_type: 'app',
    //             })) || [],
    //         )
    //     } catch (error) {
    //         formatError(error)
    //     }
    // }

    // 对话框onOk
    const handleModalOk = async () => {
        try {
            if (!visitors?.length) {
                setErrorMsg(__('请选择授权应用'))
                return
            }
            setLoading(true)
            const category_apps_list = visitors.map((info) => ({
                apps_id: info.subject_id,
                id: selectedTagClassify.id,
                type: info?.intelligentTag ? 1 : 0,
            }))
            await tagAuthBatchCreate({ category_apps_list })
            message.success(__('添加成功'))
            onClose(true)
            setErrorMsg('')
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <VisitorProvider>
            <Drawer
                title={__('添加授权应用')}
                width={640}
                maskClosable={false}
                open={visible}
                onClose={handleCancel}
                destroyOnClose
                bodyStyle={{ padding: '0' }}
                className={styles['create-tag']}
                footer={null}
            >
                <div className={styles['create-body']}>
                    <div className={styles['create-tag']}>
                        {selectedTagClassify?.name}
                    </div>
                    <div className={styles['create-label']}>
                        <div className={styles['create-label-icon']}>*</div>
                        <div className={styles['create-label-text']}>
                            {__('授权应用')}
                        </div>
                        <div className={styles['create-label-desc']}>
                            {__('（被授权的集成应用可以调用当前标签）')}
                        </div>
                    </div>
                    <div className={styles['create-card']}>
                        <VisitorCard
                            value={visitors}
                            type={AssetTypeEnum.Api}
                            onChange={setVisitors}
                            tagMode
                            buttonText={__('选择应用')}
                            modalTitle={__('添加应用')}
                        />
                    </div>
                    {errorMsg && (
                        <div className={styles.errorTips}>{errorMsg}</div>
                    )}
                </div>
                <div className={styles.footer}>
                    <div className={styles.footerTips}>
                        {__(
                            '提示：当前已开启审核，审核通过后方才更新标签的授权信息。',
                        )}
                    </div>
                    <div>
                        <Button
                            onClick={handleCancel}
                            style={{ marginRight: '8px' }}
                        >
                            {__('取消')}
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            onClick={() => handleModalOk()}
                        >
                            {__('确定')}
                        </Button>
                    </div>
                </div>
            </Drawer>
        </VisitorProvider>
    )
}

export default CreateAuth
