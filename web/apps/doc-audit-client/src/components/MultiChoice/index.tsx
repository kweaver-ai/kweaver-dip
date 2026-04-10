import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input, Tag } from 'antd';
import { CloseCircleFilled, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import styles from './index.module.less';

interface SearchType {
  label: string;
  value: string;
}

interface SearchItem {
  type: string;
  val: string;
}

interface MultiChoiceProps {
  value?: SearchItem[];
  onChange?: (value: SearchItem[]) => void;
  types: SearchType[];
  placeholder?: string;
  className?: string;
}

const MultiChoice: React.FC<MultiChoiceProps> = ({ value = [], onChange, types, placeholder = '搜索', className }) => {
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInputValue(next);
    setDropdownOpen(!!next.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addSearchItem(types[0]?.value || '', inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeSearchItem(value.length - 1);
    }
  };

  const addSearchItem = (type: string, val: string) => {
    if (!type || !val) return;
    const duplicated = value.some(item => item.type === type && item.val.trim() === val.trim());
    if (duplicated) {
      setInputValue('');
      setDropdownOpen(false);
      return;
    }
    const newItem: SearchItem = {
      type,
      val,
    };
    onChange?.([...value, newItem]);
    setInputValue('');
    setDropdownOpen(false);
  };

  const removeSearchItem = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange?.(newValue);
  };

  const clearAll = () => {
    setInputValue('');
    setDropdownOpen(false);
    onChange?.([]);
  };

  const getTypeLabel = (type: string) => {
    const found = types.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <div className={classNames(styles['multi-choice'], className)} ref={rootRef}>
      <div className={styles['multi-choice-container']}>
        <SearchOutlined className={styles['search-icon']} />
        <div className={styles['tags-wrapper']}>
          {value.map((item, index) => (
            <Tag
              key={`${item.type}-${item.val}-${index}`}
              closable
              onClose={() => removeSearchItem(index)}
              closeIcon={<CloseOutlined />}
            >
              <span className={styles['tag-type']}>{getTypeLabel(item.type)}:</span>
              <span className={styles['tag-value']}>{item.val}</span>
            </Tag>
          ))}
          <Input
            ref={inputRef as never}
            className={styles.input}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setDropdownOpen(!!inputValue.trim())}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            bordered={false}
          />
        </div>
        {(value.length > 0 || inputValue.trim()) && (
          <CloseCircleFilled
            className={styles['clear-icon']}
            onMouseDown={e => e.preventDefault()}
            onClick={clearAll}
          />
        )}
      </div>
      {dropdownOpen && (
        <div className={styles.dropdown}>
          {types.map(type => (
            <div
              key={type.value}
              className={styles['dropdown-item']}
              onMouseDown={e => {
                e.preventDefault();
                addSearchItem(type.value, inputValue.trim());
              }}
            >
              {type.label}: {inputValue.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiChoice;
