import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import classNames from 'classnames';
import { Modal, Input, Button, Empty, Spin, message, Tooltip } from 'antd';
import { FixedSizeList } from 'react-window';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import emptyImage from '@/assets/images/empty2.png';
import LoadFailedImage from '@/assets/icons/load-failed.svg';
import { searchFunctionDepencyVersions } from '@/apis/agent-operator-integration';
import { defaultDependenciesUrl } from '../utils';
import { type DependencyType, DependencyTypeEnum } from '../types';
import styles from './AddExternalDep.module.less';

interface AddExternalDepProps {
  pypiRepoUrl?: string;
  onCancel: () => void;
  onAddDep: (dep: DependencyType) => void;
  onDeleteDep: (dep: DependencyType) => void;
}

enum LoadStatus {
  Loading = 'loading',
  Error = 'error',
  Initial = 'initial', // 初始状态
  Success = 'success',
}

const AddExternalDep: React.FC<AddExternalDepProps> = ({ pypiRepoUrl, onCancel, onAddDep }) => {
  const [list, setList] = useState<string[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(LoadStatus.Initial);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [addedDepVersion, setAddedDepVersion] = useState(''); // 已添加过的库版本

  const searchRequestRef = useRef();

  const listHeight = useMemo(() => {
    return Math.min(list.length * 40, 300);
  }, [list.length]);

  useEffect(() => {
    return cancelSearchRequest;
  }, []);

  useEffect(() => {
    setAddedDepVersion('');
    setLoadStatus(LoadStatus.Initial);
    setList([]);
    cancelSearchRequest();
  }, [searchKeyword]);

  // 取消搜索请求
  const cancelSearchRequest = () => {
    try {
      searchRequestRef.current?.abort();
    } catch {}
  };

  // 搜索
  const searchDeps = useCallback(async () => {
    setLoadStatus(LoadStatus.Loading);

    try {
      searchRequestRef.current = searchFunctionDepencyVersions({
        packageName: searchKeyword,
        pypiRepoUrl,
      });

      const { versions }: any = await searchRequestRef.current;
      setList(versions);
      setLoadStatus(LoadStatus.Success);
    } catch (ex: any) {
      if (ex === 'CANCEL') return;

      if (ex?.description) {
        message.error(ex.description);
      }

      setList([]);
      setLoadStatus(LoadStatus.Error);
    }
  }, [pypiRepoUrl, searchKeyword]);

  const debounceSearchDeps = useMemo(() => debounce(searchDeps, 300), [searchDeps]);

  // 添加库
  const addDep = (version: string) => {
    const dependency = { name: searchKeyword, version, type: DependencyTypeEnum.External };
    onAddDep(dependency);
    setAddedDepVersion(version);
  };

  return (
    <Modal open centered title="添加依赖包" footer={null} onCancel={onCancel}>
      <div>
        <div>
          <span>依赖包安装源地址：</span>
          <span className="dip-text-color-65">{pypiRepoUrl || defaultDependenciesUrl}</span>
        </div>

        <div className="dip-mt-8 dip-mb-8 dip-flex-align-center dip-gap-8">
          <Input
            placeholder="搜索"
            allowClear
            prefix={<SearchOutlined className="dip-opacity-35" />}
            onChange={e => {
              setSearchKeyword(e.target.value);
            }}
            onPressEnter={debounceSearchDeps}
          />
          <Button type="primary" disabled={!searchKeyword} onClick={debounceSearchDeps}>
            搜索
          </Button>
        </div>

        {loadStatus === LoadStatus.Initial ? (
          <Empty image={emptyImage} description="请输入依赖包名称，点击搜索按钮进行查询" className="dip-mb-20" />
        ) : loadStatus === LoadStatus.Loading ? (
          <div style={{ width: '100%', height: '130px' }} className="dip-flex-center">
            <Spin />
          </div>
        ) : loadStatus === LoadStatus.Error ? (
          <Empty image={<LoadFailedImage style={{ fontSize: 100 }} />} description="加载失败" />
        ) : list.length === 0 ? (
          <Empty image={emptyImage} description="搜索结果为空" className="dip-mb-20" />
        ) : (
          <FixedSizeList
            height={listHeight}
            width={'calc(100% + 24px)'}
            itemSize={40}
            itemCount={list.length}
            itemData={list}
          >
            {({ index, style, data }) => {
              const item = data[index];
              const disabled = item === addedDepVersion;
              const label = `${searchKeyword}@v${item}`;
              return (
                <div
                  style={style}
                  className={classNames(
                    'dip-flex-space-between dip-pl-12 dip-pr-8 dip-pt-8 dip-pb-8 dip-gap-8 dip-border-radius-8',
                    styles['list-item']
                  )}
                >
                  <span className="dip-ellipsis" title={label}>
                    {label}
                  </span>
                  <Tooltip title={disabled ? '' : '添加'} placement="right">
                    <Button
                      disabled={disabled}
                      onClick={() => addDep(item)}
                      style={{ height: 28, paddingLeft: '12px', paddingRight: '12px', width: 74 }}
                    >
                      {disabled ? '已添加' : '添加'}
                    </Button>
                  </Tooltip>
                </div>
              );
            }}
          </FixedSizeList>
        )}
      </div>
    </Modal>
  );
};

export default AddExternalDep;
