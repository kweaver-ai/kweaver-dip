import { WorkflowGeneralProps, WorkflowManageFrontApp } from '@/registryApp'
/**
 * workflow 信息，手动挂载使用
 */
export const workflowPluginInfo = {
    name: `${WorkflowManageFrontApp.name}_widget`,
    entry: WorkflowManageFrontApp.entry,
}

/**
 * 获取插件所需常规参数
 */
export function getGeneralProps() {
    return WorkflowGeneralProps
}
