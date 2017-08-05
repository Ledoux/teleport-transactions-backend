require('babel-polyfill')
const express = require('express')
const fs =  require('fs')
const http = require('http')
const kebabCase = require('lodash.kebabcase')
const { useUploader } = require('transactions-express-aws')
const { logger,
  useMorgan
} = require('transactions-express-logger')
const { useRouter } = require('transactions-express-rest')
const { api,
  useModel
} = require('transactions-express-rest-mongodb')
const { useTransactionsExpressSocketio } = require('transactions-express-socketio')
const { formatUserForFrontend,
  hasSubscribedApiAccess,
  useGrab,
  useJwt,
  useMailer,
  useSign,
  useSignin,
  useSignup,
  useTour
} = require('transactions-express-passport')

const { IS_DEV,
  IS_LOCALHOST,
  IS_PROD,
  IS_SANDBOX
} = require('./lib/config')
const { conditionsByScopeName,
  descriptionsByEntityName
} = require('./lib/transactions')

const NAME_SPACE = '/transactions'

// in localhost condition we need to import
// the secret values from a secret script
const secretKeys = ['MONGO_URL']
if (IS_LOCALHOST) {
  const env = require('node-env-file')
  const type = process.env.TYPE || 'development'
  const fileDir = `${__dirname}/../scripts/${type}_secret.sh`
  if (fs.existsSync(fileDir)) {
    env(fileDir)
  }
  secretKeys.forEach(secretKey => {
    if (typeof process.env[secretKey] === 'undefined') {
      logger.error(`You need to define a ${secretKey} in your ${fileDir}`)
    }
  })
}

const { useRender } = require('./lib/render')

function getSetup() {
  return new Promise((resolve, reject) => {
    const app = express()
    app.set('port', (process.env.PORT || 5000))
    const helmet = require('helmet')
    app.use(helmet({
      // NOTE: site stops working in Chrome with this option turned on
      noSniff: false
    }))
    useModel(app, {
      conditionsByScopeName,
      descriptionsByEntityName,
      mongoUrl: process.env.MONGO_URL
    })
      .then(({ conditions, db }) =>  {
        useMorgan(app, {
          isProd: IS_PROD
        })
        useSign(app, { db,
          isProd: IS_PROD,
          session: {
            expiry: 1000 * 60 * 60 * 24 * 7, // 7 days
            key: process.env.SESSION_KEY,
            secret: process.env.SESSION_SECRET
          }
        })
        const { localAuthenticate,
          localAuthenticateAndRedirect,
          returnTo
        } = useSignin(app, {
          db,
          logger,
          routePath: '/sign'
        })
        const { createJWTforUser,
          jwtAuthenticate
        } = useJwt(app, { db,
          jwtSecret: process.env.JWT_SECRET,
          localAuthenticate,
          routePath: '/sign'
        })
        const mailer = useMailer(app, {
          awsConfig: {
            accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_CONFIG_SECRET_ACCESS_KEY,
            region: process.env.AWS_CONFIG_REGION
          },
          accountName: process.env.NODEMAILER_ACCOUNT_NAME,
          activationRoute: process.env.NODEMAILER_ACTIVATION_ROUTE,
          logger,
          senderName: process.env.NODEMAILER_SENDER_NAME,
          projectName: process.env.NODEMAILER_PROJECT_NAME,
          routePath: '/email',
          senderMail: process.env.NODEMAILER_SENDER_MAIL
        })
        useSignup(app, {
          createJWTforUser,
          db,
          getUserSlug: (user) => {
            const name = `${user.firstName}-${user.lastName}`
            return kebabCase(name.toString())
          },
          isAdmin: (user) => {
            return user && /@climatefeedback\.org$/.test(user.email)
          },
          isProd: IS_PROD,
          logger,
          mailer,
          requiredFields: [
            'firstName',
            'email',
            'lastName',
            'password'
          ],
          routePath: '/sign',
          sessionKey: process.env.SESSION_KEY,
          sessionSecret: process.env.SESSION_SECRET
        })
        const { transactionsRouter } = useRouter(app, {
          db,
          api,
          getAccessCondition: (options, req) => {
            // if it is actually a GET request method on the matching
            // logged user, then it is indeed ok, we create a passing condition
            // object
            if (req.user && req.method === 'GET' && options.length === 1) {
              const { collectionName,
                query
              } = options[0]
              if (collectionName === 'users' && query && query.id === req.user.id) {
                return {
                  hasSubscribedApiAccess: true
                }
              }
            }
            // else it is a condition from all the required collection
            const collectionNames = options.map(({collectionName}) => collectionName)
            const filteredConditions = conditions.filter(condition => {
              const conditionCollectionNames = condition.collectionNames || []
              if (conditionCollectionNames.length > 0) {
                const matchedCondition = collectionNames.some(collectionName =>
                  conditionCollectionNames.includes(collectionName)
                )
                return matchedCondition
              }
            })
            const scopes = filteredConditions.map(({scope}) => scope)
            const resolvedCondition = filteredConditions.find(condition => {
              const otherScopes = scopes.filter(scope => scope !== condition.scope)
              const authorizedScopes = condition.authorizedScopes || []
              const notAuthorizedScope = otherScopes.find(otherScope =>
                !authorizedScopes.includes(otherScope))
              return !notAuthorizedScope
            })
            return resolvedCondition
          },
          hasApiAccess: (condition, req, res, next) => {
            // now that we have the condition let's see if there is inside
            // hasSubscribedApiAccess
            if (condition) {
              if (condition.hasSubscribedApiAccess) {
                return hasSubscribedApiAccess(condition.scope, req, res, next, logger)
              } else {
                // next
                next()
                return true
              }
            } else {
              logger.warn(`no such api access for this condition`)
              res.send(`no such api access for this condition`)
            }
          },
          getFormatDocument: (document, collectionName) => {
            if (collectionName === 'users') {
              return formatUserForFrontend(document)
            }
            return document
          },
          routePath: '/api'
        })
        useUploader(app, {
          awsConfig: {
            accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_CONFIG_SECRET_ACCESS_KEY,
            region: process.env.AWS_CONFIG_REGION
          },
          BucketName: process.env.AWS_BUCKET_NAME,
          routePath: '/upload'
        })
        useTour(app, { email: process.env.TOUR_MAIL,
          localAuthenticateAndRedirect,
          password: process.env.TOUR_PASSWORD,
          returnTo,
          routePath: '/tour'
        })
        useGrab(app, {
          email: process.env.TOUR_MAIL,
          localAuthenticate,
          jwtAuthenticate,
          password: process.env.TOUR_PASSWORD,
          routePath: '/grab',
          transactionsRouter
        })
        // it is important to put all the apis uses before this useRender
        useRender(app, {
          getExtraContext: req => {
            // flash
            const flash = req.flash && req.flash()
            // since passport outputs 'missing credentials' message on generic 'error' key,
            // except signin/signup message
            if (req.url === '/signin' && flash.error && !flash.signinMessages) {
              flash.signinMessages = flash.error
            } else if (req.url === '/signup' && flash.error && !flash.signupMessages) {
              flash.signupMessages = flash.error
            }
            return {
              descriptionsByEntityName: JSON.stringify(descriptionsByEntityName),
              flash: JSON.stringify(flash),
              NAME_SPACE,
              user: JSON.stringify(req.user || {})
            }
          }
        })
        const server = http.Server(app)
        const { socketioServer } = useTransactionsExpressSocketio(server, {
          descriptionsByEntityName,
          NAME_SPACE
        })
        resolve({ app,
          socketioServer,
          server
        })
      }).catch(error => reject(error))
  })
}

module.exports = getSetup
