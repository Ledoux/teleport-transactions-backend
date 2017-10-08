// DEVELOPMENT is for localhost with dev tools (watchers, hot server...)
// SANDBOX is for locahost with build and prod server
// STAGING if for not localhost beta testing
// PRODUCTION is for not localhost condition
const IS_DEVELOPMENT = exports.IS_DEVELOPMENT = process.env.TYPE === 'development'
const IS_SANDBOX = exports.IS_SANDBOX = !IS_DEVELOPMENT && process.env.NODE_ENV !== 'production'
const IS_LOCALHOST = exports.IS_LOCALHOST = IS_DEVELOPMENT || IS_SANDBOX
const IS_PRODUCTION = exports.IS_PRODUCTION = !IS_SANDBOX && process.env.NODE_ENV === 'production'

export { IS_DEVELOPMENT,
  IS_SANDBOX,
  IS_LOCALHOST,
  IS_PRODUCTION
}
