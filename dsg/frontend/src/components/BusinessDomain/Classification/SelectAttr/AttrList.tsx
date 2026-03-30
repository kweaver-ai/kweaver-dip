import { FC, useEffect, useState } from 'react'
import { useSafeState } from 'ahooks'
import classnames from 'classnames'
import __ from '../../locale'
import styles from './styles.module.less'
import { useSelectAttrContext } from './SelectAttrProvider'
import { formatError, getAttributesByParentId } from '@/core'
import { Loader } from '@/ui'
import { FontIcon } from '@/icons'
import { useClassificationContext } from '../ClassificationProvider'

interface AttrListProps {
    value?: string
    onSelect: (value: string) => void
    parentId: string
}
const AttrList: FC<AttrListProps> = ({ value, onSelect, parentId }) => {
    const [data, setData] = useSafeState<any[]>([])
    // 是否加载中
    const [isLoading, setIsLoading] = useSafeState(false)
    // 已加载的节点
    const [loadedKeys, setLoadedKeys] = useSafeState<string[]>([])
    // 所有选项
    const { setAllOptions, allAttributes } = useSelectAttrContext()

    const { selectedAttribute } = useClassificationContext()

    const [isEmpty, setIsEmpty] = useState<boolean>(false)

    useEffect(() => {
        setIsLoading(true)
        if (allAttributes.length > 0 && !parentId) {
            setData(allAttributes)
            setIsLoading(false)
        } else {
            getData(parentId)
        }
    }, [parentId])

    /**
     * 获取分类属性
     * @param id 父级id
     */
    const getData = async (id: string) => {
        try {
            setIsLoading(true)
            const res = await getAttributesByParentId({
                parent_id: id,
            })
            setData(
                res.attributes.filter(
                    (item) => item.id !== selectedAttribute.id,
                ),
            )
        } catch (error) {
            formatError(error)
        } finally {
            setIsLoading(false)
        }
    }

    return isEmpty ? (
        <div className={styles.treeSelectEmptyWrapper}>{__('暂无数据')}</div>
    ) : isLoading ? (
        <div className={styles.treeSelectEmptyWrapper}>
            <Loader />
        </div>
    ) : (
        <div className={styles.treeContainerWrapper}>
            <div className={styles.title}>{__('分类属性')}</div>
            <div className={styles.treeWrapper}>
                {data.map((item) => (
                    <div
                        className={classnames({
                            [styles.treeItem]: true,
                            [styles.selectedTreeItem]: value === item.id,
                        })}
                        onClick={() => {
                            onSelect(item.id)
                            setAllOptions(data)
                        }}
                    >
                        <div className={styles.iconWrapper}>
                            <FontIcon
                                name="icon-shuxing"
                                style={{
                                    fontSize: 20,
                                    color: 'rgba(245, 137, 13, 1)',
                                }}
                            />
                        </div>
                        <div className={styles.nameWrapper}>
                            <span className={styles.name} title={item.name}>
                                {item.name}
                            </span>
                            <span
                                className={styles.text}
                                title={item.path_name}
                            >
                                {item.path_name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AttrList
