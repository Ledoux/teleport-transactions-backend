require('babel-polyfill')
const env = require('node-env-file')
const { resetData } = require('transactions-express-data')

env(__dirname + '/' + (process.env.TYPE || 'development') + '_secret.sh')

resetData({ mongoUrl: process.env.MONGO_URL })
