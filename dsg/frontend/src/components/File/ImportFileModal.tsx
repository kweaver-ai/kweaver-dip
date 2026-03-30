import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Upload, message, Space, Select, Form } from 'antd'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import axios, { CancelTokenSource } from 'axios'
import { DeleteColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'

import {
    AttachmentType,
    CatalogType,
    formatError,
    IDirItem,
    importFile,
} from '@/core'
import {
    getFileExtension,
    OperateType,
    stardOrignizeTypeList,
    validateEmpty,
} from '@/utils'
import EditDirModal from '../Directory/EditDirModal'
import { FileIconType, supportFileTypeList } from './helper'
import FileIcon from './FileIcon'

interface IImportFileModal {
    visible: boolean
    selectedDir: IDirItem
    setSelectedDir: (item: IDirItem) => void
    update: (newSelectedDir?: IDirItem) => void
    onClose: () => void
}

/**
 * 表单上传
 * @param visible boolean 显示/隐藏
 * @param formType number 表单类型
 * @param update: (newSelectedDir?: IDirItem) => void
 * @param onClose: () => void
 * @returns
 */
const ImportFileModal: React.FC<IImportFileModal> = ({
    visible,
    selectedDir,
    setSelectedDir,
    update,
    onClose = () => {},
}) => {
    const [form] = Form.useForm()

    // 错误提示
    const [errorText, setErrorText] = useState('')

    // 上传中
    const [uploading, setUploading] = useState(false)

    // 上传的文件
    const [fileList, setFileList] = useState<UploadFile[]>([])

    const dirRef: any = useRef(null)

    // 导入目录
    const [oprDirItem, setOprDirItem] = useState<IDirItem>(selectedDir)

    // 编辑目录对话框
    const [editDirVisible, setEditDirVisible] = useState(false)

    let source: CancelTokenSource | null = axios.CancelToken.source()

    useEffect(() => {
        if (visible) {
            setOprDirItem(selectedDir)
        }
    }, [visible])

    useEffect(() => {
        form.setFieldValue('catalog_id', {
            label: oprDirItem.catalog_name,
            value: oprDirItem.id,
        })
    }, [oprDirItem])

    // 取消onClick
    const handleCancel = () => {
        source?.cancel()
        handleClose()
    }

    // 关闭onClick
    const handleClose = () => {
        source = null
        setErrorText('')
        setFileList([])
        onClose()
    }

    // 清除onClick
    const handleDeleteFile = (fileItem: any) => {
        const fileListNew = fileList.filter((fItem: any) => {
            return fItem.uid !== fileItem.uid
        })
        setFileList(fileListNew)
    }

    // 文件上传限制
    const uploadProps: UploadProps = {
        accept: supportFileTypeList.map((t: string) => `.${t}`).join(','),
        fileList,
        maxCount: 30,
        beforeUpload: (file: RcFile) => {
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                message.error('文件不可超过10MB')
                return false
            }
            const type = (getFileExtension(file.name) as FileIconType) || ''
            if (supportFileTypeList.includes(type)) {
                const newFileList = fileList || []
                newFileList.push(file)
                setFileList(newFileList)
                // setFileList([...newFileList, file])
            } else {
                message.error(
                    '上传的文件格式支持.pdf  .doc  .docx；大小不超过10M',
                )
            }
            // if (!supportFileTypeList.includes(type)) {
            //     message.error(
            //         '上传的文件格式支持.pdf  .doc  .docx；大小不超过10M',
            //     )
            // }
            return false
        },
        // eslint-disable-next-line react/no-unstable-nested-components
        itemRender: (_node: any, fileItem) => {
            return (
                <div key={fileItem.uid} className={styles.fileInfoWrapper}>
                    <div className={styles.fileInfo}>
                        <FileIcon type={getFileExtension(fileItem.name)} />
                        <div className={styles.fileName} title={fileItem.name}>
                            {fileItem.name}
                        </div>
                    </div>
                    <DeleteColored
                        className={styles.deleteIcon}
                        onClick={() => handleDeleteFile(fileItem)}
                    />
                </div>
            )
        },
        showUploadList: {
            showDownloadIcon: false,
            showRemoveIcon: true,
        },
        multiple: true,
    }

    // 上传onClick
    const handleUpload = async () => {
        await form.validateFields()

        const { catalog_id, std_type } = form.getFieldsValue()

        if (fileList?.length < 1) {
            message.error('请上传文件')
            return
        }
        source?.cancel()

        setErrorText('')
        source = axios.CancelToken.source()

        setUploading(true)
        const newFileList = fileList?.map(async (fItem: any) => {
            const importItem = { ...fItem }
            const fileData = new FormData()
            fileData.append('file', fItem as RcFile)

            const fileName = fItem.name?.split('.').slice(0, -1).join('.') || ''
            // 文件名称
            const name =
                fileName.split('_')?.length > 1
                    ? fileName.split('_').slice(1).join('_')
                    : fileName
            // 文件编号
            const number =
                fileName.split('_')?.length > 1 ? fileName.split('_')[0] : ''
            await importFile(
                {
                    catalog_id: catalog_id.value ? catalog_id.value : '',
                    number,
                    name,
                    org_type: std_type,
                    attachment_type: AttachmentType.FILE,
                },
                fileData,
            )
                .then(() => {
                    message.success('导入成功')
                    Object.assign(importItem, {
                        ...importItem,
                        status: 'sucess',
                    })
                })
                .catch((error) => {
                    if (error.status === 400) {
                        // 消息队列异常，特殊处理
                        if (
                            error.data &&
                            error.data.code &&
                            error.data.code === 'Standardization.Incorrect'
                        ) {
                            message.error(error.data.description)
                            return
                        }
                        const details = error.data.detail
                        if (details?.length) {
                            details.forEach((dItem: any) => {
                                message.error(dItem.Message)
                            })
                            return
                        }
                    }
                    formatError(error)
                    Object.assign(importItem, {
                        ...importItem,
                        status: 'error',
                    })
                })

            return importItem
        })

        // // 导入成功后关闭对话框后设置被选中目录为导入目录，更新列表
        update(oprDirItem)
        // onClose()
        setUploading(false)
    }

    const onEditClose = () => {
        setEditDirVisible(false)
    }

    const footer = (
        <div className={styles.footerWrapper}>
            <Space>
                <Button className={styles.cancelBtn} onClick={handleCancel}>
                    取消
                </Button>
                <Button
                    className={styles.okBtn}
                    type="primary"
                    htmlType="submit"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    确定
                </Button>
            </Space>
        </div>
    )

    const stdTypeList = stardOrignizeTypeList.slice(1)

    return (
        <div className={styles.importWrapper}>
            <Modal
                open={visible}
                title={
                    <span className={styles.modalTitle}>
                        {__('批量添加标准文件')}
                    </span>
                }
                width={640}
                getContainer={false}
                maskClosable={false}
                destroyOnClose
                bodyStyle={{ padding: 0 }}
                onCancel={handleClose}
                footer={footer}
            >
                <div className={styles.uploadBody}>
                    <Form
                        layout="vertical"
                        form={form}
                        autoComplete="off"
                        // onFinish={onFinish}
                    >
                        <Form.Item
                            label={__('所属标准文件目录')}
                            name="catalog_id"
                            required
                        >
                            <Select
                                ref={dirRef}
                                labelInValue
                                className={styles.formsBase}
                                open={false}
                                onFocus={() => {
                                    setEditDirVisible(true)
                                    dirRef?.current?.blur()
                                }}
                                placeholder={__('请选择所属标准文件目录')}
                            />
                        </Form.Item>
                        <Form.Item
                            label={__('标准分类')}
                            name="std_type"
                            required
                            validateFirst
                            rules={[
                                {
                                    validator: validateEmpty(
                                        __('请选择标准分类'),
                                    ),
                                },
                            ]}
                        >
                            <Select
                                className={styles.formsBase}
                                placeholder="请选择"
                                options={stdTypeList}
                                getPopupContainer={(node) => node.parentNode}
                            />
                        </Form.Item>
                    </Form>
                    <div className={styles.uploadTitle}>上传文件</div>
                    <div className={styles.fileUploadWrapper}>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            上传的文件格式支持.pdf .doc .docx，文件不得超过10MB
                        </div>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            每次可上传多个文件
                        </div>
                        <Upload {...uploadProps} className={styles.fileUpload}>
                            <Button type="primary" className={styles.uploadBtn}>
                                <span className={styles.operateText}>
                                    上传文件
                                </span>
                            </Button>

                            <div
                                className={styles.uploadFileInfoWrapper}
                                hidden={!fileList?.length}
                            >
                                <div className={styles.addedFileInfo}>
                                    {__('已添加${count}个文件', {
                                        count: fileList?.length,
                                    })}
                                </div>
                                <div
                                    className={styles.clearAll}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFileList([])
                                    }}
                                >
                                    {__('一键清空')}
                                </div>
                            </div>
                        </Upload>
                    </div>
                </div>
            </Modal>
            {oprDirItem && (
                <EditDirModal
                    title="选择目录"
                    visible={editDirVisible}
                    dirType={CatalogType.FILE}
                    onClose={onEditClose}
                    oprType={OperateType.SELECT}
                    oprItem={oprDirItem}
                    setOprItem={setOprDirItem}
                    afterOprReload={() => {}}
                />
            )}
        </div>
    )
}

export default ImportFileModal
