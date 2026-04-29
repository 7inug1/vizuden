export const ADMIN_USER_IDS = [
  'bb212db4-994c-42b2-951b-c6a860ec09ec',
];

export function isAdminUser(userId) {
  return typeof userId === 'string' && ADMIN_USER_IDS.includes(userId);
}
