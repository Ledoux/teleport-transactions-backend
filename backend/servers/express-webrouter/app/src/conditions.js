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
