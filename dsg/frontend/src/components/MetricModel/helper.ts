import { Node } from '@antv/x6'
import { checkNumberRanage, ExpandStatus } from '../FormGraph/helper'
import { NodeAttribute } from './const'
import __ from './locale'

const defaultPorts = {
    groups: {
        leftPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#5F95FF',
                    fill: '#ffffff',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'IFormItemLeftPosition',
            zIndex: 99,
        },
        rightPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#5F95FF',
                    fill: '#ffffff',
                    magnet: true,
                    zIndex: 10,
                },
            },
            position: 'IFormItemRightPosition',
            zIndex: 99,
        },
    },
}

const viewPorts = {
    groups: {
        leftPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#5F95FF',
                    fill: '#999999',
                    magnet: true,
                    zIndex: 99,
                },
            },
            position: 'IFormItemLeftPosition',
            zIndex: 99,
        },
        rightPorts: {
            markup: [
                {
                    tagName: 'circle',
                    selector: 'portBody',
                },
            ],
            attrs: {
                portBody: {
                    r: 4,
                    strokeWidth: 1,
                    stroke: '#5F95FF',
                    fill: '#999999',
                    magnet: true,
                    zIndex: 99,
                },
            },
            position: 'IFormItemRightPosition',
            zIndex: 99,
        },
    },
}

const FormBusinessNodeTemplate = {
    shape: 'table-business-node',
    width: 400,
    height: 696,
    ports: defaultPorts,
    position: {
        x: 600,
        y: 100,
    },
    data: {
        items: [],
        type: 'business',
        expand: ExpandStatus.Expand,
        uniqueCount: 0,
        offset: 0,
        singleSelectedId: '',
        fid: '',
        mid: '',
        editStatus: false,
        keyWord: '',
        switchStatus: false,
        formInfo: null,
        formAttr: NodeAttribute.InForm,
        errorDataIds: [],
        relationData: {},
    },
    zIndex: 99,
}

/**
 * 计算生成桩的位置
 */
const getPortByNode = (
    group: string,
    index,
    site: string = '',
    expand: ExpandStatus = ExpandStatus.Expand,
    type: 'field' | 'form' = 'field',
    length: number = 10,
) => {
    return {
        group,
        label: {},
        args: {
            index,
            site,
            expand,
            type,
            length,
        },
        zIndex: 99,
    }
}

/**
 * 计算新增节点坐标
 * @param nodes 所有阶段
 * @param center?  { x: number; y: number } 中心位置
 * @param prePosition? any 前一个位置记录
 * @returns 返回坐标
 */
const getNewPastePosition = (
    nodes: Array<Node>,
    center: { x: number; y: number },
    prePosition?: any,
) => {
    if (prePosition) {
        return {
            x: prePosition.x + 50,
            y: prePosition.y + 50,
        }
    }
    const centerNode = nodes.filter((n) => {
        const { x, y } = n.getPosition()
        return x === center.x && y === center.y
    })
    if (!nodes.length || centerNode.length === 0) {
        return {
            x: center.x,
            y: center.y,
        }
    }
    const lastNodePos = getCenterLastNode(nodes, center)
    return {
        x: lastNodePos.x + 50,
        y: lastNodePos.y + 50,
    }
}

/**
 * 获取中心列的最后一个节点位置
 * @param nodes 所有节点
 * @parma center 中心位置
 * @returns 最后一个的位置
 */
const getCenterLastNode = (
    nodes: Array<Node>,
    center: any,
): { x: number; y: number } => {
    return nodes
        .map((n) => {
            const { x, y } = n.getPosition()
            return { x, y }
        })
        .filter((pos) => {
            return pos.x === center.x
        })
        .reduce((prePos, curPos) => {
            return curPos.y > prePos.y ? curPos : prePos
        }, center)
}

/**
 * 获取搜索字段
 */
const searchFieldData = (data: Array<any>, searchKey: string) => {
    if (searchKey) {
        const searchData = data.filter((item) => {
            if (item.name_en) {
                return item.name_en.includes(searchKey)
            }
            return item.name.includes(searchKey)
        })
        return searchData
    }
    return data
}

/**
 * 检查当前表是否还被其他表引用
 */
const checkCurrentFormOutFields = (outForm: Node, inForms: Array<Node>) => {
    if (inForms.length) {
        const existField = outForm.data.items.find((field) =>
            inForms.find((inform) =>
                inform.data.relationData.relations.find(
                    (relation) => relation.src_field === field.id,
                ),
            ),
        )
        return !!existField
    }
    return false
}

export {
    FormBusinessNodeTemplate,
    getNewPastePosition,
    searchFieldData,
    checkCurrentFormOutFields,
    defaultPorts,
    viewPorts,
}
