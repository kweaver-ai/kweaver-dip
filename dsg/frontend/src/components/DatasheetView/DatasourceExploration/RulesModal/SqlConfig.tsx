import { FC, ReactNode, useEffect, useRef, useState, useCallback } from 'react'
import { Modal, Input, Tooltip, Button } from 'antd'
import classnames from 'classnames'
import { noop, debounce } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import { Empty, SearchInput } from '@/ui'
import DragBox from '@/components/DragBox'
import { getFieldTypeEelment } from '../../helper'
import Editor from '@/components/IndicatorManage/Editor'
import { getFormatSql } from '@/components/SCustomView/UnitForm/helper'
import { useDataViewContext } from '../../DataViewProvider'
import { FontIcon } from '@/icons'

/**
 * 配置接口，用于定义生成SQL语句的相关参数和行为。
 */
interface ISqlConfig {
    /**
     * 字段列表，可选。用于指定需要生成SQL语句的字段。
     */
    fieldList?: Array<any>
    /**
     * 默认的SQL语句，可选。当没有指定特定的SQL生成规则时，可以使用这个默认的SQL语句。
     */
    defaultSql?: string
    placeholder?: string
    onChange?: (sql: string) => void
}
const SqlConfig: FC<ISqlConfig> = ({
    fieldList = [],
    defaultSql = '',
    placeholder = '示例:张三需要检查幼儿园入学登记表学生年龄是否满3周岁的sql可以这样写:age>=3',
    onChange = noop,
}) => {
    const { isTemplateConfig } = useDataViewContext()
    // 用于存储搜索关键字
    const [searchKey, setSearchKey] = useState<string>('')
    // 用于存储列表数据
    const [listData, setListData] = useState<Array<any>>([])
    // 用于存储SQL脚本内容
    const [sqlScript, setSqlScript] = useState<string>('')
    // 用于在编辑模式下引用DOM元素
    const reactCodeMirrorRef = useRef<any>(null)
    // 用于存储源数据关键字
    const [defaultSize, setDefaultSize] = useState<number[]>([40, 60])
    const [searchTips, setSearchTips] = useState<string>(
        __('搜索字段业务名称、技术名称'),
    )
    const [open, setOpen] = useState<boolean>(false)
    const [variableName, setVariableName] = useState<string>('')

    const debouncedSetSqlScript = useCallback(
        debounce((val) => {
            setSqlScript(val)
        }, 300),
        [],
    )

    useEffect(() => {
        if (fieldList?.length) {
            setListData(fieldList.filter((item) => item.status !== 'delete'))
        }
    }, [fieldList])

    useEffect(() => {
        if (defaultSql) {
            setSqlScript(defaultSql)
        }
    }, [defaultSql])

    useEffect(() => {
        onChange?.(sqlScript)
    }, [sqlScript])

    // 监听searchKey的变化，以更新列表数据
    useEffect(() => {
        // 当searchKey存在时，根据searchKey搜索并更新列表数据
        if (searchKey) {
            setListData(
                // 使用searchValue函数根据searchKey过滤fieldList，排除被删除的项
                searchValue(fieldList, searchKey).filter(
                    (item) => item.status !== 'delete',
                ),
            )
        } else {
            // 当searchKey不存在时，更新列表数据为所有未被删除的项
            setListData(fieldList.filter((item) => item.status !== 'delete'))
        }
    }, [searchKey])
    /**
     * 根据关键字搜索数据。
     *
     * 该函数接收一个数据数组和一个关键字字符串，返回一个过滤后的数组，其中包含所有业务名称或技术名称与关键字匹配的项。
     * 关键字搜索不区分大小写，旨在帮助用户快速查找相关数据。
     *
     * @param data 数组，包含待搜索的数据项。每个数据项应至少包含业务名称和技術名称两个属性。
     * @param keyword 字符串，用于搜索的关键字。函数将忽略关键字的大小写，进行模糊匹配。
     * @returns 返回一个过滤后的数组，其中包含所有业务名称或技术名称与关键字匹配的数据项。
     */
    const searchValue = (data: Array<any>, keyword: string) => {
        // 创建一个正则表达式对象，用于不区分大小写的关键字匹配
        const regKey = new RegExp(keyword, 'i')
        // 过滤数据数组，仅保留业务名称或技术名称与关键字匹配的项
        return data.filter((item) => {
            // 检查业务名称或技术名称是否与关键字匹配
            return (
                regKey.test(item.business_name) ||
                regKey.test(item.technical_name)
            )
        })
    }

    return (
        <div className={styles.SqlConfigBody}>
            <div className={styles.configWrapper}>
                {isTemplateConfig && (
                    <a className={styles.addBtn} onClick={() => setOpen(true)}>
                        {__('插入变量')}
                    </a>
                )}
                <div className={styles.contentWrapper}>
                    {isTemplateConfig ? (
                        <div
                            className={classnames(
                                styles.editorWrapper,
                                styles.templateEditorWrapper,
                            )}
                        >
                            <div className={styles.editorContent}>
                                <div className={styles.editorExpand}>
                                    <div className={styles.formateBtnBox}>
                                        <Tooltip
                                            title={
                                                sqlScript.length
                                                    ? ''
                                                    : __('当前SQL代码为空')
                                            }
                                            placement="bottom"
                                        >
                                            <Button
                                                type="link"
                                                icon={
                                                    <FontIcon
                                                        name="icon-geshi"
                                                        className={styles.icon}
                                                    />
                                                }
                                                className={styles.formateBtn}
                                                disabled={!sqlScript?.length}
                                                onClick={() => {
                                                    const formattedSql =
                                                        getFormatSql(sqlScript)
                                                    setSqlScript(formattedSql)
                                                }}
                                            >
                                                {__('格式化')}
                                            </Button>
                                        </Tooltip>
                                    </div>
                                    <Editor
                                        style={{
                                            padding: '0 3px',
                                            display: 'grid',
                                        }}
                                        lineNumbers={false}
                                        ref={reactCodeMirrorRef}
                                        value={sqlScript}
                                        onChange={(val) => {
                                            debouncedSetSqlScript(val)
                                        }}
                                        placeholder={placeholder}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DragBox
                            defaultSize={defaultSize}
                            minSize={[170, 220]}
                            maxSize={[800, Infinity]}
                            onDragEnd={(size) => {
                                setDefaultSize(size)
                                const [lfWid] = size
                                setSearchTips(
                                    (lfWid * 680) / 100 < 315
                                        ? __('搜索字段业务名称、技术名称')
                                        : '',
                                )
                            }}
                            existPadding={false}
                            gutterStyles={{
                                width: '8px',
                            }}
                            gutterSize={8}
                            expandCloseText={__('字段列表')}
                        >
                            <div className={styles.selectWrapper}>
                                <div className={styles.listSearchWrapper}>
                                    <Tooltip title={searchTips}>
                                        <SearchInput
                                            onKeyChange={(kw) => {
                                                setSearchKey(kw)
                                            }}
                                            value={searchKey}
                                            placeholder={__(
                                                '搜索字段业务名称、技术名称',
                                            )}
                                        />
                                    </Tooltip>
                                </div>
                                <div className={styles.listWrapper}>
                                    {listData.length ? (
                                        listData.map((item, index) => {
                                            return (
                                                <div
                                                    key={index}
                                                    className={
                                                        styles.listItemWrapper
                                                    }
                                                    onClick={() => {
                                                        // setSqlScript(
                                                        //     `${sqlScript}${item.technical_name}`,
                                                        // )
                                                        const sqlText = `${item.technical_name}`
                                                        const newSql = `[[FFF.$\{${sqlText}}]]`
                                                        reactCodeMirrorRef?.current?.insertText(
                                                            newSql,
                                                            false,
                                                        )
                                                    }}
                                                >
                                                    <div
                                                        className={
                                                            styles.dataIcon
                                                        }
                                                    >
                                                        {getFieldTypeEelment({
                                                            ...item,
                                                            type: item.data_type,
                                                        })}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.itemContent
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.text
                                                            }
                                                            title={
                                                                item.business_name
                                                            }
                                                        >
                                                            {item.business_name}
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.nextText
                                                            }
                                                            title={
                                                                item.technical_name
                                                            }
                                                        >
                                                            {item.technical_name ||
                                                                '--'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className={styles.empty}>
                                            <Empty iconHeight="104px" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.editorWrapper}>
                                <div className={styles.editorContent}>
                                    <div className={styles.editorExpand}>
                                        <div className={styles.formateBtnBox}>
                                            <Tooltip
                                                title={
                                                    sqlScript.length
                                                        ? ''
                                                        : __('当前SQL代码为空')
                                                }
                                                placement="bottom"
                                            >
                                                <Button
                                                    type="link"
                                                    icon={
                                                        <FontIcon
                                                            name="icon-geshi"
                                                            className={
                                                                styles.icon
                                                            }
                                                        />
                                                    }
                                                    className={
                                                        styles.formateBtn
                                                    }
                                                    disabled={
                                                        !sqlScript?.length
                                                    }
                                                    onClick={() => {
                                                        const formattedSql =
                                                            getFormatSql(
                                                                sqlScript,
                                                            )
                                                        setSqlScript(
                                                            formattedSql,
                                                        )
                                                    }}
                                                >
                                                    {__('格式化')}
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        <Editor
                                            style={{
                                                padding: '0 3px',
                                                display: 'grid',
                                            }}
                                            lineNumbers={false}
                                            ref={reactCodeMirrorRef}
                                            value={sqlScript}
                                            onChange={(val) => {
                                                debouncedSetSqlScript(val)
                                            }}
                                            placeholder={placeholder}
                                        />
                                    </div>
                                </div>
                            </div>
                        </DragBox>
                    )}
                </div>
            </div>
            {open && (
                <Modal
                    width={400}
                    title={__('字段变量')}
                    open={open}
                    onCancel={() => setOpen(false)}
                    maskClosable={false}
                    zIndex={1002}
                    wrapClassName={styles.rulesModal}
                    onOk={() => {
                        const sqlText = `${variableName}`
                        const newSql = `[[FFF.$\{${sqlText}}]]`
                        reactCodeMirrorRef?.current?.insertText(newSql, false)
                        setOpen(false)
                        setVariableName('')
                    }}
                >
                    <SearchInput
                        placeholder={__('请输入变量')}
                        maxLength={128}
                        value={variableName}
                        showIcon={false}
                        onKeyChange={(keyword: string) =>
                            setVariableName(keyword)
                        }
                    />
                </Modal>
            )}
        </div>
    )
}

export default SqlConfig
