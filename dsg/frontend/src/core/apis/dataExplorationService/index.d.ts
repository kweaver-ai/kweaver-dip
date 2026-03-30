export interface IGetConfigRule {
    level?: number
}
export interface IExecuteProjectsConfigRule {
    task_ids: string[]
}
export interface IGetDatasourceExplorationStatus {
    schema: string
    ve_catalog: string
}
