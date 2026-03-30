import * as React from 'react'
import { useState, useEffect } from 'react'
import { register } from '@antv/x6-react-shape'
import { message } from 'antd'
import Icon, { CheckCircleFilled } from '@ant-design/icons'
import { useResetState, useUpdateEffect } from 'ahooks'
import { trim, noop } from 'lodash'
import styles from './styles.module.less'
import { IAssemblyLineRoleItem } from '@/core/apis/assemblyLine/index.d'
import { shapeType, hexToRgba } from '../helper'

let callbackColl: any
const TaskNodeComponent = (props: any) => {
    const { node } = props
    const { data } = node
    const { name, total_count, finished_count, status, task_config } = data

    const [percent, setPercent] = useState(
        !total_count || total_count === 0
            ? 0
            : Math.round((finished_count / total_count) * 100),
    )

    // 阴影
    const [shadow, setShadow, resetShadow] = useResetState(
        '0 0 4px 4px transparent',
    )

    const bodyStyle = {
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingRight: '12px',
        borderRadius: '3px',
        boxShadow: shadow,
        background: `linear-gradient(to right,${'#126ee3'.concat(
            '33',
        )} ${percent}%, #fff ${percent}%)`,
    }

    useUpdateEffect(() => {
        setPercent(
            !total_count || total_count === 0
                ? 0
                : Math.round((finished_count / total_count) * 100),
        )
        resetShadow()
    }, [data])

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#fff',
            }}
        >
            <div
                className={styles.customNodeWrapper}
                style={{
                    ...bodyStyle,
                }}
            >
                <div
                    style={{
                        width: 4,
                        height: '100%',
                        borderRadius: '3px 0 0 3px',
                        backgroundColor: `#126ee3`,
                    }}
                />
                {percent === 100 ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '14px',
                            height: '14px',
                            margin: '0 8px',
                            borderRadius: '14px',
                            alignSelf: 'center',
                        }}
                    >
                        <CheckCircleFilled
                            style={{
                                color: '#126ee3',
                                fontSize: '14px',
                                margin: '0 8px',
                            }}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '14px',
                            height: '14px',
                            margin: '0 8px',
                            borderRadius: '14px',
                            alignSelf: 'center',
                            backgroundColor: '#FFF',
                            border: '1px solid #126ee3',
                        }}
                    />
                )}

                <div
                    className={styles.titleWrapper}
                    style={{
                        color: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        width: '32px',
                        height: '100%',
                        flex: '1',
                        // alignItems: 'center',
                        fontSize: '14px',
                        whiteSpace: 'normal',
                        wordBreak: 'break-all',
                    }}
                    title={name}
                >
                    {name}
                </div>
                <div
                    style={{
                        width: '48px',
                        height: '17px',
                        lineHeight: '17px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                    title={`${finished_count}/${total_count}`}
                >
                    {`(${finished_count}/${total_count})`}
                </div>
            </div>
        </div>
    )
}

const TaskNode = (callback?) => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: shapeType.TaskNode,
        effect: ['data'],
        component: TaskNodeComponent,
    })
    return shapeType.TaskNode
}

export default TaskNode
