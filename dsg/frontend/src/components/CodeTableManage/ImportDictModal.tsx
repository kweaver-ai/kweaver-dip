import React, { Key, useEffect, useRef, useState } from 'react'
import {
    Modal,
    Button,
    Upload,
    message,
    Space,
    Select,
    Form,
    Spin,
    TreeSelect,
} from 'antd'
import { DownOutlined } from '@ant-design/icons'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import axios, { CancelTokenSource } from 'axios'
import { XlsColored, DeleteColored } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'

import {
    CatalogType,
    exportDictTemplate,
    IDictItem,
    IDirItem,
    importDict,
    formatError,
    getDirDataBySearch,
    getDirDataByTypeOrId,
    IDirQueryType,
} from '@/core'
import { OperateType, streamToFile, validateEmpty } from '@/utils'
import EditDirModal from '../Directory/EditDirModal'
import { StdTreeDataOpt } from '../StandardDirTree/const'

interface IImportDictModal {
    visible: boolean
    selectedDir?: IDirItem
    update: (newSelectedDir?: IDirItem, newDictList?: Array<IDictItem>) => void
    onClose: () => void
}

/**
 * 表单上传
 * @param visible boolean 显示/隐藏
 * @param formType number 表单类型
 * @paramupdate: (newSelectedDir?: IDirItem) => void

 * @param onClose: () => void
 * @returns
 */
const ImportDictModal: React.FC<IImportDictModal> = ({
    visible,
    selectedDir,
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
    const [oprDirItem, setOprDirItem] = useState<IDirItem | undefined>(
        selectedDir,
    )

    // 自定义目录
    const [treeData, setTreeData] = useState<Array<IDirItem>>()

    const [catlgKeyword, setCatlgKeyword] = useState<string>('')
    const [selectLoading, setSelectLoading] = useState<boolean>(true)
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<Key[]>([])

    // 编辑目录对话框
    const [editDirVisible, setEditDirVisible] = useState(false)

    let source: CancelTokenSource | null = axios.CancelToken.source()

    useEffect(() => {
        if (visible) {
            // setOprDirItem(selectedDir)
            getDictTreeList()
        } else {
            form.resetFields()
        }
    }, [visible])

    // useEffect(() => {
    //     form.setFieldValue(
    //         'catalog_id',
    //         oprDirItem?.id
    //             ? {
    //                   label: oprDirItem.catalog_name,
    //                   value: oprDirItem.id,
    //               }
    //             : undefined,
    //     )
    // }, [oprDirItem])

    // 获取自定义目录
    const getDictTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
    ) => {
        try {
            setSelectLoading(true)
            let res

            if (query) {
                res = await getDirDataBySearch(query)
            } else {
                res = await getDirDataByTypeOrId(
                    CatalogType.CODETABLE,
                    undefined,
                )
            }
            const data = res.data ? res.data : []
            const newSelectedDir = selectedDir || data?.[0]
            setOprDirItem(selectedDir || data?.[0])
            form.setFieldValue('catalog_id', newSelectedDir?.id || undefined)
            setTreeData(data)
        } catch (error) {
            formatError(error)
        } finally {
            setSelectLoading(false)
        }
    }

    const onTreeExpand = (eks: Key[]) => {
        setTreeExpandedKeys(eks)
    }

    // 下载模版链接，请求导出接口，但不传参数即为导出空白模板
    const downloadTempFile = async () => {
        try {
            const res = await exportDictTemplate()
            if (typeof res === 'object' && res.byteLength) {
                streamToFile(res, `码表导入模板.xlsx`)
                message.success('模板下载成功')
            } else {
                message.error('模板下载失败')
            }
        } catch (error) {
            formatError(error)
        }
    }

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
    const handleDeleteFile = () => {
        setFileList([])
    }

    // 文件上传限制
    const uploadProps: UploadProps = {
        accept: '.xlsx',
        maxCount: 1,
        beforeUpload: (file: RcFile) => {
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                message.error('文件不可超过10MB')
                return false
            }
            const type = getFileExtension(file.name)
            if (type === 'xlsx') {
                setFileList([file])
            } else {
                message.error('文件格式错误，仅支持.xlsx')
            }
            return false
        },
        showUploadList: false,
    }

    // 获取文件后缀
    const getFileExtension = (filename: string) => {
        return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)![0] : undefined
    }

    // 上传onClick
    const handleUpload = async () => {
        const { catalog_id } = form.getFieldsValue()

        if (fileList.length < 1) {
            message.error('请上传文件')
            return
        }
        source?.cancel()
        const formData = new FormData()

        const reader = new FileReader()
        // 文件合法校验（被修改或删除则校验失败）
        let isFileValid = true

        const newFile = fileList?.[0] as RcFile
        reader.readAsDataURL(newFile)
        try {
            // 尝试读取文件一个字节
            await newFile?.slice(0, 1).arrayBuffer()
            // 提交前校验文件是否被修改或删除
            formData.append('file', newFile)
        } catch (error: any) {
            isFileValid = false
            setFileList([])
            message.warning(__('文件已失效，请重新上传'))
            return
        }

        setErrorText('')
        setUploading(true)
        source = axios.CancelToken.source()
        try {
            const res = await importDict(catalog_id, formData)
            message.success('导入成功')

            // if (typeof res === 'object' && res.byteLength) {
            //     streamToFile(
            //         res,
            //         `码表_导入失败_${moment(new Date()).format(
            //             'YYYYMMDDHHmmss',
            //         )}.xlsx`,
            //     )
            //     message.error('部分导入失败,详情查看下载的文件')
            // } else {
            //     message.success('导入成功')
            // }
            setFileList([])
            update(oprDirItem, res.data)
            onClose()
        } catch (error: any) {
            // if (error.status === 504) {
            //     message.error({
            //         content: '请求超时，请刷新后重试',
            //         duration: 5,
            //     })
            // } else if (error.status === 400) {
            //     const enc = new TextDecoder('utf-8')
            //     const uint8_msg = new Uint8Array(error.data)
            //     const data: any = JSON.parse(enc.decode(uint8_msg))
            //     message.error({ content: data.description, duration: 5 })
            // } else if (error?.data) {
            //     message.error({
            //         content: error?.data?.description
            //             ? error?.data?.description
            //             : '导入失败',
            //         duration: 5,
            //     })
            // } else {
            //     message.error({ content: '文件不存在请重新上传', duration: 5 })
            // }
            if (error.status === 504) {
                message.error({
                    content: '请求超时，请刷新后重试',
                    duration: 5,
                })
            } else if (error?.data) {
                message.error({
                    content: error?.data?.description
                        ? error?.data?.description
                        : '导入失败',
                    duration: 5,
                })
            } else {
                formatError(error)
            }
        } finally {
            setUploading(false)
        }
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

    return (
        <div className={styles.importWrapper}>
            <Modal
                open={visible}
                title={<span className={styles.modalTitle}>导入码表</span>}
                width={480}
                getContainer={false}
                maskClosable={false}
                destroyOnClose
                bodyStyle={{ padding: 0 }}
                onCancel={handleClose}
                footer={footer}
            >
                {/* <div className={styles.tipWrapper} hidden={!uploading}>
                    <div className={styles.uploading} hidden={!uploading}>
                        <ExclamationCircleFilled className={styles.uploadingIcon} />
                        <div className={styles.tipText}>文件正在上传，请耐心等待…</div>
                    </div>
                </div> */}
                <div className={styles.uploadBody}>
                    <Form
                        layout="vertical"
                        form={form}
                        autoComplete="off"
                        className={styles.importForm}
                    >
                        <Form.Item
                            label={__('选择目录')}
                            name="catalog_id"
                            required
                            validateFirst
                            rules={[
                                {
                                    validator: validateEmpty(
                                        __('请选择所属目录'),
                                    ),
                                },
                            ]}
                        >
                            <TreeSelect
                                treeData={treeData}
                                fieldNames={{
                                    value: 'id',
                                    label: 'catalog_name',
                                    children: 'children',
                                }}
                                className={styles.formsBase}
                                popupClassName={styles.selectTreeBox}
                                switcherIcon={<DownOutlined />}
                                style={{ width: '100%' }}
                                getPopupContainer={(n) => n}
                                showSearch
                                dropdownStyle={{
                                    maxHeight: 400,
                                    overflow: 'auto',
                                }}
                                onSearch={(value) => {
                                    setCatlgKeyword(value)
                                }}
                                treeNodeFilterProp="catalog_name"
                                placeholder={__('请选择所属自定义目录')}
                                notFoundContent={
                                    selectLoading ? (
                                        <Spin />
                                    ) : catlgKeyword ? (
                                        __('未找到匹配的结果')
                                    ) : (
                                        __('暂无数据')
                                    )
                                }
                                treeExpandedKeys={treeExpandedKeys}
                                onTreeExpand={onTreeExpand}
                            />
                        </Form.Item>
                    </Form>
                    {/* <div className={styles.selDirTitle}>选择目录</div> */}
                    {/* <Select
                        ref={dirRef}
                        placeholder="请选择所属目录"
                        labelInValue
                        className={styles.selDir}
                        value={
                            oprDirItem
                                ? {
                                      value: oprDirItem.id,
                                      label: oprDirItem.catalog_name,
                                  }
                                : undefined
                        }
                        open={false}
                        onFocus={() => {
                            setEditDirVisible(true)
                            dirRef?.current?.blur()
                        }}
                    /> */}
                    <div className={styles.uploadTitle}>上传文件</div>
                    <div className={styles.fileDesc}>
                        <div className={styles.fileOrder}>·</div>
                        上传的文件格式支持.xlsx，文件不得超过10MB
                    </div>
                    <div className={styles.fileDesc}>
                        <div className={styles.fileOrder}>·</div>
                        仅支持每次上传一个文件
                    </div>
                    <div className={styles.fileDesc}>
                        <div className={styles.fileOrder}>·</div>
                        <span
                            onClick={() => downloadTempFile()}
                            className={styles.primary}
                        >
                            下载模板
                        </span>
                    </div>
                    <Upload {...uploadProps}>
                        <Button type="primary" className={styles.uploadBtn}>
                            {/* <UploadOutlined className={styles.operateIcon} /> */}
                            <span className={styles.operateText}>上传文件</span>
                        </Button>
                    </Upload>

                    {fileList.length > 0 && (
                        <div className={styles.uploadedFile}>
                            {fileList.map((file) => (
                                <React.Fragment key={file.uid}>
                                    <div className={styles.fileInfo}>
                                        <XlsColored
                                            className={styles.xlsIcon}
                                        />
                                        <div
                                            className={`$"fileName" $"textSecondaryColor"`}
                                            title={file.name}
                                        >
                                            {file.name}
                                        </div>
                                    </div>
                                    <DeleteColored
                                        className={styles.deleteIcon}
                                        onClick={handleDeleteFile}
                                    />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
            {editDirVisible && (
                <EditDirModal
                    title="选择目录"
                    visible={editDirVisible}
                    dirType={CatalogType.CODETABLE}
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

export default ImportDictModal
