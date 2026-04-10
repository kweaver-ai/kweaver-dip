import { get } from '@/utils/http';

type AvatarUser = { id?: string; user_id?: string; avatar_url?: string };

export function getBatchUserAvatars(userIds: string[]) {
  const ids = userIds.filter(Boolean).join(',');
  if (!ids) {
    return Promise.resolve({});
  }
  return get(`/api/user-management/v1/avatars/${ids}`).then((users: AvatarUser[]) => {
    const avatarMap: Record<string, string> = {};
    users?.forEach(user => {
      const userId = user.id;
      if (userId) {
        avatarMap[userId] = user.avatar_url || '';
      }
    });
    return avatarMap;
  });
}
