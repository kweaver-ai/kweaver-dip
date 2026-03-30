import React, { useRef, useState } from 'react'
import { Select } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import type { SelectProps } from 'antd'
import classnames from 'classnames'
import { useDebounce, useUpdateEffect } from 'ahooks'
import {
    AttachmentType,
    CatalogOption,
    CatalogType,
    formatError,
    getDirDataByTypeOrId,
    getFileDirByTypeOrId,
    getFileList,
    IDirItem,
    IDirQueryType,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import FileIcon from '@/components/FileIcon'
import StandardDirTree from '@/components/StandardDirTree'
import {
    StdTreeDataOpt,
    fileCatlgTreeToStdTreeData,
    findDirByKey,
} from '@/components/StandardDirTree/const'
import { getFileExtension } from '@/utils'
import { FileIconType } from '@/components/File/helper'

const SelFileByType = (props: SelectProps) => {
    const { value, onChange } = props
    // const [initValueLoading, setInitValueLoading] = useState(true)
    const [listLoading, setListLoading] = useState(true)

    const [options, setOptions] = useState<any[]>([])

    // 搜索关键字
    const [searchValue, setSearchValue] = useState('')
    // 搜索关键字防抖
    const debouncedSearchValue = useDebounce(searchValue, { wait: 500 })
    // 搜索结果
    // const [data, setData] = useState<Array<any>>([])

    const treeRef: any = useRef()
    const dataType = CatalogType.FILE
    const [treeData, setTreeData] = useState<IDirItem[]>()
    // 目录loading
    const [dirLoading, setDirLoading] = useState(true)
    // 目录被选中节点
    const [selectedDir, setSelectedDir] = useState<IDirItem>()

    useUpdateEffect(() => {
        if (!selectedDir?.id) return
        filterFileList()
    }, [selectedDir])

    // useEffect(() => {
    //     if (value) {
    //         // getFileList(debouncedSearchValue)
    //     } else {
    //         setInitValueLoading(false)
    //     }
    // }, [value])

    useUpdateEffect(() => {
        filterFileList(debouncedSearchValue)
    }, [debouncedSearchValue])

    const getTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => {
        try {
            let res
            let data

            if (
                query?.type &&
                query?.catlgOption === CatalogOption.STDFILECATLG
            ) {
                // 标准文件目录及其文件是一次性获取
                let treeDataTemp: any = []
                setDirLoading(true)
                res = await getFileDirByTypeOrId(query?.type, '')
                treeDataTemp = fileCatlgTreeToStdTreeData([res.data])
                data = treeDataTemp || []
            } else {
                setDirLoading(true)
                res = await getDirDataByTypeOrId(dataType, undefined)
                data = res?.data ? res?.data : []
            }
            let newNode
            if (newSelectedDir) {
                newNode = findDirByKey(newSelectedDir?.id, data)
            }
            setSelectedDir(newNode || data?.[0])
            setTreeData(data)
        } catch (error: any) {
            formatError(error)
        } finally {
            setDirLoading(false)
        }
    }

    const filterFileList = async (keyword?: string) => {
        try {
            setListLoading(true)
            const res = await getFileList({
                catalog_id:
                    (keyword ? treeData?.[0]?.id : selectedDir?.id) ?? '',
                keyword,
                offset: 1,
                limit: 2000,
            })
            setOptions(res.data || [])
        } catch (error: any) {
            formatError(error)
        } finally {
            setListLoading(false)
        }
    }

    // const onTreeNodeChange = (node) => {
    //     setSelectedDir(node)
    // }

    const renderOptions = (newOptions: Array<any>) => {}

    // eslint-disable-next-line react/no-unstable-nested-components
    const dropdownRenderTemplate = (menu) => {
        if (debouncedSearchValue) {
            if (options?.length > 0) {
                return (
                    <div className={styles.dropdownWrapper}>
                        <div className={styles.searchWrapper}>
                            <div className={styles.searchTitle}>
                                {__('搜索结果')}
                            </div>
                            <div className={styles.resultWrapper}>
                                {options.map((item, index) => {
                                    const {
                                        id,
                                        name,
                                        file_name = '',
                                        attachment_type,
                                        catalog_name,
                                    } = item
                                    // const fileType =
                                    //     attachment_type === AttachmentType.URL
                                    //         ? FileIconType.LINK
                                    //         : getFileExtension(file_name)
                                    const ids = value?.map(
                                        (tagItem) =>
                                            tagItem?.id ||
                                            tagItem.key ||
                                            tagItem,
                                    )
                                    const isSelected = ids?.includes(item.id)
                                    return (
                                        <div
                                            className={classnames({
                                                [styles.fileItem]: true,
                                                [styles.searchResItem]: true,
                                                [styles.selectedItem]:
                                                    isSelected,
                                            })}
                                            onClick={() => {
                                                const newValue = [
                                                    ...(value || []),
                                                ]
                                                if (
                                                    newValue.includes(item.id)
                                                ) {
                                                    newValue.splice(
                                                        newValue.indexOf(
                                                            item.id,
                                                        ),
                                                        1,
                                                    )
                                                } else {
                                                    newValue.push(item.id)
                                                }
                                                onChange?.(newValue, [])
                                            }}
                                            key={id}
                                        >
                                            <div className={styles.iconWrapper}>
                                                <FileIcon
                                                    suffix={
                                                        attachment_type ===
                                                        AttachmentType.URL
                                                            ? FileIconType.LINK
                                                            : getFileExtension(
                                                                  file_name,
                                                              )
                                                    }
                                                />
                                            </div>
                                            <div className={styles.nameWrapper}>
                                                <span
                                                    className={styles.name}
                                                    title={name}
                                                >
                                                    {name || '--'}
                                                </span>
                                                <span
                                                    className={styles.text}
                                                    title={catalog_name}
                                                >
                                                    {__('目录：')}
                                                    {catalog_name || '--'}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <CheckOutlined
                                                    style={{
                                                        color: '#1890ff',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
            }
            return (
                <div className={styles.searchEmptyWrapper}>
                    {__('未搜到匹配结果')}
                </div>
            )
        }
        return (
            <div className={styles.dropdownWrapper}>
                {!debouncedSearchValue && (
                    <div
                        className={styles.fileTypeTreeWrapper}
                        hidden={!!debouncedSearchValue}
                    >
                        <div className={styles.fileTypeTreeTitle}>目录</div>

                        {/* <CAFileTypeTree
                            isShowSearch={false}
                            onTreeNodeChange={onTreeNodeChange}
                        /> */}
                        <StandardDirTree
                            ref={treeRef}
                            loading={dirLoading}
                            dirType={dataType}
                            treeData={treeData}
                            getTreeList={getTreeList}
                            selectedDir={selectedDir}
                            setSelectedDir={setSelectedDir}
                            optMenuItems={undefined}
                            showCatlgClassify={false}
                            isShowTitle={false}
                            isShowSearch={false}
                        />
                    </div>
                )}
                <div className={styles.fileListWrapper}>
                    <div className={styles.fileListTitle}>{__('标准文件')}</div>

                    {options?.length > 0 ? (
                        <div className={styles.fileList}>
                            {options.map((item, index) => {
                                const {
                                    id,
                                    name,
                                    file_name = '',
                                    attachment_type,
                                } = item
                                const ids = value?.map(
                                    (tagItem) =>
                                        tagItem?.id || tagItem.key || tagItem,
                                )
                                const isSelected = ids?.includes(item.id)

                                return (
                                    <div
                                        className={classnames({
                                            [styles.fileItem]: true,
                                            [styles.selectedItem]:
                                                value?.includes(item.id),
                                        })}
                                        onClick={() => {
                                            const newValue = [...(value || [])]
                                            if (newValue.includes(item.id)) {
                                                newValue.splice(
                                                    newValue.indexOf(item.id),
                                                    1,
                                                )
                                            } else {
                                                newValue.push(item.id)
                                            }
                                            onChange?.(newValue, [])
                                        }}
                                        key={id}
                                    >
                                        <div className={styles.iconWrapper}>
                                            <FileIcon
                                                suffix={
                                                    attachment_type ===
                                                    AttachmentType.URL
                                                        ? FileIconType.LINK
                                                        : getFileExtension(
                                                              file_name,
                                                          )
                                                }
                                            />
                                        </div>
                                        <div className={styles.nameWrapper}>
                                            <span
                                                className={styles.name}
                                                title={name}
                                            >
                                                {name || '--'}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <CheckOutlined
                                                style={{ color: '#1890ff' }}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <>
                            {/* <Empty desc={__('暂无数据')} iconSrc={dataEmpty} /> */}
                            <div className={styles.dataEmptyWrapper}>
                                {__('暂无数据')}
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    const selectProps: SelectProps = {
        mode: 'multiple',
        maxTagCount: 5,
        style: { width: '100%' },
        popupClassName: styles.selFileByTypeWrapper,
        dropdownStyle: { padding: 0 },
        value,
        options,
        labelInValue: true,
        onChange: (newValue: string[], option) => {
            onChange?.(newValue, option)
            // setValue(newValue)
        },
        showSearch: true,
        onSearch: (key) => {
            setSearchValue(key)
        },
        placeholder: __('请选择标准文件'),
        // loading: initValueLoading,
        fieldNames: {
            label: 'name',
            value: 'id',
        },
        onDropdownVisibleChange: (visible) => {
            if (!visible) {
                setSearchValue('')
            }
        },
        dropdownRender: dropdownRenderTemplate,
        ...props,
    }

    return <Select {...selectProps} />
}

export default SelFileByType
