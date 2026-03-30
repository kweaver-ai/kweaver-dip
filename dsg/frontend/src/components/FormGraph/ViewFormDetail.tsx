import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Drawer, Form, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import {
    CyclesOptions,
    DataRangeOptions,
    FormTableKindOptions,
    dataKindOptions,
} from '../Forms/const'
import {
    getFormInfo,
    getFormQueryItem,
    getTagByIds,
    getFileListByIds,
    formatError,
    AttachmentType,
    transformQuery,
} from '@/core'
import AutoFormView from '../AutoFormView'
import { DisplayInfoComponentType } from '../AutoFormView/helper'
import {
    OpenAttribute,
    OpenAttributeOption,
    SharedAttribute,
    SharedAttributeOption,
    SharedModeOption,
    SourceType,
} from './helper'
import { getFileExtension } from '@/utils'
import { FileIconType } from '../File/helper'
import FileIcon from '../FileIcon'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface ViewFormDetailType {
    formId: any
    mid: string
    onClose: () => void
}

const ViewFormDetail = ({ onClose, formId, mid }: ViewFormDetailType) => {
    const [form] = Form.useForm()
    const [formData, setFormData] = useState<any>(null)
    const [formConfig, setFormConfig] = useState<any>(null)
    const { isDraft, selectedVersion, getDragData } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        // 优先使用拖拽数据中的 is_draft，如果没有则使用全局的 isDraft
        const dragData = getDragData ? getDragData(formId) : {}
        const currentIsDraft =
            dragData?.is_draft !== undefined ? dragData.is_draft : isDraft
        return transformQuery({ isDraft: currentIsDraft, selectedVersion })
    }, [isDraft, selectedVersion, getDragData, formId])

    useEffect(() => {
        initGetFormInfo()
    }, [formId])

    /**
     * 初始化加载数据
     */
    const initGetFormInfo = async () => {
        try {
            const info = await getFormQueryItem(formId, {
                ...versionParams,
            })
            let label_list = []
            if (info?.label_ids?.length) {
                const res = await getTagByIds(info?.label_ids || [])
                label_list = res?.label_resp?.map((item) => item.name)
            }
            let fileList: Array<any> = []
            if (info.stand_file_ids?.length) {
                const res = await getFileListByIds(
                    info.stand_file_ids as string[],
                )
                fileList = res?.data
            }
            initFormConfig({ ...info, stand_file_ids: fileList })
            const data_kind = info?.data_kind?.map((it) => {
                return (
                    dataKindOptions.find((item) => item.value === it)?.label ||
                    '--'
                )
            })
            setFormData({
                ...info,
                data_kind,
                label_list,
                stand_file_ids: fileList,
            })
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 初始化配置
     */

    const initFormConfig = (data: any) => {
        const config: any = {
            name: {
                type: DisplayInfoComponentType.Text,
                label: __('业务表名称'),
            },
            table_kind: {
                type: DisplayInfoComponentType.SelectText,
                label: __('类型：'),
                options: FormTableKindOptions,
            },
            data_range: {
                type: DisplayInfoComponentType.SelectText,
                label: __('数据范围'),
                options: DataRangeOptions,
            },
            stand_file_ids: {
                type: DisplayInfoComponentType.Custom,
                label: `${__('关联标准文件')}`,
                CustomComponent: (
                    <div className={styles.fileTagsWrapper}>
                        {data.stand_file_ids?.map((fileItem: any) => {
                            const {
                                id,
                                name,
                                file_name = '',
                                attachment_type,
                            } = fileItem
                            return (
                                <Tag
                                    title={name}
                                    key={id}
                                    className={styles.fileItemTagWrapper}
                                >
                                    <FileIcon
                                        suffix={
                                            attachment_type ===
                                            AttachmentType.URL
                                                ? FileIconType.LINK
                                                : getFileExtension(file_name)
                                        }
                                        style={{ fontSize: '16px' }}
                                    />
                                    <span className={styles.fileItemName}>
                                        {name || '--'}
                                    </span>
                                </Tag>
                            )
                        }) || '--'}
                    </div>
                ),
            },
            data_kind: {
                type: DisplayInfoComponentType.TagText,
                label: __('基础信息分类'),
            },
            label_list: {
                type: DisplayInfoComponentType.TagText,
                label: __('业务标签'),
            },
            description: {
                type: DisplayInfoComponentType.AreaText,
                label: __('描述'),
            },
        }

        setFormConfig(config)
    }
    return (
        <Drawer
            width={560}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>{__('业务表信息')}</div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onClose()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            closable={false}
            onClose={() => {
                onClose()
            }}
            mask={false}
            open
            getContainer={false}
            style={{ position: 'absolute' }}
            className={styles.nodeConfigWrapper}
            footer={null}
            destroyOnClose
        >
            {formConfig && <AutoFormView data={formData} config={formConfig} />}
        </Drawer>
    )
}

export default ViewFormDetail
