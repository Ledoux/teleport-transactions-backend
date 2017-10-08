require('babel-polyfill')
const express = require('express')
const fs =  require('fs')
const http = require('http')
const { useUploader } = require('transactions-express-data')
const { logger,
  useMorgan
} = require('transactions-express-logger')
const { useMongo,
  useRouter
} = require('transactions-express-rest-mongodb')
const { useTransactionsExpressSocketio } = require('transactions-express-socketio')
const { hasJwtApiAccess,
  useGrab,
  useJwt,
  useMailer,
  useSign,
  useSignin,
  useSignup,
  useTour
} = require('transactions-express-passport')

const api = require('./lib/api').default
const { dataPath,
  emailPath,
  grabPath,
  scrapPath,
  signPath,
  tourPath,
  uploadPath
} = api
const authorization = require('./lib/authorization').default
const { IS_LOCALHOST,
  IS_SANDBOX,
  IS_STAGING,
  IS_PRODUCTION
} = require('./lib/config')
const description = require('./lib/description').default
const socket = require('./lib/socket').default

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

function getStack () {
  return new Promise((resolve, reject) => {
    const app = express()
    app.set('port', (process.env.PORT || 5000))
    const helmet = require('helmet')
    app.use(helmet({
      // NOTE: site stops working in Chrome with this option turned on
      noSniff: false
    }))
    useMongo(app, { mongoUrl: process.env.MONGO_URL })
      .then(({ db }) =>  {
        useMorgan(app, { isProd: IS_PRODUCTION })
        useSign(app, { db,
          isProd: IS_PRODUCTION,
          session: {
            expiry: 1000 * 60 * 60 * 24 * 7, // 7 days
            key: process.env.SESSION_KEY,
            secret: process.env.SESSION_SECRET
          }
        })
        const { localAuthenticate,
          localAuthenticateAndRedirect,
          returnTo
        } = useSignin(app, { db,
          logger,
          routePath: signPath
        })
        const { createJWTforUser,
          jwtAuthenticate
        } = useJwt(app, { db,
          jwtSecret: process.env.JWT_SECRET,
          localAuthenticate,
          routePath: signPath
        })
        const mailer = useMailer(app, { awsConfig: { accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_CONFIG_SECRET_ACCESS_KEY,
            region: process.env.AWS_CONFIG_REGION
          },
          accountName: process.env.NODEMAILER_ACCOUNT_NAME,
          activationRoute: process.env.NODEMAILER_ACTIVATION_ROUTE,
          logger,
          senderName: process.env.NODEMAILER_SENDER_NAME,
          projectName: process.env.NODEMAILER_PROJECT_NAME,
          routePath: emailPath,
          senderMail: process.env.NODEMAILER_SENDER_MAIL
        })
        useSignup(app, { createJWTforUser,
          db,
          isProd: IS_PRODUCTION,
          logger,
          mailer,
          requiredFields: [
            'firstName',
            'email',
            'lastName',
            'password'
          ],
          routePath: signPath,
          sessionKey: process.env.SESSION_KEY,
          sessionSecret: process.env.SESSION_SECRET
        })
        const { definition,
          transactionsRouter
        } = useRouter(app, { authorization,
          db,
          logger,
          middlewares: [ hasJwtApiAccess ],
          routePath: dataPath
        })
        useUploader(app, { awsConfig: { accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_CONFIG_SECRET_ACCESS_KEY,
            region: process.env.AWS_CONFIG_REGION
          },
          bucketName: process.env.AWS_BUCKET_NAME,
          routePath: uploadPath
        })
        useTour(app, { db,
          localAuthenticateAndRedirect,
          returnTo,
          routePath: tourPath
        }).then(tour => {
          tour.adminUser && useGrab(app, { email: tour.adminUser.email,
            localAuthenticate,
            jwtAuthenticate,
            password: tour.adminUser.password,
            routePath: grabPath,
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
              return { api: JSON.stringify(api || {}),
                authorization: JSON.stringify(authorization || {}),
                context: JSON.stringify({ IS_LOCALHOST,
                  IS_SANDBOX,
                  IS_STAGING,
                  IS_PRODUCTION
                }),
                description: JSON.stringify(description || {}),
                flash: JSON.stringify(flash),
                socket: JSON.stringify(socket || {}),
                tour: JSON.stringify(tour || {}),
                user: JSON.stringify(req.user || {})
              }
            }
          })
          const server = http.Server(app)
          const { socketioServer } = useTransactionsExpressSocketio(server,
            Object.assign({ definition, description }, socket))
          resolve({ app,
            socketioServer,
            server
          })
        })
      }).catch(error => reject(error))
  })
}

module.exports = getStack
