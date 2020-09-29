import { BigSource } from 'big.js'
import { Coin, PaginatedQueryTxs, BroadcastTxCommitResult} from 'cosmos-client/api'

import { NETWORK_PREFIX_MAPPING } from './thor/types'

export type { Coin, PaginatedQueryTxs, BroadcastTxCommitResult }

export type Address = string

export type Network = keyof typeof NETWORK_PREFIX_MAPPING

export type Prefix = typeof NETWORK_PREFIX_MAPPING[Network]

export type GetTxsParams = {
  messageAction?: string
  messageSender?: string
  page?: number
  limit?: number
  txMinHeight?: number
  txMaxHeight?: number
}

export type VaultTxParams = {
  addressFrom?: Address
  addressTo: Address
  amount: BigSource
  asset: string
  memo: string
}

export type NormalTxParams = {
  addressFrom?: Address
  addressTo: Address
  amount: BigSource
  asset: string
}
