import { Popover } from 'antd'
import { isArray } from 'lodash'
import styles from './styles.module.less'

export type IConfigPop = {
    title: string
    intro:
        | Array<Array<{ name: string; value: string; list?: string[] }>>
        | string
    children?: any
}

function ConfigPop({ title, intro, children }: IConfigPop) {
    return (
        <Popover
            overlayClassName={styles.pop}
            content={
                <div className={styles.popContent}>
                    <div className={styles.title}>{title}:</div>
                    <div className={styles.intro}>
                        {isArray(intro) ? (
                            (intro || []).map((it, i) => {
                                return (
                                    <div
                                        key={`op-${i}`}
                                        className={styles.tipBlock}
                                    >
                                        {(it || []).map((item) => {
                                            return (
                                                <div key={item.name}>
                                                    <div
                                                        className={
                                                            styles.tipInfo
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.tipName
                                                            }
                                                        >
                                                            {item.name}:
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.tipValue
                                                            }
                                                        >
                                                            {item.value}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.tipInfo
                                                        }
                                                        hidden={
                                                            item.list
                                                                ?.length === 0
                                                        }
                                                    >
                                                        {item.list?.map(
                                                            (
                                                                tip: string,
                                                                j: number,
                                                            ) => (
                                                                <div
                                                                    className={
                                                                        styles.tipValue
                                                                    }
                                                                >
                                                                    ({j + 1})
                                                                    {tip}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })
                        ) : (
                            <div className={styles.tipBlock}>
                                <div className={styles.tipInfo}>
                                    <div className={styles.tipValue}>
                                        {intro}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            }
            placement="right"
        >
            {children || '--'}
        </Popover>
    )
}

export default ConfigPop
