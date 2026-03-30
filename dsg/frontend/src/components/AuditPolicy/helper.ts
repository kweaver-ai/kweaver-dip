// 根据类型获取绑定的审核流程列表
export const getSelectedProcess = (items, type) => {
    return items?.filter((item) => item?.audit_type === type)
}
