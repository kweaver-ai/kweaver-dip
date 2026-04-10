import { memo } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { Tooltip, Button, Empty } from 'antd';
import emptyImage from '@/assets/images/empty2.png';
import { type DependencyType } from '../types';
import styles from './DepList.module.less';

interface DepListProps {
  className?: string;
  icon: React.ReactNode | ((dependency: DependencyType) => React.ReactNode);
  dependencies?: DependencyType[];
  emptyDescription?: string;
  allowDelete?: boolean | ((dependency: DependencyType) => boolean);
  onDelete?: (dependency: DependencyType) => void;
}

const DependencyList: React.FC<DepListProps> = memo(
  ({ className, icon, dependencies, emptyDescription, allowDelete = false, onDelete }) => {
    return (
      <div className={className}>
        {dependencies?.map((dependency, index) => {
          const deleteable = typeof allowDelete === 'function' ? allowDelete(dependency) : allowDelete;
          return (
            <div
              key={dependency.name + index}
              className={classNames(
                styles['dependency-item'],
                deleteable ? styles['hover-disable-version'] : '',
                'dip-flex-space-between dip-gap-2'
              )}
            >
              <div className="dip-overflow-hidden dip-flex-align-center dip-gap-8">
                {typeof icon === 'function' ? icon(dependency) : icon}

                <span
                  className={classNames(styles['pkg-name'], 'dip-font-14 dip-font-weight-500 dip-ellipsis')}
                  title={dependency.name}
                >
                  {dependency.name}
                </span>
              </div>

              <span className={classNames(styles['pkg-version'], 'dip-font-12')}>v{dependency.version}</span>

              {deleteable && (
                <Tooltip title="删除">
                  <Button
                    icon={<CloseOutlined />}
                    type="text"
                    className={classNames(styles['del-icon'], 'dip-font-12')}
                    onClick={() => onDelete?.(dependency)}
                  />
                </Tooltip>
              )}
            </div>
          );
        })}

        {dependencies?.length === 0 && (
          <Empty image={emptyImage} description={emptyDescription} className="dip-mr-24" />
        )}
      </div>
    );
  }
);

export default DependencyList;
