import path from 'path'
import { createAuthorizationFromDir } from 'transactions-express-data'

import description from './description'

const authorization = createAuthorizationFromDir(path.join(__dirname, 'modes'), {
  description,
  isAllJoins: true,
  isAllDeepJoins: true
})

export default authorization
