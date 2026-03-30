import { Tooltip } from 'antd'
import { noop, union } from 'lodash'
import { changeArrayToObject, NodeType } from '@/core/consanguinity'
import { NodeDataType } from '@/core/consanguinity/index.d'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { DataColoredBaseIcon } from '@/core/dataSource'
import { FieldTypeIcon } from '@/core'
import __ from './locale'

/**
 * 获取数据表图标
 * @param dataSourceType 数据源类型
 * @returns
 */
const getDataFormIcon = (dataSourceType: string) => {
    switch (dataSourceType) {
        case NodeType.CUSTOM_VIEW:
        case NodeType.LOGIC_VIEW:
        case NodeType.FORM_VIEW:
            return (
                <FontIcon
                    name="icon-shujubiaoshitu"
                    type={IconType.COLOREDICON}
                />
            )
        case NodeType.DATA_TABLE:
            return (
                <FontIcon name="icon-shujubiao" type={IconType.COLOREDICON} />
            )
        default:
            return null
    }
}

interface FormTitleLabelProps {
    name: string
    dataSourceType?: string
    dataSourceName?: string
    type: string
    // onSelectForm: () => void
}
/**
 * 表单标题标签
 * @param name 名称
 * @param rawName 原始名称
 * @returns
 */
export const FormTitleLabel = ({
    name,
    type,
    dataSourceType,
    dataSourceName,
}: // onSelectForm = noop,
FormTitleLabelProps) => {
    return (
        <div className={styles.formTitleLabel}>
            <div className={styles.titleIcon}>{getDataFormIcon(type)}</div>
            <div className={styles.titleContent}>
                <div
                    className={styles.name}
                    title={name}
                    // onClick={() => {
                    //     onSelectForm()
                    // }}
                >
                    <span>{name}</span>
                </div>
                {dataSourceName && dataSourceType && (
                    <div className={styles.dataSourceWrapper}>
                        <span className={styles.sourceIcon}>
                            <DataColoredBaseIcon
                                type={dataSourceType}
                                iconType="Colored"
                            />
                        </span>
                        <span
                            className={styles.dataSourceName}
                            title={dataSourceName}
                        >
                            {dataSourceName}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

interface FieldTitleLabelProps {
    name: string
    name_en: string
    type: string
    primaryKey: string
    showEn?: boolean
    // onSelectField: () => void
}
/**
 * 字段标题标签
 * @param name 名称
 * @param name_en 英文名称
 * @param type 类型
 * @returns
 */
export const FieldTitleLabel = ({
    name,
    name_en,
    type,
    primaryKey,
    showEn = true,
}: // onSelectField = noop,
FieldTitleLabelProps) => {
    return (
        <div className={styles.fieldTitleLabel}>
            <div className={styles.fieldContent}>
                <div
                    className={styles.nameText}
                    // onClick={() => {
                    //     onSelectField()
                    // }}
                >
                    <div className={styles.nameIcon}>
                        <FieldTypeIcon
                            dataType={type}
                            style={{
                                fontSize: 12,
                            }}
                            title={type}
                        />
                    </div>
                    <div className={styles.name} title={name}>
                        <span>{name}</span>
                    </div>
                </div>
                {showEn && (
                    <div className={styles.nameEnText}>
                        <span>{name_en}</span>
                    </div>
                )}
            </div>
            {primaryKey === '1' && (
                <div className={styles.mainKey}>{__('主键')}</div>
            )}
        </div>
    )
}

/**
 * 将数据转换为图谱数据
 * @param data
 * @returns
 */
export const changeDataToGraphData = (
    data: Array<any>,
    // selectedField: (field: any) => void,
    // selectedTable: (table: any) => void,
): Array<NodeDataType> => {
    return data.map((item) => {
        const formProps = changeArrayToObject(item.props)
        return {
            ...item,
            id: item.vid,
            parentNodeId:
                union(
                    item?.relation?.map(
                        (relation) => relation.parent_shell_vid,
                    ),
                ) || [],
            ...formProps,
            label: (
                <FormTitleLabel
                    name={item.name}
                    type={item.node_type}
                    dataSourceName={formProps?.datasource_name || ''}
                    dataSourceType={formProps?.catalog_type || ''}
                    // onSelectForm={() => {
                    //     selectedTable({
                    //         ...item,
                    //         ...formProps,
                    //     })
                    // }}
                />
            ),
            type: item.node_type,
            fields: item.column.map((field) => {
                const fieldProps = changeArrayToObject(field.props)
                const expression = item?.relation?.find(
                    (relation) => relation.vid === field.vid,
                )?.expression

                return {
                    id: field.vid,
                    label: (
                        <FieldTitleLabel
                            name={
                                item.node_type === NodeType.DATA_TABLE
                                    ? field.raw_name
                                    : field.name
                            }
                            name_en={field?.raw_name}
                            type={fieldProps?.data_type}
                            primaryKey={fieldProps?.primary_key}
                            showEn={[
                                NodeType.CUSTOM_VIEW,
                                NodeType.LOGIC_VIEW,
                                NodeType.FORM_VIEW,
                            ].includes(item.node_type)}
                            // onSelectField={() => {
                            //     selectedField({
                            //         ...fieldProps,
                            //         ...field,
                            //     })
                            // }}
                        />
                    ),
                    tool: expression
                        ? {
                              left: {
                                  label: (
                                      <Tooltip
                                          title={
                                              <div
                                                  className={
                                                      styles.expressToolTipWrapper
                                                  }
                                              >
                                                  <div className={styles.title}>
                                                      {__('字段口径解析')}
                                                  </div>
                                                  <div
                                                      className={styles.content}
                                                  >
                                                      {expression}
                                                  </div>
                                              </div>
                                          }
                                          overlayInnerStyle={{
                                              color: 'rgb(0, 0, 0, 0.85)',
                                          }}
                                          overlayStyle={{
                                              width: '260px',
                                              maxWidth: '260px',
                                          }}
                                          color="#fff"
                                          placement="bottom"
                                      >
                                          <div
                                              style={{
                                                  fontSize: 12,
                                                  fontWeight: '550',
                                              }}
                                          >
                                              <FontIcon name="icon-bianjiqi" />
                                          </div>
                                      </Tooltip>
                                  ),
                              },
                          }
                        : undefined,
                    parentField:
                        item?.relation
                            ?.filter((relation) => relation.vid === field.vid)
                            .map((relation) => ({
                                id: relation.parent_vid,
                                tableId: relation.parent_shell_vid,
                            })) || [],
                    ...fieldProps,
                }
            }),
        }
    })
}
