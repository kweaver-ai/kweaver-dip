import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Drawer, Space, Button, message, Dropdown } from 'antd'
import classNames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import {
    formatError,
    getObjectDetails,
    getOrgMainBusinessList,
    downloadObjFile,
} from '@/core'
import { departmentFields, contentTypes, OrgType } from '../const'
import { LabelTitle } from '@/components/BusinessTagClassify/helper'
import EditForm from './EditForm'
import { organizationType, baseInfoFields, getFileList } from '../helper'
import { streamToFile, getFileExtension } from '@/utils'
import FileIcon from '@/components/FileIcon'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Architecture } from '@/components/BusinessArchitecture/const'

interface IOrgDetails {
    open: boolean
    toEdit?: boolean
    onClose: () => void
    updateList?: () => void
    style?: any
    id: any
}

const OrgDetails = (props: IOrgDetails, ref) => {
    const { open, onClose, style, updateList, id, toEdit } = props
    const formRef: any = useRef()
    const [detailsData, setDetailsData] = useState<any[]>([])
    const [departmentData, setDepartmentData] = useState<any[]>([])
    const [mainBussinessData, setMainBussinessData] = useState<any[]>([])
    const [detailsInfos, setDetailsInfos] = useState<any>({})
    const [showDepartment, setShowDepartment] = useState(false)
    const [showMainBussiness, setShowMainBusiness] = useState(false)
    const [isEdit, setIsEdit] = useState(false)

    const showEdit = useMemo(() => {
        const path = window.location.pathname
        return (
            // path.startsWith('/anyfabric/ca/') &&
            detailsInfos.type !== Architecture.ORGANIZATION
        )
    }, [detailsInfos])

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id])

    useEffect(() => {
        if (toEdit) {
            onEdit()
        }
    }, [toEdit])

    const fileListRender = (fileList: any[]) => {
        return (
            <div
                className={classNames(
                    styles['detail-main-business'],
                    styles['detail-files'],
                )}
            >
                {fileList.map((it) => {
                    const type = getFileExtension(it.name)
                    return (
                        <Dropdown
                            key={it.id}
                            menu={{
                                items: [
                                    {
                                        key: 'download',
                                        label: __('下载'),
                                        show: true,
                                    },
                                    {
                                        key: 'view',
                                        label: __('预览'),
                                        show: type === 'pdf',
                                    },
                                ]?.filter((item) => item.show),
                                onClick: ({ key }) => onDropdownClick(key, it),
                            }}
                        >
                            <div className={styles.fileWrapper}>
                                <FileIcon suffix={getFileExtension(it.name)} />
                                <div
                                    className={styles.fileName}
                                >{`${it.name}`}</div>
                            </div>
                        </Dropdown>
                    )
                })}
            </div>
        )
    }

    const getDetails = async () => {
        try {
            const res = await getObjectDetails(id)
            const mainRes = await getOrgMainBusinessList({ id, limit: 0 })
            const list = baseInfoFields
                .filter((item) =>
                    res.subtype === 0 ? item.key !== 'main_dept_type' : true,
                )
                .map((item) => {
                    const info = {
                        ...item,
                        value:
                            item.key === 'subtype'
                                ? organizationType(res)
                                : res[item.key] || '--',
                    }
                    if (item.key === 'main_dept_type') {
                        info.value = res?.main_dept_type ? '已设为主部门' : '--'
                    }
                    return info
                })

            setMainBussinessData(mainRes?.entries || [])
            const showFlag = !(
                res.type === Architecture.ORGANIZATION ||
                res.subtype === OrgType.AdministrativeDivision
            )
            setShowDepartment(showFlag)
            setShowMainBusiness(showFlag)

            setDetailsData(list)
            const moreInfoList = departmentFields.map((item) => {
                const obj = {
                    ...item,
                    value: res?.attributes?.[item.key] || '--',
                }
                if (item.key === 'file') {
                    const fileList = getFileList(res)
                    obj.value = fileList?.length
                        ? fileListRender(fileList)
                        : '--'
                }
                return obj
            })
            setDepartmentData(moreInfoList)
            setDetailsInfos(res)
        } catch (err) {
            formatError(err)
        }
    }

    const onEdit = () => {
        setIsEdit(true)
    }
    const onEditClose = () => {
        setIsEdit(false)
    }

    const download = async (fileId: string, fileName: string) => {
        try {
            message.info(__('下载准备中...'))
            const res = await downloadObjFile(fileId, id)
            // 将文件流转换成文件
            streamToFile(res, fileName)
            message.success(__('下载成功'))
        } catch (error) {
            formatError(error)
        }
    }

    const toView = async (fileId: string, fileName: string) => {
        try {
            const res = await downloadObjFile(fileId, id)
            const mimeType = contentTypes[getFileExtension(fileName) || '']
            const blob = new Blob([res], { type: mimeType })
            const blobUrl = URL.createObjectURL(blob)

            if (
                ['xlsx', 'doc', 'docx', 'xls'].includes(
                    getFileExtension(fileName) || '',
                )
            ) {
                // 下载预览文件
                const a = document.createElement('a')
                a.href = blobUrl
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } else {
                window.open(blobUrl, '_blank')
            }
        } catch (error) {
            formatError(error)
        }
    }

    const onDropdownClick = (key, item) => {
        if (key === 'download') {
            download(item.id, item.name)
        }
        if (key === 'view') {
            toView(item.id, item.name)
        }
    }

    return (
        <Drawer
            title={isEdit ? __('编辑') : __('详情')}
            placement="right"
            onClose={onClose}
            open={open}
            width={542}
            bodyStyle={{
                padding: '16px 24px',
            }}
            mask={isEdit}
            maskClosable={false}
            destroyOnClose
            footer={
                showEdit ? (
                    !isEdit ? (
                        <div className={styles.drawerFootWrapper}>
                            <Button onClick={onEdit} className={styles.btn}>
                                {__('编辑')}
                            </Button>
                        </div>
                    ) : (
                        <Space
                            size={12}
                            style={{
                                display: 'flex',
                                justifyContent: 'end',
                            }}
                        >
                            <Button onClick={() => onEditClose()}>
                                {__('取消')}
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => formRef?.current?.onSubmit()}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    )
                ) : null
            }
        >
            {isEdit ? (
                <EditForm
                    ref={formRef}
                    onClose={(flag) => {
                        if (flag) {
                            getDetails()
                            updateList?.()
                        }
                        onEditClose()
                    }}
                    id={id}
                />
            ) : (
                <div className={styles.detailsWrapper}>
                    <LabelTitle label={__('基本属性')} />
                    <div className={styles['detail-basic']}>
                        {detailsData.map((item) => {
                            return (
                                <div
                                    className={styles['detail-basic-row']}
                                    key={item.key}
                                >
                                    <div
                                        className={styles['detail-basic-lable']}
                                    >
                                        {item.title}
                                    </div>
                                    <div
                                        className={styles['detail-basic-text']}
                                    >
                                        {item.value}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {showDepartment && (
                        <>
                            <LabelTitle label={__('部门职责信息')} />
                            <div className={styles['detail-basic']}>
                                {departmentData.map((item) => {
                                    return (
                                        <div
                                            className={
                                                styles['detail-basic-row']
                                            }
                                            key={item.key}
                                        >
                                            <div
                                                className={
                                                    styles['detail-basic-lable']
                                                }
                                            >
                                                {item.title}
                                            </div>
                                            <div
                                                className={
                                                    styles['detail-basic-text']
                                                }
                                            >
                                                {item.value}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                    {/* {showMainBussiness && (
                        <>
                            <LabelTitle label={__('主干业务')} />
                            <div
                                className={classNames(
                                    mainBussinessData?.length
                                        ? styles['detail-main-business']
                                        : '',
                                )}
                            >
                                {mainBussinessData?.length ? (
                                    mainBussinessData.map((item) => {
                                        return (
                                            <div
                                                className={styles['detail-tag']}
                                                key={item.name}
                                            >
                                                {`${item.name}/${item.abbreviation_name}`}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <Empty
                                        desc={__('暂无数据')}
                                        iconSrc={dataEmpty}
                                    />
                                )}
                            </div>
                        </>
                    )} */}
                </div>
            )}
        </Drawer>
    )
}

export default OrgDetails
