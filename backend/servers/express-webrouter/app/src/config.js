// DEVELOPMENT is for localhost with dev tools (watchers, hot server...)
// LOCALHOST is for localhost either dev or prod context
// PRODUCTION is for not-localhost condition
// SANDBOX is for localhost with build and prod server
// STAGING if for not-localhost beta testing
const IS_DEVELOPMENT = process.env.TYPE === 'development'
const IS_SANDBOX = !IS_DEVELOPMENT && process.env.NODE_ENV !== 'production'
const IS_LOCALHOST = IS_DEVELOPMENT || IS_SANDBOX
const IS_PRODUCTION = !IS_SANDBOX && process.env.NODE_ENV === 'production'
const IS_STAGING = !IS_SANDBOX && process.env.TYPE === 'staging'

export { IS_DEVELOPMENT,
  IS_SANDBOX,
  IS_LOCALHOST,
  IS_PRODUCTION,
  IS_STAGING
}
