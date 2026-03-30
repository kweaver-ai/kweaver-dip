import React, { useContext, useEffect, useState } from 'react'
import { Modal, Button, Upload, message, Radio, Space } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import { UploadOutlined, XlsColored, DeleteColored } from '@/icons'
import styles from './styles.module.less'
import { TaskInfoContext } from '@/context'
import {
    FormTableKind,
    FormTableKindOptions,
    FormType,
    formTypeArr,
    RepeatOperate,
} from './const'
import { formsImport, formsUpdateImport } from '@/core'
import ImportPrompt from './ImportPrompt'
import { clearSource, getSource } from '@/utils/request'
import { getActualUrl } from '@/utils'
import __ from './locale'

interface IImportForm {
    visible: boolean
    formType: number
    mid: string
    node_id?: string
    flowchart_id?: string
    taskId?: string
    update: () => void
    onClose: () => void
    onlyShowTableKind?: FormTableKind
}

/**
 * 表单上传
 * @param formType number 表单类型
 * @param mid number 业务模型id
 * @param node_id 流程节点id
 * @param flowchart_id 流程图id
 * @param update: () => void
 * @param onClose: () => void
 * @returns
 */
const ImportForm: React.FC<IImportForm> = ({
    visible,
    formType,
    mid,
    node_id = '',
    flowchart_id = '',
    taskId = '',
    update = () => {},
    onClose = () => {},
    onlyShowTableKind,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    // 错误提示
    const [errorText, setErrorText] = useState('')
    // 上传中
    const [loading, setLoading] = useState(false)
    // 上传的文件
    const [fileList, setFileList] = useState<UploadFile[]>([])
    // 重名提示窗
    const [promptVis, setPromptVis] = useState(false)
    // 表单旧/新名称
    const [names, setNames] = useState<{ Key: string; Message: string }>()
    // 选项值
    const [selectValue, setSelectValue] = useState(RepeatOperate.RETAIN)
    // 类型
    const [tableKind, setTableKind] = useState<FormTableKind>(
        FormTableKind.BUSINESS,
    )

    useEffect(() => {
        if (onlyShowTableKind) {
            setTableKind(onlyShowTableKind)
        }
    }, [onlyShowTableKind])

    useEffect(() => {
        if (visible && mid) {
            setFileList([])
            setErrorText('')
            setNames(undefined)
            setPromptVis(false)
        }
    }, [visible])

    // 下载模版链接
    const downloadUrl = (): string => {
        switch (tableKind) {
            case FormTableKind.BUSINESS:
                // return '/downloadFiles/业务节点表模板.xlsx'
                return ''
            case FormTableKind.STANDARD:
                // return '/downloadFiles/业务标准表模板.xlsx'
                return ''
            default:
                return ''
        }
    }

    // 下载文件名
    const downloadName = (): string => {
        switch (formType) {
            case FormType.ORIGINAL:
                // return __('原始表模板.xlsx')
                return ''
            case FormType.STANDARD:
                // return __('业务表模板.xlsx')
                return ''
            case FormType.FUSION:
                // return __('融合表模板.xlsx')
                return ''
            default:
                return ''
        }
    }

    // 取消onClick
    const handleCancel = () => {
        const sor = getSource()
        if (sor.length > 0) {
            sor.forEach((info) => {
                if (info.config?.url?.includes('/forms/import')) {
                    info.source.cancel()
                }
            })
        }
        onClose()
        setFileList([])
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
            setErrorText('')
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                setErrorText(__('文件不可超过10MB'))
                return false
            }
            const type = getFileExtension(file.name)
            if (type && ['xlsx'].includes(type)) {
                setFileList([file])
            } else {
                setErrorText(__('文件格式错误，仅支持.xlsx'))
            }
            return false
        },
        showUploadList: false,
    }

    // 获取文件后缀
    const getFileExtension = (filename) => {
        return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)![0] : undefined
    }

    // 上传onClick
    const handleUpload = async (value?: string) => {
        if (fileList.length < 1) {
            setErrorText(__('请选择上传的文件'))
            return
        }
        const formData = new FormData()
        fileList.forEach((file) => {
            formData.append('table_kind', tableKind)
            if (value === RepeatOperate.RETAIN) {
                formData.append('name', names?.Message || '')
            }
            formData.append('type', String(formType))
            formData.append('file', file as RcFile)
            if (taskInfo.taskId || taskId) {
                formData.append('task_id', taskInfo.taskId || taskId)
            }
            if (flowchart_id) {
                formData.append('flowchart_id', flowchart_id)
            }
            if (node_id) {
                formData.append('node_id', node_id)
            }
        })
        setErrorText('')
        clearSource()
        setLoading(true)
        let request = formsImport
        if (value === RepeatOperate.COVER) {
            request = formsUpdateImport
        }
        request(mid, formData)
            .then((res) => {
                message.success(__('导入成功'))
                update()
                onClose()
                setFileList([])
            })
            .catch((err) => {
                if (err?.data) {
                    const { detail } = err.data
                    switch (err.data.code) {
                        case 'ERR_CANCELED':
                            break
                        case 'BusinessGrooming.Form.FormBusinessTableSingleDuplicateError':
                            if (detail.length > 0) {
                                setNames(detail[0])
                            }
                            setPromptVis(true)
                            setErrorText(__('已存在相同业务表名称'))
                            break
                        case 'BusinessGrooming.Form.InvalidParameter':
                            if (detail?.[0]?.key === 'Name') {
                                setErrorText(
                                    __(
                                        '业务表名称仅支持中英文、数字、下划线及中划线，最多输入128个字符',
                                    ),
                                )
                            } else {
                                setErrorText(err?.data?.description)
                            }
                            break
                        default:
                            setErrorText(err?.data?.description)
                            break
                    }
                } else {
                    setErrorText(__('文件不存在请重新上传'))
                }
            })
            .finally(() => {
                setLoading(false)
            })
    }

    // 重名提示处理
    const handlePromptClose = (value) => {
        setPromptVis(false)
        switch (value) {
            case RepeatOperate.CANCEL:
                onClose()
                setFileList([])
                break
            default:
                handleUpload(value)
                break
        }
    }

    return (
        <div className={styles.importWrapper}>
            <Modal
                open={visible}
                title={
                    <span className={styles.modalTitle}>
                        {__('导入')}
                        {`${formTypeArr[formType].value}`}
                    </span>
                }
                width={480}
                getContainer={false}
                maskClosable={false}
                destroyOnClose
                bodyStyle={{
                    padding: 0,
                    maxHeight: 484,
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onCancel={() => handleCancel()}
                onOk={() => {
                    if (promptVis) {
                        setPromptVis(false)
                        handleUpload(selectValue)
                        return
                    }
                    handleUpload()
                }}
                okButtonProps={{
                    loading,
                }}
            >
                <div
                    className={styles.tipWrapper}
                    hidden={errorText === '' && !loading}
                >
                    <div className={styles.error} hidden={errorText === ''}>
                        <ExclamationCircleFilled className={styles.errorIcon} />
                        <div className={styles.tipText}>{errorText}</div>
                    </div>
                    <div className={styles.uploading} hidden={!loading}>
                        <ExclamationCircleFilled
                            className={styles.uploadingIcon}
                        />
                        <div className={styles.tipText}>
                            {__('文件正在上传，请耐心等待…')}
                        </div>
                    </div>
                </div>
                {promptVis ? (
                    <div className={styles.repeatBody}>
                        <div
                            className={styles.text}
                            style={{ marginBottom: 16 }}
                        >
                            {`您可以将当前业务表“${names?.Key}”做如下处理`}
                            {__('：')}
                        </div>
                        <Radio.Group
                            onChange={(e) => setSelectValue(e.target.value)}
                            value={selectValue}
                        >
                            <Space direction="vertical" size={12}>
                                <Radio
                                    value={RepeatOperate.RETAIN}
                                    className={styles.text}
                                >
                                    {__(
                                        '同时保留两个业务表，当前业务表名称重命名为',
                                    )}
                                    {`“${names?.Message}”`}
                                </Radio>
                                <Radio
                                    value={RepeatOperate.COVER}
                                    className={styles.text}
                                >
                                    {__(
                                        '上传并替换，使用当前业务表覆盖同名业务表',
                                    )}
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                ) : (
                    <div className={styles.uploadBody}>
                        <div className={styles.tableKind}>
                            <span>{__('类型：')}</span>
                            <Radio.Group
                                options={FormTableKindOptions.filter(
                                    (item) =>
                                        item.value === FormTableKind.BUSINESS ||
                                        (!node_id &&
                                            item.value ===
                                                FormTableKind.STANDARD),
                                )}
                                value={tableKind}
                                onChange={(e) => setTableKind(e.target.value)}
                            />
                        </div>
                        <div className={styles.uploadTitle}>
                            {__('上传文件')}
                        </div>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            {__('上传的文件格式支持.xlsx，文件不得超过10MB')}
                        </div>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            {__('仅支持每次上传一个文件')}
                        </div>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            <a
                                href={getActualUrl(downloadUrl(), false)}
                                target="_blank"
                                download={downloadName()}
                                className={styles.primary}
                                rel="noreferrer"
                            >
                                {__('下载模板')}
                            </a>
                        </div>
                        <Upload {...uploadProps}>
                            <Button type="primary" className={styles.uploadBtn}>
                                {/* <UploadOutlined
                                    className={styles.operateIcon}
                                /> */}
                                <span className={styles.operateText}>
                                    {__('上传文件')}
                                </span>
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
                                                className={`${styles.fileName} ${styles.textSecondaryColor}`}
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
                )}
            </Modal>

            {/* <ImportPrompt
                    visible={visible}
                    title={
                        <span className={styles.modalTitle}>
                            {__('导入')}
                            {`${formTypeArr[formType].value}`}
                        </span>
                    }
                    formType={formType}
                    names={names}
                    onClose={handlePromptClose}
                /> */}
        </div>
    )
}

export default ImportForm
