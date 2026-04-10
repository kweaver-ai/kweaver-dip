import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import UTILS from '@/utils';
import ENUMS from '@/enums';
import SERVICE from '@/services';
import { Modal, Table, Text } from '@/common';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

const ModelUsage = (props: any) => {
	const [dataSource, setDataSource] = useState([]);

	useEffect(() => {
		getModelList();
	}, []);

	const getModelList = async () => {
		try {
			const postData = { page: 1, size: 1000, order: 'desc', rule: 'update_time' };
			const result = await SERVICE.llm.llmGetList(postData);
			setDataSource(result?.data);
		} catch (error) {}
	};

	const columns = [
		{
			title: intl.get('plugins.modelName'),
			dataIndex: 'model_name',
			sorter: true,
			width: 200,
			render: (value: string, record: any) => (
				<div className="g-flex" title={value}>
					<img src={MODEL_ICON_KV[record?.model_series]?.icon} className="g-mr-2" style={{ width: 40, height: 40 }} />
					<div>
						<Text className="g-ellipsis-1">{value}</Text>
						<Text className="g-ellipsis-1 g-c-text-sub">{record?.model}</Text>
					</div>
				</div>
			),
		},
		{
			title: intl.get('plugins.RemainingBalance'),
			dataIndex: 'remain_token',
			render: (_value: any, record: any) => {
				return (
					<div>
						{record.billing_type === 1 ? (
							<React.Fragment>
								<div className="g-ellipsis-1">
									<Text style={{ width: 58 }}>input：</Text>
									<Text className="g-c-primary">
										{record?.input_tokens_remain === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.input_tokens_remain)}
									</Text>
								</div>
								<div className="g-ellipsis-1">
									<Text style={{ width: 58 }}>output：</Text>
									<Text className="g-c-primary">
										{record?.output_tokens_remain === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.output_tokens_remain)}
									</Text>
								</div>
							</React.Fragment>
						) : (
							<Text className="g-c-primary">
								{record?.input_tokens_remain === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.input_tokens_remain)}
							</Text>
						)}
					</div>
				);
			},
		},
		{
			title: intl.get('plugins.used'),
			dataIndex: 'used_token',
			render: (_value: any, record: any) => {
				return (
					<div>
						{record.billing_type === 1 ? (
							<React.Fragment>
								<div className="g-ellipsis-1">
									<Text style={{ width: 58 }}>input：</Text>
									<Text className="g-c-primary">
										{record?.input_tokens_used === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.input_tokens_used)}
									</Text>
								</div>
								<div className="g-ellipsis-1">
									<Text style={{ width: 58 }}>output：</Text>
									<Text className="g-c-primary">
										{record?.output_tokens_used === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.output_tokens_used)}
									</Text>
								</div>
							</React.Fragment>
						) : (
							<Text className="g-c-primary">
								{record?.input_tokens_used === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.input_tokens_used)}
							</Text>
						)}
					</div>
				);
			},
		},
		{
			title: intl.get('plugins.total'),
			dataIndex: 'all_token',
			render: (_value: any, record: any) => {
				return (
					<div>
						{record.billing_type === 1 ? (
							<React.Fragment>
								<div className="g-ellipsis-1">
									<Text style={{ width: 58 }}>input：</Text>
									<Text className="g-c-primary">
										{record?.input_tokens === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.input_tokens)}
									</Text>
								</div>
								<div className="g-ellipsis-1">
									<Text style={{ width: 58 }}>output：</Text>
									<Text className="g-c-primary">
										{record?.output_tokens === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.output_tokens)}
									</Text>
								</div>
							</React.Fragment>
						) : (
							<Text className="g-c-primary">{record?.input_tokens === null ? intl.get('plugins.unlimited') : UTILS.formatNumber(record?.input_tokens)}</Text>
						)}
					</div>
				);
			},
		},
	];
	return (
		<Modal title={intl.get('plugins.modelUsage')} width={1000} open={true} onCancel={props?.onPluginClose} footer={null}>
			<div className="g-pb-6">
				<Table rowKey="model_id" pagination={false} columns={columns} dataSource={dataSource} />
			</div>
		</Modal>
	);
};

export default ModelUsage;
