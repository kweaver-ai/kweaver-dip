export const ItemTypes = 'DraggableBodyRow'

export enum OperateType {
    ADD = 'add',
    EDIT = 'edit',
    CREATE = 'create',
    DELETE = 'delete',
    DETAIL = 'detail',
    MOVE = 'move',
    MOVEUP = 'move_up',
    MOVEDOWN = 'move_down',
}
// 操作类型
export const optionsTyps = {
    didDrop: 'didDrop', // 拖拽出区域
    hover: 'hover',
    drop: 'drop', // 放置
}

// 数据类型
export const dataType = {
    group: 'group',
    child: 'child',
}

export const findFromData = (data, id) => {
    let row
    let index
    let parentIndex
    data.forEach((item, i) => {
        // 父节点拖拽
        if (item.id === id) {
            row = item
            index = i
            parentIndex = null
        }

        // 子节点拖拽
        const ele = item.children || []
        ele.forEach((it, j) => {
            if (it.id === id) {
                row = it
                index = j
                parentIndex = i
            }
        })
    })

    return {
        row,
        index,
        parentIndex,
    }
}
