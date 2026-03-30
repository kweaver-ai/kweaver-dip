import React, {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
    ReactNode,
} from 'react'
import { Dropdown, Checkbox } from 'antd'
import classnames from 'classnames'
import { DownOutlined, CloseCircleFilled } from '@ant-design/icons'
import { CloseOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { SearchInput, Empty } from '@/ui'
import Icons from '@/components/DatasheetView/Icons'
import dataEmpty from '@/assets/dataEmpty.svg'

interface IMultipleSelect {
    options: any[]
    onChange: (val) => void
    value?: string
    placeholder?: string
    fieldValue?: string
    fieldLabel?: string
    Icon?: ReactNode
    titleText?: string
    searchPlaceholder?: string
    undistributedKey?: string
    showSearch?: boolean
}

/**
 * @param options 选项列表
 * @param onChange 值变化时，调用函数
 * @param value 已选值
 * @param placeholder 选择框默认文本
 * @param fieldValue 自定义value字段，默认id
 * @param fieldLabel 自定义label字段，默认name
 * @param showIcon 是否显示图标
 * @param Icon 自定义图标组件
 * @param titleText 提示标题信息
 * @param searchPlaceholder 搜索默认文本
 * @param undistributedKey 固定底部选项key，例如未分配
 */
const MultipleSelect = forwardRef((props: IMultipleSelect, ref) => {
    const {
        placeholder = __('请选择'),
        fieldValue = 'id',
        fieldLabel = 'name',
        options = [],
        onChange,
        Icon,
        titleText,
        searchPlaceholder = __('请输入'),
        value,
        undistributedKey,
        showSearch = true,
    } = props

    const selectTagsDom: any = useRef()
    const selectSubTagsDom: any = useRef()

    const [initData, setInitData] = useState<any[]>([])
    const [selectedData, setSelectedData] = useState<any[]>([])
    const [fillteDataList, setFillteDataList] = useState<any[]>([])

    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(true)
    const [dropdownSearchKey, setDropdownSearchKey] = useState<string>('')
    const [moreBtnIndex, setMoreBtnIndex] = useState<number>(0)
    const [undistributedData, setUndistributedData] = useState<any>({})

    const handleOpenDropdownChange = (flag: boolean) => {
        setOpenDropdown(flag)
    }

    useImperativeHandle(ref, () => ({
        reset,
    }))

    useEffect(() => {
        init()
    }, [options])

    useEffect(() => {
        if (value) {
            getSelectedDataByValue()
        }
    }, [value])

    useEffect(() => {
        getMoreBtnIndex()
        if (
            selectedData.length > 0 &&
            selectedData.map((item) => item[fieldValue]).join() !== value
        ) {
            onChange(selectedData)
            const checked = selectedData
                .map((item) => item[fieldValue])
                .includes(undistributedKey)
            setUndistributedData({
                ...undistributedData,
                checked,
            })
        }
        if (selectedData.length === 0 && !isInit) {
            onChange([])
            setUndistributedData({
                ...undistributedData,
                checked: false,
            })
        }
    }, [selectedData])

    const getSelectedDataByValue = () => {
        setSelectedData(
            value?.split(',')?.map((it) => {
                return options.find((item) => item[fieldValue] === it)
            }) || [],
        )
    }

    const getMoreBtnIndex = () => {
        const boxWid = selectTagsDom?.current?.offsetWidth
        const subWid = selectedData.reduce((pre, cur, index) => {
            const wid = pre + getTextWidth(cur[fieldLabel])
            if (wid < boxWid - 64) {
                setMoreBtnIndex(index + 1)
            }
            return wid
        }, 0)
    }

    const init = (resetFlag?: boolean) => {
        const valueList = value?.split(',') || []
        const list = undistributedKey
            ? options.filter((item) => item[fieldValue] !== undistributedKey)
            : options
        const data = list.map((item) => {
            return {
                ...item,
                checked: resetFlag
                    ? false
                    : valueList?.includes(item[fieldValue]),
            }
        })
        if (undistributedKey) {
            setUndistributedData(
                options.find((item) => item[fieldValue] === undistributedKey),
            )
        }
        setInitData(data)
        setFillteDataList(data)
    }

    const reset = () => {
        init(true)
        setMoreBtnIndex(0)
        setSelectedData([])
        onChange([])
    }

    const delSelectedData = (data: any) => {
        const arry = selectedData.filter((item) => {
            return item[fieldValue] !== data[fieldValue]
        })
        setSelectedData(arry)
    }

    const empty = () => {
        return (
            <div className={styles.emptyBox}>
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            </div>
        )
    }

    const dropdownItems = [
        {
            key: '1',
            label: (
                <div className={styles.dropdownOverlay}>
                    <div className={styles.dropdownTitle}>{titleText}</div>
                    {initData.length === 0 ? (
                        empty()
                    ) : (
                        <>
                            {showSearch && (
                                <div className={styles.dropdownInput}>
                                    <SearchInput
                                        value={dropdownSearchKey}
                                        onKeyChange={(kw: string) => {
                                            // 至少搜索过一次之后的清空操作
                                            setFillteDataList(
                                                kw
                                                    ? initData.filter(
                                                          (item) => {
                                                              return item[
                                                                  fieldLabel
                                                              ]
                                                                  .toLocaleLowerCase()
                                                                  .includes(
                                                                      kw.toLocaleLowerCase(),
                                                                  )
                                                          },
                                                      )
                                                    : initData,
                                            )
                                            setDropdownSearchKey(kw)
                                        }}
                                        placeholder={searchPlaceholder}
                                    />
                                </div>
                            )}
                            <div className={styles.itemBox}>
                                {fillteDataList.length > 0 ? (
                                    fillteDataList.map((item) => {
                                        return (
                                            <div
                                                key={item[fieldValue]}
                                                className={classnames(
                                                    styles.dropdownItem,
                                                )}
                                            >
                                                <Checkbox
                                                    checked={item.checked}
                                                    onChange={(e) => {
                                                        const { target } = e
                                                        setInitData(
                                                            initData.map(
                                                                (it) => {
                                                                    const obj: any =
                                                                        it
                                                                    if (
                                                                        it[
                                                                            fieldValue
                                                                        ] ===
                                                                        item[
                                                                            fieldValue
                                                                        ]
                                                                    ) {
                                                                        obj.checked =
                                                                            target.checked
                                                                    }
                                                                    return obj
                                                                },
                                                            ),
                                                        )
                                                        if (target.checked) {
                                                            setSelectedData([
                                                                ...selectedData,
                                                                item,
                                                            ])
                                                        } else {
                                                            delSelectedData(
                                                                item,
                                                            )
                                                        }
                                                        setIsInit(false)
                                                    }}
                                                    className={styles.checkBox}
                                                >
                                                    {item?.icon}
                                                    <span
                                                        className={
                                                            styles.checkItemLabel
                                                        }
                                                        title={item[fieldLabel]}
                                                    >
                                                        {item[fieldLabel]}
                                                    </span>
                                                </Checkbox>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div
                                        className={classnames(
                                            styles.dropdownItem,
                                            styles.emptyDesc,
                                        )}
                                    >
                                        {__('抱歉，没有找到相关内容')}
                                    </div>
                                )}
                            </div>
                            {undistributedKey && !dropdownSearchKey && (
                                <div
                                    className={classnames(
                                        styles.itemBox,
                                        styles.footer,
                                    )}
                                >
                                    <div className={styles.dropdownItem}>
                                        <Checkbox
                                            checked={undistributedData.checked}
                                            onChange={(e) => {
                                                const { target } = e
                                                undistributedData.checked =
                                                    target?.checked
                                                if (target.checked) {
                                                    setSelectedData([
                                                        ...selectedData,
                                                        undistributedData,
                                                    ])
                                                } else {
                                                    delSelectedData(
                                                        undistributedData,
                                                    )
                                                }
                                                setIsInit(false)
                                            }}
                                            className={styles.checkBox}
                                        >
                                            <span
                                                className={
                                                    styles.checkItemLabel
                                                }
                                                title={undistributedData.name}
                                            >
                                                {undistributedData.name}
                                            </span>
                                        </Checkbox>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ]

    const hideSelectedDropdownItems = [
        {
            key: '1',
            label: (
                <div className={styles.hideSelectedBox}>
                    {selectedData
                        .filter((item, index) => index > moreBtnIndex - 1)
                        .map((item) => {
                            return (
                                <div
                                    className={styles.hideItem}
                                    key={item[fieldValue]}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        e.preventDefault()
                                    }}
                                >
                                    <span
                                        className={styles.hideItemName}
                                        title={item[fieldLabel]}
                                    >
                                        {item[fieldLabel]}
                                    </span>
                                    <CloseOutlined
                                        className={styles.selectedTagIcon}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setInitData(
                                                initData.map((it) => {
                                                    const obj: any = it
                                                    if (
                                                        it[fieldValue] ===
                                                        item[fieldValue]
                                                    ) {
                                                        obj.checked = false
                                                    }
                                                    return obj
                                                }),
                                            )
                                            delSelectedData(item)
                                        }}
                                    />
                                </div>
                            )
                        })}
                </div>
            ),
        },
    ]

    const getTextWidth = (text: string) => {
        // 创建临时元素
        const spanDom = document.createElement('span')
        // 放入文本
        spanDom.innerText = text
        // 设置文字大小
        spanDom.style.fontSize = `12px`
        // span元素转块级
        spanDom.style.position = 'absolute'
        // span放入body中
        document.body.appendChild(spanDom)
        // 获取span的宽度
        const width = text ? spanDom.offsetWidth + 39 : 0
        // 从body中删除该span
        document.body.removeChild(spanDom)
        // 返回span宽度
        return width > 140 ? 140 : width
    }

    return (
        <div className={styles.multipleSelectWrapper}>
            <Dropdown
                menu={{ items: dropdownItems }}
                trigger={['click']}
                onOpenChange={handleOpenDropdownChange}
                open={openDropdown}
                placement="bottomLeft"
                overlayClassName={styles.filterDropdown}
                getPopupContainer={(node) => node.parentElement || node}
            >
                <div className={styles.selectedText} ref={selectTagsDom}>
                    {selectedData.length > 0 ? (
                        <div
                            className={styles.selectedTagBox}
                            ref={selectSubTagsDom}
                        >
                            {selectedData
                                .filter((item, index) => index < moreBtnIndex)
                                .map((item) => {
                                    return (
                                        <span
                                            key={item[fieldValue]}
                                            className={styles.selectedTag}
                                        >
                                            <span
                                                className={
                                                    styles.selectedTagName
                                                }
                                                title={item[fieldLabel]}
                                            >
                                                {item[fieldLabel]}
                                            </span>
                                            <CloseOutlined
                                                className={
                                                    styles.selectedTagIcon
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    setInitData(
                                                        initData.map((it) => {
                                                            const obj: any = it
                                                            if (
                                                                it[
                                                                    fieldValue
                                                                ] ===
                                                                item[fieldValue]
                                                            ) {
                                                                obj.checked =
                                                                    false
                                                            }
                                                            return obj
                                                        }),
                                                    )
                                                    delSelectedData(item)
                                                }}
                                            />
                                        </span>
                                    )
                                })}
                            {selectedData.filter(
                                (item, index) => index > moreBtnIndex - 1,
                            ).length > 0 && (
                                <Dropdown
                                    menu={{ items: hideSelectedDropdownItems }}
                                    onOpenChange={(flag) => {
                                        if (flag) {
                                            setOpenDropdown(false)
                                        }
                                    }}
                                    overlayClassName={
                                        styles.hideSelectedFilterDropdown
                                    }
                                    getPopupContainer={(node) =>
                                        node.parentElement || node
                                    }
                                >
                                    <span
                                        className={classnames(
                                            styles.selectedTag,
                                            styles.moreBtn,
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                        }}
                                    >
                                        +{selectedData.length - moreBtnIndex}
                                    </span>
                                </Dropdown>
                            )}
                        </div>
                    ) : (
                        <span className={styles.filterText}>{placeholder}</span>
                    )}
                    <span
                        className={classnames(
                            styles.dropIcon,
                            selectedData.length > 0 && styles.hasData,
                        )}
                    >
                        <DownOutlined className={styles.down} />
                        <CloseCircleFilled
                            className={styles.close}
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                reset()
                            }}
                        />
                    </span>
                </div>
            </Dropdown>
        </div>
    )
})

export default MultipleSelect
