import { useEffect, useState } from 'react'
import { Input, message } from 'antd'
import { debounce, trim } from 'lodash'
import { SearchOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import icons from './requireIcons'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import { highLight } from '../ResourcesDir/const'

const ViewIcon = () => {
    const [iconList, setIconList] = useState<any[]>(icons)
    const [searchVal, setSearchVal] = useState<string>('')

    useEffect(() => {
        setIconList(
            searchVal
                ? icons.filter(
                      (item) =>
                          item.name
                              .toLocaleLowerCase()
                              .indexOf(searchVal.toLocaleLowerCase()) > -1,
                  )
                : icons,
        )
    }, [searchVal])

    const copyToClipboard = (str: string) => {
        return navigator?.clipboard?.writeText(str).catch((err) => {
            const el = document.createElement('textarea')
            el.value = str
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
        })
    }

    return (
        <div className={styles.modelingWrapper}>
            <div className={styles.title}>
                <div>
                    {__('icon预览')}
                    {`(${icons.length}${__('个图标组件')})`}
                </div>
                <Input
                    placeholder={__('搜索图标名称')}
                    onChange={debounce(
                        (e) => {
                            setSearchVal(trim(e.target.value))
                        },
                        500,
                        { leading: false },
                    )}
                    allowClear
                    prefix={<SearchOutlined />}
                    className={styles.searchInput}
                    style={{ width: 272 }}
                    maxLength={128}
                />
            </div>
            <div className={styles.iconWrapper}>
                {iconList.length > 0 ? (
                    iconList
                        .filter((it) => it.name !== 'FontIcon')
                        .map((item, index) => {
                            return (
                                <div
                                    key={index}
                                    className={styles.iconBox}
                                    onClick={() => {
                                        copyToClipboard(item.name)
                                        message.success(
                                            `${item.name} ${__('复制成功')}`,
                                        )
                                    }}
                                >
                                    <div className={styles.icon}>
                                        {item.content()}
                                    </div>
                                    <div className={styles.iconName}>
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: highLight(
                                                    item.name,
                                                    searchVal,
                                                    'dirHighLight',
                                                ),
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })
                ) : (
                    <div className={styles.emptyBox}>
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default ViewIcon
