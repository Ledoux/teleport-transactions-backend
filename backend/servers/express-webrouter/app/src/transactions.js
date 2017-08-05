export const descriptionsByEntityName = {
  notification: {
    items: [
      { key: 'id', type: 'String' },
      { key: 'text', type: 'String' },
      { key: 'userId', type: 'String' }
    ],
    scope: 'active',
    title: 'notification',
    type: 'collection'
  },
  user: {
    items: [
      { key: 'email', type: 'String', isRequired: true },
      { key: 'firstName', type: 'String', isRequired: true },
      { key: 'id', type: 'String', isAutomatic: true },
      { key: 'lastName', type: 'String', isRequired: true },
      { key: 'password', type: 'String', isRequired: true }
    ],
    scope: 'admin',
    title: 'user',
    type: 'collection'
  }
}

export const conditionsByScopeName = {
  active: {
    hasSubscribedApiAccess: true,
    authorizedScopes: ['guest'],
    scope: 'active'
  },
  admin: {
    hasSubscribedApiAccess: true,
    authorizedScopes: ['active', 'guest'],
    scope: 'admin'
  },
  guest: {
    scope: 'guest'
  }
}
