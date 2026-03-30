import { useRef, useState } from 'react'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getPlatformPrefix, ErrorInfo, useQuery } from '@/utils'
import BusinessActivityGraph from './BusinessActivityGraph'
import GraphToolBar from './GraphToolBar'
import MindMapData from './MindMapData'
import {
    formatError,
    messageError,
    updateBusinessObjDefine,
    LoginEntity,
    RefInfo,
} from '@/core'

import { NodeType } from './const'
import __ from './locale'

const DefineBusinessObj = () => {
    const ref: any = useRef()
    const query = useQuery()
    const objId = query.get('objId')
    const [loading, setLoading] = useState(false)
    const navigator = useNavigate()

    const saveGraphData = async () => {
        // 画布中有编辑的名字 且为重名时不能保存
        const canSaveInfo = ref.current?.isCanSaveInfo

        let errorInfo = ''
        Object.keys(canSaveInfo).forEach((key) => {
            if (canSaveInfo[key]) {
                errorInfo = canSaveInfo[key]
            }
        })
        if (errorInfo) {
            // 画布中不合法的名称有报错文案，更新时不进行操作
            if (errorInfo === ErrorInfo.ONLYSUP) {
                return
            }
            message.error(errorInfo)
            return
        }
        setLoading(true)
        const data = ref.current?.totalData
        const logic_entities: LoginEntity[] = []
        const ref_id: RefInfo[] = []
        data?.children?.forEach((item) => {
            if (item.nodeType === NodeType.LogicEntity) {
                logic_entities.push({
                    id: item.dataInfo.id,
                    name: item.dataInfo.name,
                    snowflake_id: item.dataInfo.snowflake_id,
                    attributes: [
                        ...(item.children || []).map((attr) => {
                            return {
                                ...attr.dataInfo,
                                standard_id:
                                    attr.dataInfo?.standard_info?.id ||
                                    undefined,
                                standard_info: undefined,
                            }
                        }),
                    ],
                })
            } else if (item.nodeType === NodeType.ReferenceNode) {
                // 选择时的id是content_id  || 编辑后为id
                ref_id.push(item.dataInfo.content_id || item.dataInfo.id)
            }
        })

        if (!objId) return
        if (logic_entities.length === 0) {
            messageError(__('请至少新建一个逻辑实体'))
            setLoading(false)
            return
        }
        if (logic_entities.find((logic) => logic.attributes.length === 0)) {
            messageError(__('每一个逻辑实体至少添加一个属性'))
            setLoading(false)
            return
        }
        const entityNameArr: string[] = []
        logic_entities.forEach((logic) => {
            if (!logic.attributes.find((attr) => attr.unique)) {
                entityNameArr.push(logic.name)
            }
        })
        // if (entityNameArr.length > 0) {
        //     message.error(
        //         __('请设置逻辑实体${name}中属性的唯一标识', {
        //             name: entityNameArr.join('、'),
        //         }),
        //     )
        //     setLoading(false)
        //     return
        // }
        try {
            await updateBusinessObjDefine({
                id: objId,
                logic_entities,
                ref_id,
            })
            message.success(__('保存成功'))
            const platform = getPlatformPrefix()
            navigator(
                platform === '/cd'
                    ? '/dataLevelManage/recognitionRules'
                    : '/standards/business-domain',
            )
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <GraphToolBar
                onSaveGraph={saveGraphData}
                loading={loading}
                isUpdate={ref.current?.isUpdate}
            />
            <div style={{ height: 'calc(100% - 52px)', width: '100%' }}>
                <BusinessActivityGraph
                    toolBarPosition="topCenter"
                    mode="edit"
                    ref={ref}
                />
            </div>
        </div>
    )
}

export default DefineBusinessObj
