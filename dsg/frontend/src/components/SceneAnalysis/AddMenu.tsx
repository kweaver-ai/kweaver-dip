import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { FormulaType } from './const'

interface MenuItem {
    label: string
    key: FormulaType
    desc: string
    icon: string
}

export interface MenuProps {
    items: Array<{
        title: string
        menus: Array<MenuItem>
    }>
    handleOperate: (item: FormulaType) => void
}

const AddMenu = (props: MenuProps) => {
    const { items, handleOperate } = props

    return (
        <div className={styles.addMenuWrapper}>
            {items.map((item) => {
                return (
                    <div key={item.title} className={styles.addMenuItem}>
                        <div className={styles.addMenuTitle}>{item.title}</div>
                        <div className={styles.addMenuList}>
                            {item.menus.map((menu) => {
                                return (
                                    <div
                                        key={menu.key}
                                        className={styles.addMenuListItem}
                                        onClick={() => {
                                            handleOperate(menu.key)
                                        }}
                                    >
                                        <FontIcon
                                            type={IconType.COLOREDICON}
                                            name={menu.icon}
                                            className={styles.addMenuIcon}
                                        />
                                        <span>{menu.label}</span>
                                        <Tooltip title={menu.desc}>
                                            <QuestionCircleOutlined />
                                        </Tooltip>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default AddMenu
