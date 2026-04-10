import { useEffect, useState } from 'react';
import { Avatar } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { getBatchUserAvatars } from '@/api/user-management';
import styles from './index.module.less';

interface UserAvatarNameProps {
  userName: string;
  userId: string;
  avatarSize?: number;
  userNameFontSize?: number;
  asTag?: boolean;
  deletable?: boolean;
  onClose?: (e: React.MouseEvent<HTMLElement>) => void;
  tagClassName?: string;
}

const avatarCache: Record<string, string> = {};

const UserAvatarName: React.FC<UserAvatarNameProps> = ({
  userName,
  userId,
  avatarSize = 22,
  userNameFontSize = 13,
  asTag = false,
  deletable = false,
  onClose,
  tagClassName,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string>(avatarCache[userId] || '');

  useEffect(() => {
    if (!userId) {
      setAvatarUrl('');
      return;
    }
    if (avatarCache[userId] !== undefined) {
      setAvatarUrl(avatarCache[userId]);
      return;
    }
    void getBatchUserAvatars([userId])
      .then(map => {
        const url = map[userId] || '';
        avatarCache[userId] = url;
        setAvatarUrl(url);
      })
      .catch(() => {
        avatarCache[userId] = '';
        setAvatarUrl('');
      });
  }, [userId]);

  const content = (
    <span className={styles.wrap}>
      <Avatar src={avatarUrl || undefined} style={{ width: avatarSize, height: avatarSize }} className={styles.avatar}>
        {(userName || '').substring(0, 1)}
      </Avatar>
      <span className={styles.name} title={userName} style={{ fontSize: userNameFontSize }}>
        {userName}
      </span>
    </span>
  );

  if (asTag) {
    return (
      <span className={`${styles.tag} ${tagClassName || ''}`}>
        {content}
        {deletable && (
          <span className={styles['tag-close']} onClick={e => onClose?.(e)} role="button" aria-label="close">
            <CloseOutlined />
          </span>
        )}
      </span>
    );
  }

  return content;
};

export default UserAvatarName;
