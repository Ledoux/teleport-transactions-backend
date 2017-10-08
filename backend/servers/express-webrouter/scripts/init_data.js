require('babel-polyfill')
const env = require('node-env-file')
const path = require('path')
const { mockData,
  resetData
} = require('transactions-express-data')

const description = require('../app/lib/description').default

const type = process.env.TYPE || 'development'
env(__dirname + '/' + type + '_secret.sh')
const mongoUrl = process.env.MONGO_URL

const jsonDataDir = path.join(__dirname, '../../../../data/json_data')

resetData(description, { mongoUrl })
  .then(() => {
    console.log(`resetData for ${type} database`)
    mockData(description, {
      hasProtection: true,
      jsonDataDir,
      mongoUrl
    })
  })
