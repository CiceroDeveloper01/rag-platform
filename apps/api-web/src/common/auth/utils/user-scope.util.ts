export function resolveUserScopes(role: 'admin' | 'user') {
  if (role === 'admin') {
    return [
      'documents:read',
      'documents:write',
      'omnichannel:read',
      'omnichannel:write',
      'auth:read',
      'admin:*',
    ];
  }

  return [
    'documents:read',
    'documents:write',
    'omnichannel:read',
    'auth:read',
  ];
}
