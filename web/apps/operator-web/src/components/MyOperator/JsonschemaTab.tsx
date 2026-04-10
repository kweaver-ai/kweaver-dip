import { useEffect, useState } from 'react';
import { Collapse, Table } from 'antd';
import { dereference, getTableData } from '@/utils/operator';
const { Panel } = Collapse;

// 生成参数表格数据的函数
const generateParamsTableData = (parameters: any[], jsonSchema: any) => {
  return parameters.map(item => {
    const schema = dereference(item.schema, jsonSchema) || item.schema;
    return {
      ...item,
      key: item.in + '_' + item.name,
      type: schema?.type,
      schema,
    };
  });
};

const JsonschemaTab = ({ operatorInfo, type, onTableDataChange, showIn = true }: any) => {
  const [tableData, setTableData] = useState<any>([]);
  const jsonSchema = operatorInfo?.metadata?.api_spec;

  useEffect(() => {
    if (type === 'Inputs') {
      // 生成 header、query、path、cookie 参数的表格数据
      const headerQueryPathCookieParams = generateParamsTableData(jsonSchema?.parameters || [], jsonSchema);
      // 处理 body 参数
      const data =
        jsonSchema?.request_body?.content['application/json']?.schema ||
        jsonSchema?.request_body?.content['application/json'];

      let newSchemas = {
        parameters: data,
        components: jsonSchema?.components,
        $defs: jsonSchema?.$defs,
      };

      try {
        newSchemas = JSON.parse(JSON.stringify(newSchemas));
      } catch {}

      const resolvedParameters = dereference(newSchemas.parameters, newSchemas);
      setTableData([...headerQueryPathCookieParams, ...getTableData(resolvedParameters)]);
    } else {
      const successRes = jsonSchema?.responses?.find((item: any) => item.status_code === '200');
      const successResJson =
        successRes?.content['application/json']?.schema || successRes?.content['application/json'] || {};
      const newSchemas = {
        parameters: successResJson,
        components: jsonSchema?.components,
      };
      const resolvedParameters = dereference(newSchemas.parameters, newSchemas);
      setTableData(getTableData(resolvedParameters));
    }
  }, [operatorInfo]);

  useEffect(() => {
    onTableDataChange?.(tableData);
  }, [tableData]);

  const columns = [
    {
      title: '字段',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    // 仅 Inputs 类型需要来源列
    ...(showIn && type === 'Inputs'
      ? [
          {
            title: '来源',
            dataIndex: 'in',
            key: 'in',
            render: (inValue: any) => {
              if (['header', 'query', 'path', 'cookie'].includes(inValue)) {
                // 转换为首字母大写
                return inValue.charAt(0).toUpperCase() + inValue.slice(1);
              }
              return 'Body';
            },
          },
        ]
      : []),
    {
      title: '是否必填',
      dataIndex: 'required',
      key: 'required',
      render: (required: any) => (required ? '是' : '否'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];
  return (
    <>
      {Boolean(tableData?.length) && (
        <Collapse ghost defaultActiveKey={1} className="operator-details-collapse">
          <Panel header={type} key="1">
            <Table columns={columns} dataSource={tableData} rowKey="key" size="small" pagination={false} />
          </Panel>
        </Collapse>
      )}
    </>
  );
};

export default JsonschemaTab;
