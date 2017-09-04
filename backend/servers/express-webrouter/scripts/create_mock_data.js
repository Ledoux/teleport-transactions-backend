require('babel-polyfill')
const env = require('node-env-file')
const path = require('path')
const { createMockData } = require('transactions-express-data')

const { descriptionsByEntityName } = require('../app/lib/descriptions')
env(__dirname + '/' + (process.env.TYPE || 'development') + '_secret.sh')

createMockData({ descriptionsByEntityName,
  hasProtection: true,
  jsonDataDir: path.join(__dirname, '../../../../data/json_data'),
  mongoUrl: process.env.MONGO_URL
})
