import classNames from 'classnames';
import styles from './index.module.less';

interface BadgeProps {
  count?: number;
  dot?: boolean;
  status?: 'default' | 'success' | 'processing' | 'error' | 'warning';
  text?: string;
  className?: string;
  children?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ count, dot, status = 'default', text, className, children }) => {
  const showBadge = dot || (count !== undefined && count > 0);

  return (
    <span className={classNames(styles['badge-wrapper'], className)}>
      {children}
      {showBadge && (
        <span
          className={classNames(styles.badge, styles[`badge-${status}`], {
            [styles['badge-dot']]: dot,
          })}
        >
          {!dot && count}
        </span>
      )}
      {text && <span className={styles['badge-text']}>{text}</span>}
    </span>
  );
};

export default Badge;
