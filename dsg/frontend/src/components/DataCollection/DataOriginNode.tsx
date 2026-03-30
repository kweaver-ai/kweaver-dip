import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { ConfigProvider } from 'antd'
import classnames from 'classnames'
import { BusinessSystemColored, DeleteColored } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { ViewModel } from './const'

let callbackColl: any = []

const DataOriginNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const [showDelete, setShowDelete] = useState<boolean>(false)
    const [editStatus, setEditStatus] = useState<boolean>(false)

    useEffect(() => {
        const model = callbackColl[3]()
        setEditStatus(model === ViewModel.ModelEdit && data.editStatus)
    }, [data])

    return (
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={styles.dataOriginContent}
                onFocus={() => 0}
                onBlur={() => 0}
                onMouseOver={() => {
                    setShowDelete(true)
                }}
                onMouseLeave={() => {
                    setShowDelete(false)
                }}
            >
                {showDelete && editStatus ? (
                    <div
                        className={styles.delete}
                        onClick={(e) => {
                            const setDeleteNode = callbackColl[1]()
                            setDeleteNode(node)
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                    >
                        <DeleteColored />
                    </div>
                ) : null}
                <div className={styles.pictureBox}>
                    <BusinessSystemColored className={styles.icon} />
                </div>
                <div
                    className={classnames(
                        styles.text,
                        editStatus ? styles.textEditable : '',
                    )}
                    onClick={(e) => {
                        if (editStatus) {
                            const setEditNode = callbackColl[2]()
                            setEditNode(node)
                        }
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    {data.dataInfo.name}
                </div>
            </div>
        </ConfigProvider>
    )
}

const dataOriginNode = (callback?: any) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: 'data-origin-node',
        effect: ['data'],
        component: DataOriginNodeComponent,
    })
    return 'data-origin-node'
}

export default dataOriginNode
