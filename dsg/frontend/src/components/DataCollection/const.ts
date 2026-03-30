const enum addFormType {
    FormData = 'formdata',
    DataSource = 'datasource',
}

const enum PasteSourceChecked {
    // 新建表
    New = 'new',

    // 已新建
    Created = 'created',

    // 来自于元数据平台
    FromDW = 'fromDw',

    // 已采集的元数据平台
    DwExisted = 'DwExisted',
}

const enum ViewModel {
    // 建模人员编辑
    ModelEdit = 'ModelEdit',

    // 建模人员预览
    ModelView = 'ModelView',

    // 采集人员
    Collect = 'Collect',
}

export { addFormType, PasteSourceChecked, ViewModel }
