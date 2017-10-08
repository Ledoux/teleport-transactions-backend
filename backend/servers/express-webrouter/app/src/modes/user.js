import { user,
  userSubscriptionToken
} from 'transactions-express-passport'

user.subscriptions = [
  {
    collectionName: 'notifications',
    tokens: [userSubscriptionToken]
  }
]

export default user
