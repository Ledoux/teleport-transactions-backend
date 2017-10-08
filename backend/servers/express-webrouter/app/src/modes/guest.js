import { guest,
  userSubscriptionToken
} from 'transactions-express-passport'

guest.subscriptions = guest.subscriptions.concat([
  {
    collectionName: 'articleVerdicts'
  },
  {
    collectionName: 'claimVerdicts'
  }
])

export default guest
