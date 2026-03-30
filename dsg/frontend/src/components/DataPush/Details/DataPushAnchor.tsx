import { Anchor } from 'antd'
import { FC } from 'react'
import styles from './styles.module.less'
import { anchorConfig } from './helper'

interface IDataPushAnchor {
    container?: any
}

/**
 * 数据推送详情锚点
 */
const DataPushAnchor: FC<IDataPushAnchor> = ({ container }) => {
    const { Link } = Anchor

    return (
        <div className={styles.dataPushAnchor}>
            <Anchor
                targetOffset={16}
                getContainer={() =>
                    (container.current as HTMLElement) || window
                }
                onClick={(e: any) => e.preventDefault()}
                className={styles.anchorWrapper}
            >
                {anchorConfig.map((item) => (
                    <Link
                        href={`#${item.key}`}
                        title={item.title}
                        key={item.key}
                    >
                        {item.children?.map((subItem) => (
                            <Link
                                href={`#${subItem.key}`}
                                title={subItem.title}
                                key={subItem.key}
                            />
                        ))}
                    </Link>
                ))}
            </Anchor>
        </div>
    )
}
export default DataPushAnchor
