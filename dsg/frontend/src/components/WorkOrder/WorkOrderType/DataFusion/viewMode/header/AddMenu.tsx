import { QuestionCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import styles from './styles.module.less'
import { FormulaType } from '../const'
import Icons from '../Icons'
import { useViewGraphContext } from '../ViewGraphProvider'

interface MenuItem {
    label: string
    key: FormulaType
    desc: string
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
    const { onStartDrag } = useViewGraphContext()

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
                                        // onClick={() => {
                                        //     handleOperate(menu.key)
                                        // }}
                                        onMouseDown={(e) => {
                                            onStartDrag?.(e, menu.key)
                                            handleOperate(menu.key)
                                        }}
                                    >
                                        <Icons type={menu.key} colored />
                                        <span className={styles.addMenuName}>
                                            {menu.label}
                                        </span>
                                        <Tooltip title={menu.desc}>
                                            <QuestionCircleOutlined
                                                style={{
                                                    fontSize: 14,
                                                    color: 'rgba(0,0,0,0.45)',
                                                    marginLeft: 4,
                                                    marginRight: 8,
                                                }}
                                            />
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
