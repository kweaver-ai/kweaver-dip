import React, {
    memo,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Modal, Button, Upload, message, List } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useGetState, useSize } from 'ahooks'
import { UploadOutlined, XlsColored, DeleteColored } from '@/icons'
import styles from './styles.module.less'
import { TaskInfoContext } from '@/context'
import __ from './locale'
import { getFileExtension } from '@/utils'
import { clearSource, getSource } from '@/utils/request'
import { flowchartImport } from '@/core'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import { FlowChooseItem, noticeDrawioImportFile } from './helper'
import FlowchartIconOutlined from '@/icons/FlowchartOutlined'
import DrawioColored from '@/icons/DrawioColored'
import VsdxColored from '@/icons/VsdxColored'

interface IImportFlow {
    visible: boolean
    mid: string
    node_id?: string
    node_name?: string
    flowchart_id?: string
    taskId?: string
    onSure: () => void
    onClose: () => void
    iframeRef?: any
}

/**
 * 流程图导入
 * @param visible 导入弹窗是否展示
 * @param mid 模型id
 * @param node_id 节点id
 * @param node_name 节点名称
 * @param flowchart_id 流程图id
 * @param taskId 任务id
 * @param onSure 成功
 * @param onClose 弹窗关闭回调
 */
const ImportFlow: React.FC<IImportFlow> = ({
    visible,
    mid,
    node_id = '',
    node_name = '',
    flowchart_id = '',
    taskId = '',
    onSure = () => {},
    onClose = () => {},
    iframeRef,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)

    // 流程图相关信息
    const { drawioInfo } = useContext(DrawioInfoContext)
    // 流程图存储所有信息
    const [df, setDf, getDf] = useGetState<any>()
    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])

    const [modelId, setModelId, getModelId] = useGetState(mid)
    // 错误信息
    const [errorText, setErrorText] = useState('')
    // load
    const [uploading, setUploading] = useState(false)
    // 文件列表
    const [fileList, setFileList, getFileList] = useGetState<UploadFile[]>([])
    // 分页集 {name, id}
    const [pages, setPages] = useState<any[]>([])
    // 选中值id
    const [selected, setSelected] = useState<any>()
    // 上传文件xml内容
    const [xmlContent, setXmlContent, getXmlContent] = useGetState<string>()

    const errRef = useRef<HTMLDivElement>(null)
    const errSize = useSize(errRef)

    useEffect(() => {
        if (visible && mid) {
            setFileList([])
            setErrorText('')
            setPages([])
            setSelected(undefined)
            setUploading(false)
            setModelId(mid)
        }
    }, [visible])

    useEffect(() => {
        // drawio的消息处理
        const handleMessage = (e) => {
            try {
                if (typeof e?.data === 'string') {
                    const data = JSON.parse(e?.data)
                    const { event } = data
                    switch (event) {
                        case 'af_fileXmlContent':
                            fileXmlContent(data)
                            break
                        case 'af_flowAnalysisError':
                            setUploading(false)
                            setErrorText(__('文件解析错误，请重新上传'))
                            break
                        default:
                            break
                    }
                }
            } catch (error) {
                // console.log('index-error ', error)
            }
        }
        if (visible) {
            window.addEventListener('message', handleMessage, false)
        } else {
            window.removeEventListener('message', handleMessage, false)
        }
        return () => {
            window.removeEventListener('message', handleMessage, false)
        }
    }, [visible])

    // 解析导入文件的xml
    const fileXmlContent = (data) => {
        const { content } = data
        setXmlContent(content || '')
        const xmlDoc = new DOMParser().parseFromString(content, 'text/xml')
        const nodes = xmlDoc.getElementsByTagName('diagram')
        // 区分当前分页数
        if (nodes.length === 1) {
            // 单页直接上传
            handleUpload(true)
        } else {
            setUploading(false)
            // 列举分页名称
            const infoArr: any[] = []
            for (let i = 0; i < nodes.length; i += 1) {
                infoArr.push({
                    name: nodes[i].getAttribute('name') || '',
                    id: nodes[i].getAttribute('id') || '',
                })
            }
            setPages(infoArr)
        }
    }

    // 文件上传配置
    const uploadProps: UploadProps = {
        accept: '.vsdx,.drawio',
        beforeUpload: (file: RcFile) => {
            setErrorText('')
            const limit = file.size / 1024 / 1024
            if (limit > 10) {
                setErrorText(__('文件不可超过10MB'))
                return false
            }
            const type = getFileExtension(file.name)
            if (type && ['vsdx', 'drawio'].includes(type)) {
                setFileList([file])
            } else {
                setErrorText(__('文件格式错误，仅支持.vsdx 和.drawio'))
            }
            return false
        },
        showUploadList: false,
    }

    // 取消上传
    const handleCancel = () => {
        const sor = getSource()
        if (sor.length > 0) {
            sor[0].source.cancel(__('取消'))
        }
        onClose()
        setFileList([])
    }

    // 取消选中文件
    const handleDeleteFile = () => {
        setFileList([])
    }

    // 上传文件解析
    const handleUpload = async (onlyOne = false) => {
        if (!onlyOne && pages.length === 0) {
            // 无选择
            if (fileList.length < 1) {
                setErrorText(__('请选择上传的文件'))
                return
            }
            setErrorText('')
            // 开始解析文件内容
            setUploading(true)
            const uploadFile = fileList[0]
            const res = await noticeDrawioImportFile(
                uploadFile,
                iframeRef || getDf().iframe,
            )
            if (res) {
                fileXmlContent({ content: res })
            }
            return
        }

        const uploadFile = getFileList()[0]
        let fileName = uploadFile.name

        // 无选择
        if (!onlyOne && !selected) {
            setErrorText(__('请选择上传的业务流程'))
            return
        }

        // 更换文件名
        if (onlyOne) {
            const dot = fileName.lastIndexOf('.')
            if (dot >= 0) {
                fileName = `${fileName.substring(
                    0,
                    fileName.lastIndexOf('.'),
                )}.drawio`
            } else {
                fileName += '.drawio'
            }
        } else {
            fileName = `${pages.find((p) => p.id === selected).name}.drawio`
        }

        setUploading(true)

        // 单页上传
        if (onlyOne) {
            uploadReq(uploadFile, uploadFile.name)
            // const blob = new Blob([xmlContent || ''])
            // uploadReq(new File([blob], fileName), fileName)
            return
        }

        // 多页筛选上传
        // 确定要上传的流程图内容
        const xmlSerialize = new XMLSerializer()
        const xmlDoc = new DOMParser().parseFromString(
            xmlContent || '',
            'text/xml',
        )
        // 筛选流程图
        const nodes = xmlDoc.getElementsByTagName('diagram')
        let selectedNode
        for (let i = 0; i < nodes.length; i += 1) {
            if (selected === nodes[i].getAttribute('id')) {
                selectedNode = nodes[i]
            }
        }
        // 组装文件内容
        const xmlInfo = `<?xml version="1.0" encoding="UTF-8"?>
            <mxfile host="app.diagrams.net" type="device">
            ${xmlSerialize.serializeToString(selectedNode)}
            </mxfile>`
        const blob = new Blob([xmlInfo || ''])
        uploadReq(new File([blob], fileName), fileName)
    }

    // 向后端上传文件
    const uploadReq = async (fileData, fileName) => {
        const formData = new FormData()
        getFileList().forEach((file) => {
            formData.append('file', fileData as RcFile)
            if (taskInfo?.taskId || taskId) {
                formData.append('task_id', taskInfo?.taskId || taskId)
            }
            if (flowchart_id) {
                formData.append('fid', flowchart_id)
            }
            if (node_id) {
                formData.append('node_id', node_id)
            }
            if (node_name) {
                formData.append('node_name', node_name)
            }
        })
        setErrorText('')
        clearSource()
        flowchartImport(getModelId(), formData)
            .then((res) => {
                message.success(__('导入成功'))
                onClose()
                onSure()
                setFileList([])
            })
            .catch((err) => {
                if (err?.data) {
                    const { detail } = err.data
                    switch (err.data.code) {
                        case 'ERR_CANCELED':
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
                setUploading(false)
            })
    }

    return (
        <Modal
            open={visible}
            title={__('导入流程图')}
            width={480}
            getContainer={false}
            maskClosable={false}
            destroyOnClose
            bodyStyle={{
                padding: 0,
                minHeight: 209,
                maxHeight: 444,
                overflow: 'overlay',
            }}
            onOk={() => handleUpload()}
            onCancel={() => handleCancel()}
            okButtonProps={{
                loading: uploading,
            }}
        >
            <div className={styles.importFlowWrapper}>
                <div
                    className={styles.tipWrapper}
                    hidden={errorText === '' && !uploading}
                    ref={errRef}
                >
                    <div className={styles.error} hidden={errorText === ''}>
                        <ExclamationCircleFilled className={styles.errorIcon} />
                        <div className={styles.tipText}>{errorText}</div>
                    </div>
                    <div className={styles.uploading} hidden={!uploading}>
                        <ExclamationCircleFilled
                            className={styles.uploadingIcon}
                        />
                        <div className={styles.tipText}>
                            {__('文件正在上传，请耐心等待…')}
                        </div>
                    </div>
                </div>
                <div
                    className={styles.if_uploadcontentWrapper}
                    hidden={pages.length > 0}
                >
                    <div className={styles.uploadBody}>
                        <div className={styles.uploadTitle}>
                            {__('上传文件')}
                        </div>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            {__(
                                '上传的文件格式支持.vsdx 和.drawio，文件不得超过10MB',
                            )}
                        </div>
                        <div className={styles.fileDesc}>
                            <div className={styles.fileOrder}>·</div>
                            {__('仅支持每次上传一个文件')}
                        </div>
                        <Upload {...uploadProps}>
                            <Button type="primary" className={styles.uploadBtn}>
                                {/* <UploadOutlined className={styles.uploadIcon} /> */}
                                {__('上传文件')}
                            </Button>
                        </Upload>

                        {fileList.length > 0 && (
                            <div className={styles.uploadedFile}>
                                {fileList.map((file) => (
                                    <React.Fragment key={file.uid}>
                                        <div className={styles.fileInfo}>
                                            {getFileExtension(
                                                fileList[0].name,
                                            ) === 'drawio' ? (
                                                <DrawioColored
                                                    className={styles.xlsIcon}
                                                />
                                            ) : (
                                                <VsdxColored
                                                    className={styles.xlsIcon}
                                                />
                                            )}
                                            <div
                                                className={styles.fileName}
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
                </div>
                <div
                    className={styles.if_selectedcontentWrapper}
                    hidden={pages.length === 0}
                >
                    <div className={styles.if_selectedTitle}>
                        {__('当前业务流程中包含')}
                        <span style={{ color: '#126ee3', margin: '0 4px' }}>
                            {pages.length}
                            {__('个')}
                        </span>
                        {__('业务流程，请您选择一个上传：')}
                    </div>
                    <List
                        className={styles.if_list}
                        style={{
                            maxHeight:
                                errorText === ''
                                    ? 390
                                    : 444 - (errSize?.height || 32) - 54,
                        }}
                        split={false}
                        dataSource={pages}
                        renderItem={(item) => (
                            <List.Item>
                                <FlowChooseItem
                                    data={item}
                                    icon={
                                        <FlowchartIconOutlined
                                            className={styles.fci_icon}
                                        />
                                    }
                                    small
                                    checked={selected === item?.id}
                                    onChecked={() => setSelected(item?.id)}
                                    style={{
                                        backgroundColor:
                                            selected === item?.id
                                                ? 'rgba(18, 110, 227, 0.06)'
                                                : undefined,
                                        padding: '10px 16px 10px 32px',
                                    }}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default memo(ImportFlow)
