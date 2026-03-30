import { Select, Form, Input, message, Upload, Checkbox } from 'antd'
import React, {
    useEffect,
    useMemo,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { RcFile, UploadProps } from 'antd/es/upload'
import Cookies from 'js-cookie'
import __ from '../locale'
import styles from './styles.module.less'
import {
    formatError,
    getObjectDetails,
    getOrgMainBusinessList,
    updateOrgMainBusinessList,
    addOrgMainBusinessList,
    updateObjAttribute,
} from '@/core'
import { DeleteColored } from '@/icons'
import { getFileExtension } from '@/utils'
import { LabelTitle } from '@/components/BusinessTagClassify/helper'
import { typeOptions, subTypeOptionMap, OrgType } from '../const'
import UploadFiles from '@/components/CitySharing/Apply/UploadFiles'
import MainBusinessTable from './MainBusinessTable'
import FileUploader from './FileUploader'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { getFileList, orgDeptTitle } from '../helper'
import FileIcon from '@/components/FileIcon'

const { TextArea } = Input

interface IEditForm {
    onClose: (flag?: boolean) => void
    id: string
}

const EditForm = forwardRef((props: IEditForm, ref) => {
    const { onClose, id } = props
    const [form] = Form.useForm()
    const [mainDataSource, setMainDataSource] = useState<any[]>([])
    const [fileList, setFileList] = useState<any[]>([])
    const [detailsInfos, setDetailsInfos] = useState<any>({})
    const [subtype, setSubtype] = useState<OrgType>()
    const [mainDeptType, setMainDeptType] = useState<boolean>()
    const [showMainDeptType, setShowMainDeptType] = useState<boolean>()

    useImperativeHandle(ref, () => ({
        onSubmit,
    }))

    useEffect(() => {
        if (id) {
            getDetails()
            getMainDataSource()
        }
    }, [id])

    const subtypeOptions = useMemo(() => {
        const level = detailsInfos?.path_id?.split('/')?.length
        const list =
            detailsInfos.subtype === 0 &&
            detailsInfos.type === Architecture.ORGANIZATION
                ? typeOptions
                : level === 2
                ? typeOptions.filter(
                      (item) =>
                          item.value !== OrgType.Organization &&
                          item.value !== OrgType.Bureau,
                  )
                : level > 2
                ? subTypeOptionMap[
                      detailsInfos.subtype || detailsInfos.type
                  ].filter(
                      (item) => item.value !== OrgType.AdministrativeDivision,
                  )
                : subTypeOptionMap[detailsInfos.subtype || detailsInfos.type]
        return list
    }, [detailsInfos])

    const onFinish = async (values) => {
        try {
            // 更新主干业务
            const updateList = mainDataSource.filter(
                (item) =>
                    item.id.length > 10 &&
                    (!!item.name || !!item.abbreviation_name),
            )
            const addList = mainDataSource
                .filter(
                    (item) =>
                        item.id.length < 10 &&
                        (!!item.name || !!item.abbreviation_name),
                )
                ?.map((item: any) => ({
                    abbreviation_name: item.abbreviation_name,
                    name: item.name,
                }))
            if (updateList?.length) {
                await updateOrgMainBusinessList({
                    main_business_infos: updateList,
                })
            }
            if (addList?.length) {
                await addOrgMainBusinessList({
                    main_business_infos: addList,
                    id: detailsInfos.id,
                })
            }
            const info: any = {
                id: detailsInfos.id,
                subtype: values.subtype || undefined,
                attribute: {
                    contacts: values.contacts,
                    department_responsibilities:
                        values.department_responsibilities,
                    file_specification_id: fileList
                        .map((item) => item.id)
                        ?.join(','),
                    file_specification_name: fileList
                        .map((item) => item.name)
                        ?.join(','),
                },
                main_dept_type: mainDeptType ? 1 : 0,
            }
            // 更新组织架构信息
            await updateObjAttribute(info)
            message.success('编辑成功')
            onClose(true)
        } catch (err) {
            formatError(err)
        }
    }

    const onSubmit = () => {
        form.submit()
    }

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    const getDetails = async () => {
        try {
            const res = await getObjectDetails(id)
            form.setFieldsValue({
                contacts: res?.attributes?.contacts,
                department_responsibilities:
                    res?.attributes?.department_responsibilities,
                subtype:
                    res.type !== Architecture.ORGANIZATION && res.subtype === 0
                        ? undefined
                        : res?.subtype,
            })
            setSubtype(res?.subtype)
            setFileList(getFileList(res))
            setDetailsInfos(res)
            setMainDeptType(res?.main_dept_type === 1)
            const pathLevel = res?.path?.split('/')?.length
            const flag = res?.subtype === 0 && pathLevel === 1
            setShowMainDeptType(!flag)
        } catch (err) {
            formatError(err)
        }
    }
    const getMainDataSource = async () => {
        try {
            const res = await getOrgMainBusinessList({ id, limit: 0 })
            setMainDataSource(res?.entries || [])
        } catch (err) {
            formatError(err)
        }
    }

    const handleUploadChange = (info) => {
        const { status, response, name } = info.file

        if (status === 'removed') {
            setFileList((pre) => pre.filter((item) => item.id !== response))
        } else if (status === 'done') {
            setFileList((pre) => [
                ...pre,
                {
                    name,
                    id: response,
                    status: 'add',
                },
            ])
        }
    }

    return (
        <div className={styles.editFormWrapper}>
            <Form
                autoComplete="off"
                onFinish={onFinish}
                form={form}
                layout="vertical"
                className={styles.editFormBox}
            >
                <LabelTitle label={__('基本属性')} />
                <Form.Item
                    label={__('类型')}
                    name="subtype"
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('类型不能为空'),
                        },
                    ]}
                >
                    <Select
                        disabled={
                            detailsInfos.type === Architecture.ORGANIZATION
                        }
                        options={subtypeOptions}
                        placeholder={__('请选择')}
                        getPopupContainer={(node) => node.parentNode}
                        onChange={(val) => setSubtype(val)}
                    />
                </Form.Item>
                {/* {showMainDeptType ? (
                    <Form.Item>
                        <Checkbox
                            checked={mainDeptType}
                            onChange={(e) => {
                                const { checked } = e.target
                                setMainDeptType(checked)
                            }}
                        >
                            {__('设为主部门')}
                            {orgDeptTitle()}
                        </Checkbox>
                    </Form.Item>
                ) : null} */}
                {subtype !== OrgType.AdministrativeDivision ? (
                    <>
                        <LabelTitle label={__('部门职责信息')} />
                        <Form.Item label={__('联系人')} name="contacts">
                            <Input placeholder={__('请输入')} maxLength={128} />
                        </Form.Item>
                        <Form.Item
                            label={__('部门职责')}
                            name="department_responsibilities"
                        >
                            <TextArea
                                placeholder={__('请输入')}
                                maxLength={300}
                                showCount
                                className={styles.textArea}
                            />
                        </Form.Item>
                        <Form.Item
                            label={__('文件要求')}
                            name="database_design_materials_ids"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                        >
                            <UploadFiles
                                maxCount={5}
                                fileDesc={
                                    <div>
                                        <div
                                            className={styles.fileDesc}
                                            style={{ marginBottom: '4px' }}
                                        >
                                            <div className={styles.fileOrder} />
                                            {__(
                                                '支持类型.doc、docx、.xlsx、.xls、.pdf，文件不得超过10MB',
                                            )}
                                        </div>
                                        <div className={styles.fileDesc}>
                                            <div className={styles.fileOrder} />
                                            {__(
                                                '支持上传多个文件，单次支持最多添加5个',
                                            )}
                                        </div>
                                    </div>
                                }
                                uploadParams={{
                                    name: 'file',
                                    action: `/api/configuration-center/v1/objects/${id}/upload`,
                                    headers: {
                                        Authorization: `Bearer ${
                                            Cookies.get('af.oauth2_token') || ''
                                        }`,
                                    },
                                    beforeUpload: (file: RcFile) => {
                                        const limit = file.size / 1024 / 1024
                                        if (limit > 10) {
                                            message.error(
                                                __('文件不可超过10MB'),
                                            )
                                            return Upload.LIST_IGNORE
                                        }
                                        const type = getFileExtension(file.name)
                                        if (
                                            !type ||
                                            ![
                                                'xlsx',
                                                'doc',
                                                'docx',
                                                'pdf',
                                                'xls',
                                            ].includes(type)
                                        ) {
                                            message.error(
                                                __('不支持的文件类型'),
                                            )
                                            return Upload.LIST_IGNORE
                                        }
                                        return true
                                    },
                                    multiple: true,
                                    onChange: handleUploadChange,
                                }}
                                canView
                            />
                            {/* <FileUploader /> */}
                        </Form.Item>
                        {fileList?.length
                            ? fileList
                                  ?.filter((it) => it?.status !== 'add')
                                  ?.map((it) => {
                                      return (
                                          <div
                                              key={it.id}
                                              className={styles.fileWrapper}
                                          >
                                              <FileIcon
                                                  suffix={getFileExtension(
                                                      it.name,
                                                  )}
                                              />
                                              <div
                                                  className={
                                                      styles['detail-tag']
                                                  }
                                              >
                                                  {`${it.name}`}
                                              </div>
                                              <DeleteColored
                                                  className={styles.deleteIcon}
                                                  onClick={(e) => {
                                                      e.stopPropagation()
                                                      setFileList((pre) =>
                                                          pre.filter(
                                                              (item) =>
                                                                  item.id !==
                                                                  it.id,
                                                          ),
                                                      )
                                                  }}
                                              />
                                          </div>
                                      )
                                  })
                            : null}
                        {/* <LabelTitle label={__('主干业务')} />
                        <MainBusinessTable
                            id={id}
                            dataSource={mainDataSource}
                            dataSourceChange={(o) => setMainDataSource(o)}
                        /> */}
                    </>
                ) : null}
            </Form>
        </div>
    )
})

export default EditForm
