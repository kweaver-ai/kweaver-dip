import React, { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { Collapse, Input, Badge, Button, Tooltip, Popover, message } from 'antd';
import { SearchOutlined, GlobalOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import copy from 'clipboard-copy';
import CubeIcon from '@/assets/icons/cube.svg';
import CopyIcon from '@/assets/icons/copy.svg';
import { formatNumber } from '@/utils/formatter';
import { type FunctionDependency } from '@/apis/agent-operator-integration/type';
import { DependencyTypeEnum, type DependencyType } from '../types';
import DepList from './DepList';
import AddExternalDep from './AddExternalDep';
import styles from './index.module.less';

interface DepPanelProps {
  pypiRepoUrl?: string;
  installedDependencies?: FunctionDependency[];
  externalDependencies?: FunctionDependency[];
  onDeleteExternalDep: (dependency: FunctionDependency) => void;
  onDependenciesUrlChange: (pypiRepoUrl: string) => void;
  onAddExternalDep: (dependency: FunctionDependency) => void;
}

const colors = {
  [DependencyTypeEnum.Installed]: 'rgb(22, 119, 255)',
  [DependencyTypeEnum.External]: 'rgb(82, 196, 26)',
};

const DepPanel: React.FC<DepPanelProps> = ({
  pypiRepoUrl,
  installedDependencies: installedDependenciesFromProps,
  externalDependencies: externalDependenciesFromProps,
  onDeleteExternalDep,
  onDependenciesUrlChange,
  onAddExternalDep,
}) => {
  const [searchKeyword, setSearchKey] = useState<string>(''); // 搜索关键字
  const [foundDependencies, setFoundDependencies] = useState<DependencyType[]>([]); // 搜索到的依赖库
  const [addExternalDepVisible, setAddExternalDepVisible] = useState<boolean>(false);

  const installedDependencies = useMemo(
    () => installedDependenciesFromProps?.map(item => ({ ...item, type: DependencyTypeEnum.Installed })) || [],
    [installedDependenciesFromProps]
  );
  const externalDependencies = useMemo(
    () => externalDependenciesFromProps?.map(item => ({ ...item, type: DependencyTypeEnum.External })) || [],
    [externalDependenciesFromProps]
  );

  // 搜索依赖库
  const searchDeps = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchKey(value);
      if (value) {
        setFoundDependencies(
          [...(installedDependencies || []), ...(externalDependencies || [])].filter(({ name }) => name.includes(value))
        );
      }
    },
    [installedDependencies, externalDependencies]
  );
  const searchDepDebounce = useMemo(() => debounce(searchDeps, 300), [searchDeps]);

  // 添加外部依赖库
  const addExternalDeps = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAddExternalDepVisible(true);
  };

  // 删除搜索到的依赖库
  const deleteExternalDepInSearch = (dependency: FunctionDependency) => {
    setFoundDependencies(prev => prev.filter(dep => dep.name !== dependency.name));
    onDeleteExternalDep?.(dependency);
  };

  const handleCopy = async () => {
    try {
      const copyValue = [...installedDependencies, ...externalDependencies]
        .map(item => item.name + '@' + item.version)
        .join(', ');

      await copy(copyValue);
      message.success('复制成功！');
    } catch {
      message.info('复制失败');
    }
  };

  return (
    <div className={classNames(styles['dependency-panel'], 'dip-w-100 dip-h-100 dip-flex-column')}>
      <div
        className={classNames(
          styles['header'],
          'dip-pl-20 dip-flex-align-center dip-font-16 dip-c-bold dip-user-select-none'
        )}
      >
        <span className="dip-mr-4">依赖包管理</span>
        <Tooltip title="复制依赖包信息">
          <Button
            icon={<CopyIcon />}
            type="text"
            style={{ width: 28, height: 28 }}
            className="dip-text-color-65"
            onClick={handleCopy}
          />
        </Tooltip>
      </div>

      <div className="dip-mt-12 dip-mb-12 dip-pl-12 dip-pr-12">
        <Input
          placeholder="搜索依赖包名称"
          allowClear
          prefix={<SearchOutlined className="dip-opacity-35" />}
          onChange={searchDepDebounce}
        />
      </div>

      {searchKeyword ? (
        <DepList
          className="dip-pl-16"
          dependencies={foundDependencies}
          icon={dependency => (
            <Badge status={dependency.type === DependencyTypeEnum.Installed ? 'processing' : 'success'} />
          )}
          emptyDescription="搜索结果为空"
          allowDelete={dependency => dependency.type === DependencyTypeEnum.External}
          onDelete={deleteExternalDepInSearch}
        />
      ) : (
        <Collapse
          bordered={false}
          className={styles['collapse']}
          defaultActiveKey={[DependencyTypeEnum.Installed]}
          items={[
            {
              key: DependencyTypeEnum.Installed,
              label: (
                <div className="dip-flex-space-between">
                  <span>
                    <CubeIcon
                      className="dip-mr-6"
                      style={{
                        color: colors[DependencyTypeEnum.Installed],
                        marginBottom: '-3px',
                        marginLeft: '-2px',
                        fontSize: 18,
                      }}
                    />
                    已安装依赖包
                    <span
                      className={classNames(
                        styles['count'],
                        'dip-ml-4',
                        installedDependencies?.length === 0 ? styles['count-empty'] : ''
                      )}
                    >
                      {formatNumber(installedDependencies?.length || 0)}
                    </span>
                  </span>
                </div>
              ),
              children: <DepList dependencies={installedDependencies} icon={<Badge status="processing" />} />,
            },
            {
              key: DependencyTypeEnum.External,
              label: (
                <div className="dip-flex-space-between">
                  <span>
                    <GlobalOutlined
                      className="dip-mr-6 dip-font-16"
                      style={{ color: colors[DependencyTypeEnum.External] }}
                    />
                    外部依赖包
                    <span
                      className={classNames(
                        styles['count'],
                        'dip-ml-4',
                        externalDependencies?.length === 0 ? styles['count-empty'] : ''
                      )}
                    >
                      {formatNumber(externalDependencies?.length || 0)}
                    </span>
                  </span>
                  <span>
                    <Tooltip title="添加外部依赖包">
                      <Button
                        icon={<PlusOutlined />}
                        type="text"
                        className={classNames(styles['add-external-btn'], 'dip-text-color-65')}
                        onClick={addExternalDeps}
                      />
                    </Tooltip>
                    <Popover
                      trigger={['click']}
                      content={
                        <div onClick={e => e.stopPropagation()}>
                          依赖包安装源地址
                          <div style={{ color: 'red', fontSize: '12px', opacity: 0.65 }}>
                            版本联想功能需镜像源支持 JSON API (如 PyPI 官方、清华源)
                          </div>
                          <Input
                            value={pypiRepoUrl}
                            className="dip-mt-6"
                            onChange={e => onDependenciesUrlChange?.(e.target.value)}
                          />
                        </div>
                      }
                    >
                      <Tooltip title="设置依赖包安装源地址" placement="right">
                        <Button
                          icon={<SettingOutlined />}
                          className={classNames('dip-ml-6 dip-text-color-65', styles['external-registry-btn'])}
                          type="text"
                          onClick={e => e.stopPropagation()}
                        />
                      </Tooltip>
                    </Popover>
                  </span>
                </div>
              ),
              children: (
                <DepList
                  dependencies={externalDependencies}
                  allowDelete
                  icon={<Badge status="success" />}
                  onDelete={onDeleteExternalDep}
                />
              ),
            },
          ]}
        />
      )}

      {addExternalDepVisible && (
        <AddExternalDep
          pypiRepoUrl={pypiRepoUrl}
          onCancel={() => setAddExternalDepVisible(false)}
          onAddDep={onAddExternalDep}
          onDeleteDep={onDeleteExternalDep}
        />
      )}
    </div>
  );
};

export default DepPanel;
