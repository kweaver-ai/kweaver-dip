import React, { useState } from 'react'
import { Dropdown } from 'antd'
import { debounce } from 'lodash'
import { EllipsisOutlined, SceneIconColored, FontIcon } from '@/icons'
import styles from './styles.module.less'
import { OperateType, formatTime } from '@/utils'
import __ from './locale'

interface ISceneListCard {
    item: any
    onOperate: (type: OperateType) => void
}

const SceneListCard: React.FC<ISceneListCard> = ({ item, onOperate }) => {
    // 更多按钮的显示隐藏
    const [hidden, setHidden] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)
    // 更多按钮的背景色
    const [bg, setBg] = useState('rgba(0, 0, 0, 0)')
    // 菜单文字样式
    const textStyle = {
        color: 'rgba(0, 0, 0, 0.85)',
        margin: '0 4px',
    }

    const items = [
        {
            key: OperateType.EDIT,
            label: <div style={textStyle}>{__('编辑基本信息')}</div>,
        },
        {
            key: OperateType.DELETE,
            label: <div style={textStyle}>{__('删除')}</div>,
        },
    ]

    const handleMenuClick = ({ key, domEvent }) => {
        domEvent.stopPropagation()
        setMenuOpen(false)
        onOperate(key)
    }

    return (
        <div
            className={styles.sceneListCardWrap}
            onFocus={() => {}}
            onMouseOver={() => {
                setHidden(false)
            }}
            onMouseLeave={() => {
                setHidden(true)
                setBg('rgba(0, 0, 0, 0)')
            }}
            onClick={debounce(() => onOperate(OperateType.PREVIEW), 2000, {
                leading: true,
            })}
        >
            {/* <div className={styles.imageWrapper}>
                <Image
                    className={styles.itemImage}
                    src={item.image || 'error'}
                    fallback={logo6}
                    preview={false}
                />
            </div> */}
            <div className={styles.sac_topWrap}>
                <span className={styles.nameWrap}>
                    <SceneIconColored className={styles.icon} />
                    <span title={item.name} className={styles.name}>
                        {item.name}
                    </span>
                </span>
                <div
                    style={{
                        visibility: menuOpen
                            ? 'visible'
                            : hidden
                            ? 'hidden'
                            : 'visible',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Dropdown
                        menu={{
                            items,
                            onClick: handleMenuClick,
                        }}
                        onOpenChange={(open) => {
                            setMenuOpen(open)
                        }}
                        placement="bottomLeft"
                        trigger={['click']}
                        overlayStyle={{ width: 120 }}
                    >
                        <EllipsisOutlined
                            className={styles.itemMore}
                            style={{
                                background: menuOpen ? 'rgb(0 0 0 / 12%)' : bg,
                            }}
                            onFocus={() => {}}
                            onMouseEnter={() => {
                                setBg('rgb(0 0 0 / 12%)')
                            }}
                            onMouseLeave={() => {
                                setBg('rgba(0, 0, 0, 0)')
                            }}
                        />
                    </Dropdown>
                </div>
            </div>
            <div className={styles.desc}>
                {item.desc ? (
                    <span title={item.desc}>{item.desc}</span>
                ) : (
                    <span style={{ color: 'rgb(0 0 0 / 45%)' }}>
                        {__('[暂无描述]')}
                    </span>
                )}
            </div>
            <div className={styles.detailWrap}>
                {/* <div className={styles.userWrap} title={item?.updated_by}>
                    <span> {item?.updated_by || '--'}</span>
                </div> */}
                <div className={styles.userWrap} title={item?.catalog_name}>
                    <FontIcon name="icon-zidingyileibie-xianxing" />
                    <span> {item?.catalog_name || '--'}</span>
                </div>
                <div
                    title={formatTime(item.updated_at)}
                    className={styles.timeWrap}
                >
                    {__('更新于 ')} {formatTime(item.updated_at)}
                </div>
            </div>
        </div>
    )
}

export default SceneListCard
