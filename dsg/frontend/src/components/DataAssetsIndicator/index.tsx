import { useState, useEffect, useRef } from 'react'
import { Tooltip } from 'antd'
import Cookies from 'js-cookie'
import { trim } from 'lodash'
import { SearchInput } from '@/ui'
import __ from './locale'
import { goBackTop } from '../DataAssetsCatlg/helper'
import { ssoGet, loginConfigs, formatError } from '@/core'
import ApplicationService from '@/components/DataAssetsCatlg/ApplicationService'

// 仅指标 数据服务超市
const DataCatlgIndicator = () => {
    const searchRef = useRef<HTMLDivElement | null>(null)
    const dataRef: any = useRef()

    const [isLogin, setIsLogin] = useState<boolean>(false)
    const [searchKey, setSearchKey] = useState('')

    useEffect(() => {
        const { href } = window.location
        const url = new URL(href)

        // 获取查询字符串
        const queryString = url.search
        if (queryString) {
            toSso(queryString)
        }
    }, [])

    const toSso = async (params) => {
        try {
            const res = await loginConfigs()
            const thirdpartyid = res?.thirdauth?.id || ''
            const { access_token } = await ssoGet(
                `${params}&thirdpartyid=${thirdpartyid}`,
            )
            Cookies.set('af.oauth2_token', access_token, { httpOnly: false })
            setIsLogin(true)
        } catch (error) {
            formatError(error)
            setIsLogin(false)
        }
    }

    const searchRender = () => {
        const placeholder = __('搜索指标名称、编码、描述、信息项')
        return (
            <div
                style={{
                    marginLeft: '16px',
                    width: '275px',
                }}
                ref={searchRef}
            >
                <Tooltip
                    placement="top"
                    title={placeholder}
                    overlayInnerStyle={{
                        width: 'fit-content',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <SearchInput
                        placeholder={placeholder}
                        value={searchKey}
                        onKeyChange={(kw: string) => {
                            handleSearchPressEnter(kw)
                        }}
                        onPressEnter={(e: any) =>
                            handleSearchPressEnter(e.target?.value)
                        }
                        maxLength={255}
                    />
                </Tooltip>
            </div>
        )
    }

    const handleSearchPressEnter = (val?: any) => {
        const value = trim(val)
        setSearchKey(value)
        dataRef?.current?.updFilterCondition(value)
        goBackTop(dataRef?.current?.scrollListId)
    }

    return isLogin ? (
        <ApplicationService
            ref={dataRef}
            searchRender={searchRender}
            searchKey=""
            isOnlyIndicator
        />
    ) : (
        <div />
    )
}

export default DataCatlgIndicator
