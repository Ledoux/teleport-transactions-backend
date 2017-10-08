require('babel-polyfill')
const env = require('node-env-file')
const { restoreData } = require('transactions-express-data')

const type = process.env.TYPE || 'development'
env(__dirname + '/' + type + '_secret.sh')

const fromType = process.env.FROM_TYPE || 'production'

restoreData({
  awsConfig: { accessKeyId: process.env.AWS_CONFIG_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_CONFIG_SECRET_ACCESS_KEY,
    region: process.env.AWS_CONFIG_REGION
  },
  bucketName: process.env.AWS_BUCKET_NAME,
  fromType,
  mongoUrl: process.env.MONGO_URL
})

console.log(`restoreData for ${type} database from ${fromType} database`)
