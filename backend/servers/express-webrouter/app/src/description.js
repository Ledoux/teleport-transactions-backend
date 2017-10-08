import path from 'path'
import { createDescriptionFromDir } from 'transactions-express-data'

const description = createDescriptionFromDir(
  path.join(__dirname, 'models'), {
    isAllDeepJoins: true,
    isAllJoins: true
  })

export default description
