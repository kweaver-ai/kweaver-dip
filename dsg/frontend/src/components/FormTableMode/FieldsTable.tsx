import {
    FC,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { noop } from 'lodash'
import {
    StandardDataDetail,
    ViewModel,
    eradicateUniqueId,
    produceUniqueId,
} from './const'
import { IFormEnumConfigModel, IGradeLabel, formsEnumConfig } from '@/core'
import __ from './locale'
import ViewFieldsTable from './ViewFieldsTable'
import EditFieldsTable from './EditFieldsTable'
import { FormTableKind, NewFormType } from '../Forms/const'

interface IEditField {
    ref: any
    model: ViewModel
    initFields: Array<any>
    taskId: string
    formInfo: any
    // 标准规则详情Map
    standardRuleDetail: StandardDataDetail
    updateSaveBtn?: (status: boolean) => void
    onSave: (values: any) => Promise<void>
    formType: NewFormType
    isStart: boolean
    tagData: IGradeLabel[]
    initDepartmentId?: string
}

const FieldsTable: FC<IEditField> = forwardRef(
    (
        {
            model,
            initFields,
            taskId,
            formInfo,
            standardRuleDetail,
            updateSaveBtn = noop,
            onSave,
            formType,
            isStart,
            tagData,
            initDepartmentId,
        }: Omit<IEditField, 'ref'>,
        ref,
    ) => {
        const [fields, setFields] = useState<Array<any>>([])
        // 字段信息的相关的后端枚举映射
        const [dataEnumOptions, setDataEnumOptions] =
            useState<IFormEnumConfigModel | null>(null)

        // 获取编辑表的类型
        const editTableRef: any = useRef()

        // 更新表格
        useEffect(() => {
            setFields(
                formType === NewFormType.BLANK
                    ? initFields
                    : produceUniqueId(initFields),
            )
        }, [initFields])

        /**
         * 获取默认的枚举类型
         */
        useEffect(() => {
            getEnumConfig()
        }, [])

        useImperativeHandle(ref, () => ({
            onSave: editTableRef?.current?.onSave,
            getFields: () => {
                if (model === ViewModel.Edit) {
                    return eradicateUniqueId(
                        editTableRef?.current?.getFields() || [],
                    )
                }
                return fields
            },
            validateFields: editTableRef?.current?.validateFields,
        }))

        /**
         * 获取服务枚举类型
         */
        const getEnumConfig = async () => {
            const enumConfig = await formsEnumConfig()
            setDataEnumOptions(enumConfig)
        }
        return model === ViewModel.Edit ? (
            <EditFieldsTable
                ref={editTableRef}
                fields={fields}
                dataEnumOptions={dataEnumOptions}
                taskId={taskId}
                formInfo={formInfo}
                standardRuleDetail={standardRuleDetail}
                updateSaveBtn={updateSaveBtn}
                onSave={onSave}
                formType={formType}
                isStart={isStart}
                tagData={tagData}
                initDepartmentId={initDepartmentId}
            />
        ) : (
            <ViewFieldsTable
                fields={fields}
                formType={formInfo?.table_kind || FormTableKind.BUSINESS}
                dataEnumOptions={dataEnumOptions}
                standardRuleDetail={standardRuleDetail}
            />
        )
    },
)

export default FieldsTable
