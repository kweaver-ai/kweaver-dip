import { Button, Menu, MenuProps } from 'antd'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { debounce, trim } from 'lodash'
import { useUpdateEffect } from 'ahooks'
import { SearchInput } from '@/ui'
import { ParamsType, useCongSearchContext } from '../../CogSearchProvider'
import __ from '../../locale'
import ParticipleTag, { ITagItem } from './ParticipleTag'
import styles from './styles.module.less'
import HistoryDropdown from '../../../HistoryDropdown'
import { AssetType } from '../../const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { answersTabItem } from '../../helper'

function SearchHeader() {
    const [searchParams] = useSearchParams()
    const keys: string = searchParams.get('keyword') || ''
    const {
        updateParams,
        isCongSearch,
        participle,
        setCommonWord,
        assetType,
        searchKey,
    } = useCongSearchContext()
    const [tags, setTags] = useState<ITagItem[]>()
    const [isFocus, setIsFocus] = useState<boolean>(true)
    const [keyword, setKeyword] = useState<string>('')
    const [stopWord, setStopWord] = useState<string[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const searchRef: any = useRef()
    const [{ using }] = useGeneralConfig()

    // 记录上次输入关键词
    const [lastInputKey, setLastInputKey] = useState('')

    useEffect(() => {
        if (keyword) {
            setLastInputKey(keyword)
        }
    }, [keyword])

    useEffect(() => {
        if (keys) {
            setKeyword(keys)
            updateParams(ParamsType.KeyWord, keys)
            setIsFocus(false)
        }
    }, [keys])

    useEffect(() => {
        setTags(participle)
        setIsFocus(!isCongSearch)
    }, [participle])

    useEffect(() => {
        setKeyword(searchKey)
    }, [assetType])

    const isShowTag = useMemo(() => {
        return !isFocus && !!tags?.length
    }, [isFocus, tags])

    const handleSearch = useCallback(
        (key: string) => {
            const tempKey = key?.trim()
            if (!tempKey) {
                // 没有关键字则清空分词
                setIsFocus(true)
                setTags(undefined)
                return
            }
            updateParams(ParamsType.KeyWord, tempKey)
            setCommonWord(stopWord)
        },
        [stopWord],
    )

    // 输入框内容变化
    const handleSearchChange = (kw) => {
        setKeyword(kw)
        setShowHistory(true)
        if (tags?.length) {
            setTags([])
        }
    }

    // 点击一条历史记录
    const handleClickHistoryItem = (item) => {
        setKeyword(item?.qword)
        handleSearch(item?.qword)
        setIsFocus(true)
    }

    // 点击其他区域，关闭下拉菜单
    useEffect(() => {
        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    const handleClickOutside = (event: any) => {
        if (searchRef?.current && !searchRef.current.contains(event.target)) {
            setShowHistory(false)
        }
    }

    // useUpdateEffect(() => {
    //     if (!showHistory && !keyword) {
    //         setKeyword(lastInputKey)
    //     }
    // }, [showHistory])

    // 问答页面的菜单栏项
    const menus: MenuProps['items'] =
        using === 2
            ? [
                  {
                      key: AssetType.ALL,
                      label: __('全部'),
                  },
                  answersTabItem(),
                  {
                      key: AssetType.LOGICVIEW,
                      label: __('库表'),
                  },
                  {
                      key: AssetType.INTERFACESVC,
                      label: __('接口服务'),
                  },
              ]
            : [
                  {
                      key: AssetType.ALL,
                      label: __('数据目录'),
                  },
                  answersTabItem(),
              ]

    return (
        <div className={styles['search-wrapper']}>
            <HistoryDropdown
                keyword={keyword?.trim() || ''}
                onClickHistory={handleClickHistoryItem}
                showHistory={showHistory}
                overlayStyle={{ maxWidth: 640 }}
            >
                <div
                    ref={searchRef}
                    onClick={() => setShowHistory(true)}
                    className={styles['search-wrapper-content']}
                >
                    {/* <div className={styles['search-wrapper-search']}>
                        <TableSearchOutlined />
                    </div> */}
                    <div className={styles['search-wrapper-switch']}>
                        <SearchInput
                            style={{
                                zIndex: 50,
                                width: 640,
                            }}
                            placeholder={__('请输入要查找的内容')}
                            value={keyword}
                            onOriginalKeyChange={debounce(
                                handleSearchChange,
                                100,
                            )}
                            onPressEnter={(e: any) => {
                                const { value } = e.target
                                if (trim(value)) {
                                    setShowHistory(false)
                                    handleSearch(value)
                                }
                            }}
                            className={styles['search-wrapper-switch-input']}
                            maxLength={100}
                            bordered={false}
                            autoFocus={isFocus}
                            onFocus={() => setIsFocus(true)}
                        />
                    </div>
                </div>
            </HistoryDropdown>
            <Button
                type="primary"
                className={styles['search-wrapper-btn']}
                style={{ marginLeft: 16, width: 80, height: 40 }}
                onClick={() => {
                    handleSearch(keyword)
                }}
            >
                {__('搜索')}
            </Button>
        </div>
    )
}

export default memo(SearchHeader)
