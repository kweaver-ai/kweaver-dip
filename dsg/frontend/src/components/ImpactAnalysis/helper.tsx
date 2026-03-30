import { Tooltip } from 'antd'
import { FC } from 'react'
import { union } from 'lodash'
import {
    changeArrayToObject,
    IndicatorColor,
    NodeType,
} from '@/core/consanguinity'
import { FontIcon } from '@/icons'
import { FieldTitleLabel, FormTitleLabel } from '../ConsanguinityGraph/helper'
import styles from './styles.module.less'
import __ from './locale'
import IndicatorIcons from '../IndicatorManage/IndicatorIcons'

interface IndicatorTitleLabelProps {
    name: string
    type: string
    indicatorType: string
    departmentName: string
    ownerName: string
}
const IndicatorTitleLabel: FC<IndicatorTitleLabelProps> = ({
    name,
    type,
    indicatorType,
    departmentName,
    ownerName,
}) => {
    return (
        <div className={styles.labelTitleWrapper}>
            <div className={styles.titleNameWrapper}>
                <div
                    style={{
                        background: IndicatorColor?.[indicatorType],
                    }}
                    className={styles.icon}
                >
                    <IndicatorIcons type={indicatorType} fontSize={20} />
                </div>
                <div className={styles.text} title={name}>
                    {name}
                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.contentItem}>
                    <span>{__('所属部门：')}</span>
                    <span title={departmentName}>{departmentName || '--'}</span>
                </div>
                <div className={styles.contentItem}>
                    <span>{__('数据Owner：')}</span>
                    <span title={ownerName}>{ownerName || '--'}</span>
                </div>
            </div>
        </div>
    )
}

/**
 * 获取所有关系表达式
 * @param data 数据
 * @returns 关系表达式
 */
const getAllRelationExpress = (data: Array<any>) => {
    const relations = data.map((item) => item?.relation || [])
    return relations.flat()
}

/**
 * 将数据转换为图谱数据
 * @param data 数据
 * @returns 图谱数据
 */
export const changeDataToGraphData = (data: Array<any>) => {
    const allRelation = getAllRelationExpress(data)
    const res = data.map((item) => {
        const dataProps = changeArrayToObject(item.props)
        if (item.node_type === NodeType.INDICATOR) {
            return {
                ...item,
                ...dataProps,
                id: item.vid,
                type: item.node_type,
                label: (
                    <IndicatorTitleLabel
                        name={item.name}
                        type={item.node_type}
                        indicatorType={dataProps?.indicator_type}
                        departmentName={dataProps?.department_name}
                        ownerName={dataProps?.owner_name}
                    />
                ),
            }
        }
        return {
            ...item,
            id: item.vid,
            childrenNodeId:
                union(
                    item?.relation?.map(
                        (relation) =>
                            relation.child_shell_vid || relation.child_vid,
                    ),
                ) || [],
            ...dataProps,
            label: (
                <FormTitleLabel
                    name={item.name}
                    type={item.node_type}
                    dataSourceName={dataProps?.datasource_name || ''}
                    dataSourceType={dataProps?.catalog_type || ''}
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
                const expression = allRelation?.find(
                    (relation) => relation.child_vid === field.vid,
                )?.expression

                return {
                    id: field.vid,
                    label: (
                        <FieldTitleLabel
                            name={field.name}
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
                    childrenField:
                        item?.relation
                            ?.filter((relation) => relation.vid === field.vid)
                            .map((relation) => ({
                                id: relation.child_vid,
                                tableId: relation.child_shell_vid,
                            })) || [],
                    ...fieldProps,
                }
            }),
        }
    })

    return res
}
