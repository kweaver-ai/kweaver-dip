import { Node } from '@antv/x6'
import { checkNumberRanage, ExpandStatus } from '../FormGraph/helper'
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
            position: 'formItemLeftPosition',
            zIndex: 10,
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
            position: 'formItemRightPosition',
            zIndex: 10,
        },
    },
}

const defaultOriginPorts = {
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
                    zIndex: 10,
                },
            },
            position: 'defaultOriginLeftPosition',
            zIndex: 10,
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
                    zIndex: 10,
                },
            },
            position: 'defaultOriginRightPosition',
            zIndex: 10,
        },
    },
}

const FormOriginNodeTemplate = {
    shape: 'table-origin-node',
    width: 400,
    height: 696,
    ports: defaultPorts,
    position: {
        x: 100,
        y: 100,
    },
    data: {
        items: [],
        type: 'origin',
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
        errorFieldsId: [],
    },
    zIndex: 9999,
}

const FormPasteSourceTemplate = {
    shape: 'table-paste-node',
    width: 400,
    height: 52,
    ports: defaultPorts,
    position: {
        x: 100,
        y: 100,
    },
    data: {
        items: [],
        type: 'pasteSource',
        expand: ExpandStatus.Expand,
        offset: 0,
        infoId: '',
        singleSelectedId: '',
        fid: '',
        mid: '',
        editStatus: false,
        keyWord: '',
        switchStatus: false,
        formInfo: null,
        errorStatus: false,
        version: 'draft',
    },
    zIndex: 9999,
}

const DataOriginTemplate = {
    shape: 'data-origin-node',
    width: 110,
    height: 110,
    ports: defaultOriginPorts,
    position: {
        x: 50,
        y: 50,
    },
    data: {
        type: 'dataOrigin',
        dataInfo: null,
        editStatus: false,
    },
    zIndex: 9999,
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
        zIndex: 10,
    }
}

const getDataLengthValidate = (dataType: string) => {
    switch (dataType) {
        case 'char':
            return [
                {
                    validateTrigger: ['onBlur'],
                    validator: (e, value) =>
                        checkNumberRanage(
                            e,
                            value,
                            {
                                max: 255,
                                min: 1,
                            },
                            __('仅支持 ${min}~${max} 之间的整数', {
                                min: 1,
                                max: 255,
                            }),
                        ),
                },
            ]
        case 'binary':
            return [
                {
                    validateTrigger: ['onBlur'],
                    validator: (e, value) => {
                        if (value === null) {
                            return Promise.resolve()
                        }
                        return checkNumberRanage(
                            e,
                            value,
                            {
                                max: 65535,
                                min: 1,
                            },
                            __('仅支持 ${min}~${max} 之间的整数', {
                                min: 1,
                                max: 65535,
                            }),
                        )
                    },
                },
            ]
        case 'varchar':
            return [
                {
                    validateTrigger: ['onBlur'],
                    validator: (e, value) =>
                        checkNumberRanage(
                            e,
                            value,
                            {
                                max: 65535,
                                min: 1,
                            },
                            __('仅支持 ${min}~${max} 之间的整数', {
                                min: 1,
                                max: 65535,
                            }),
                        ),
                },
            ]
        case 'decimal':
            return [
                {
                    validateTrigger: ['onBlur'],
                    validator: (e, value) =>
                        checkNumberRanage(
                            e,
                            value,
                            {
                                max: 38,
                                min: 1,
                            },
                            __('仅支持 ${min}~${max} 之间的整数', {
                                min: 1,
                                max: 38,
                            }),
                        ),
                },
            ]
        default:
            return []
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

export {
    FormOriginNodeTemplate,
    FormPasteSourceTemplate,
    DataOriginTemplate,
    getPortByNode,
    getDataLengthValidate,
    getNewPastePosition,
}
