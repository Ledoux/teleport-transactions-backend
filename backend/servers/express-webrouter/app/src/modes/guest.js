import { guest,
  userSubscriptionToken
} from 'transactions-express-passport'

guest.subscriptions = guest.subscriptions.concat([
  {
    collectionName: 'subscribers',
    method: ['POST']
  }
])

export default guest
