import { useEffect, useMemo, useState } from 'react'
import { set, trim } from 'lodash'
import { InfoCircleOutlined } from '@ant-design/icons'
import { Empty, SearchInput } from '@/ui'
import {
    formatError,
    getAppsList,
    getAppsListByDataOwner,
    getIntegratedAppList,
} from '@/core'
import { SearchItem } from './VisitorTree'
import styles from './styles.module.less'
import __ from '../../locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const VisitorApplicationList = ({ applyMode = false }: any) => {
    const [appData, setAppData] = useState<Array<any>>([])
    const [searchKey, setSearchKey] = useState<string>('')
    const { checkPermission } = useUserPermCtx()
    const isDataOwner = useMemo(
        () => checkPermission('manageDataResourceAuthorization'),
        [checkPermission],
    )
    const [visitorAllApps, setVisitorAllApps] = useState<any[]>([])

    useEffect(() => {
        getApplications(searchKey)
    }, [searchKey])

    useEffect(() => {
        if (!applyMode) {
            getApplicationsByOwner()
        }
    }, [applyMode])

    /**
     * 根据所有者获取应用程序列表
     *
     * 此函数尝试获取由当前用户拥有的所有应用程序如果当前用户是数据的所有者，
     * 则调用另一个函数从服务器获取应用程序列表，并将结果设置到状态变量中
     * 如果发生错误，则格式化错误信息
     */
    const getApplicationsByOwner = async () => {
        try {
            // 检查当前用户是否为数据所有者
            if (isDataOwner) {
                // 如果是数据所有者，获取其应用程序列表
                // const res = await getAppsListByDataOwner()
                const res = await getIntegratedAppList()
                setVisitorAllApps(res.entries)
                setAppData(res.entries)
            }
        } catch (err) {
            // 格式化并处理错误
            formatError(err)
        }
    }
    /**
     * 异步函数getApplications用于根据关键词kw获取应用程序列表
     * @param kw 搜索关键词，用于过滤应用程序列表
     */
    const getApplications = async (kw) => {
        try {
            // 如果处于应用模式
            if (applyMode) {
                // 调用getAppsList方法获取应用程序列表，带有分页参数
                const res = await getAppsList({
                    keyword: kw,
                    limit: 999,
                    offset: 1,
                })
                // 筛选列表中account_id非空的项，并更新应用数据
                setAppData(res.entries.filter((item) => item?.account_id))
            } else {
                // 否则，从visitorAllApps中筛选名称包含kw的应用，并更新数据
                setAppData(
                    visitorAllApps.filter((current) =>
                        current.name
                            .toUpperCase()
                            .includes(trim(kw).toUpperCase()),
                    ),
                )
            }
        } catch (err) {
            // 如果发生错误，调用formatError方法处理错误
            formatError(err)
        }
    }

    return (
        <div className={styles.applicationVisitorContainer}>
            {!appData?.length && !searchKey ? (
                <div className={styles.emptyWrapper}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            ) : (
                <>
                    <div className={styles.searchWrapper}>
                        <SearchInput
                            onKeyChange={(keyword) => {
                                setSearchKey(keyword)
                            }}
                            placeholder={__('搜索应用账户')}
                        />
                    </div>
                    {applyMode && (
                        <div className={styles.titleTip}>
                            {__('只能选择您可管理的集成应用：')}
                        </div>
                    )}

                    <div
                        className={
                            applyMode
                                ? styles.listApplyWrapper
                                : styles.listWrapper
                        }
                    >
                        {appData.length ? (
                            <div>
                                {appData.map((item) => {
                                    return (
                                        <SearchItem
                                            data={{ ...item, type: 'app' }}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <Empty />
                        )}
                    </div>
                </>
            )}

            <div className={styles.description}>
                <InfoCircleOutlined style={{ fontSize: 14, marginRight: 8 }} />
                {__('开发者通过应用账户认证后，可查询或调用资源。')}
            </div>
        </div>
    )
}
export default VisitorApplicationList
