import * as BIP39 from 'bip39'
import { PrivKey } from 'cosmos-client'

import {
  Address,
  Network,
  Prefix,
  Coin,
  GetTxsParams,
  VaultTxParams,
  NormalTxParams,
  PaginatedQueryTxs,
  BroadcastTxCommitResult,
} from './types'
import { ThorClient } from './thor/thor-client'

/**
 * Interface for custom Thorchain client
 */
export interface thorchainClient {
  getThorClient(): ThorClient
  setNetwork(net: Network): thorchainClient
  getNetwork(): Network
  getClientUrl(): string
  getExplorerUrl(): string
  getPrefix(): Prefix
  setPhrase(phrase: string): thorchainClient
  getAddress(): Promise<string | null>
  validateAddress(address: string): boolean
  getBalance(address?: Address): Promise<Coin[] | null>
  getTransactions(params?: GetTxsParams): Promise<PaginatedQueryTxs | null>
  vaultTx(params: VaultTxParams): Promise<BroadcastTxCommitResult | null>
  normalTx(params: NormalTxParams): Promise<BroadcastTxCommitResult | null>
}

class Client implements thorchainClient {
  private network: Network
  private thorClient: ThorClient
  private phrase?: string
  private address: Address | null
  private privkey: PrivKey | null

  constructor({ network = 'testnet', phrase }: { network: Network, phrase?: string }) {
    this.network = network
    this.thorClient = new ThorClient(this.getClientUrl(), this.getChainId(), this.getPrefix())
    this.thorClient.chooseNetwork(network)
    this.phrase = phrase
    this.address = null
    this.privkey = null
  }

  getThorClient(): ThorClient {
    return this.thorClient
  }

  setNetwork(network: Network): thorchainClient {
    this.network = network
    this.thorClient = new ThorClient(this.getClientUrl(), this.getChainId(), this.getPrefix())
    this.thorClient.chooseNetwork(network)
    return this
  }

  getNetwork(): Network {
    return this.network
  }

  getClientUrl = (): string => {
    return this.network === 'testnet' ? 'http://168.119.22.92:1317' : 'http://13.250.144.124:1317'
  }

  getChainId = (): string => {
    return 'thorchain'
  }

  getExplorerUrl = (): string => {
    return this.network === 'testnet' ? 'https://thorchain.net/' : 'https://thorchain.net/'
  }

  getPrefix = (): Prefix => {
    return this.network === 'testnet' ? 'tthor' : 'thor'
  }

  static generatePhrase = (): string => {
    return BIP39.generateMnemonic()
  }

  setPhrase = (phrase: string): thorchainClient => {
    if (this.phrase !== phrase) {
      if (!Client.validatePhrase(phrase)) {
        throw Error('Invalid BIP39 phrase passed to Binance Client')
      }

      this.phrase = phrase
      this.address = null
      this.privkey = null
    }
    return this
  }

  static validatePhrase = (phrase: string): boolean => {
    return BIP39.validateMnemonic(phrase)
  }

  getPrivkey = async (): Promise<PrivKey | null> => {
    if (!this.privkey && this.phrase) {
      this.privkey = await this.thorClient.getPrivKeyFromMnemonic(this.phrase)
    }

    return this.privkey
  }

  getAddress = async (): Promise<Address | null> => {
    const privkey = await this.getPrivkey()

    if (!this.address && privkey) {
      this.address = await this.thorClient.getAddressFromPrivKey(privkey)
    }

    return this.address
  }

  validateAddress = (address: Address): boolean => {
    return this.thorClient.checkAddress(address)
  }

  getBalance = async (address?: Address): Promise<Coin[] | null> => {
    const req_addr = address || await this.getAddress()
    if (req_addr) {
      return await this.thorClient.getBalance(req_addr)
    }
    return null
  }

  getTransactions = async (params: GetTxsParams = {}): Promise<PaginatedQueryTxs | null> => {
    const {
      messageAction,
      messageSender,
      page,
      limit,
      txMinHeight,
      txMaxHeight,
    } = params

    return await this.thorClient.searchTx(messageAction, messageSender, page, limit, txMinHeight, txMaxHeight)
  }

  vaultTx = async ({ addressFrom, addressTo, amount, asset, memo }: VaultTxParams): Promise<BroadcastTxCommitResult | null> => {
    const from = addressFrom || await this.getAddress()
    const privkey = await this.getPrivkey()
    if (!from) {
      return Promise.reject(
        new Error(
          'Parameter `addressFrom` has to be set. Or set a phrase by calling `setPhrase` before to use an address of an imported key.',
        ),
      )
    } else if (!privkey) {
      return Promise.reject(
        new Error(
          'Set privkey by calling `setPhrase` before to use an address of an imported key.',
        ),
      )
    }
    return await this.thorClient.transfer(privkey, from, addressTo, amount, asset, memo)
  }

  normalTx = async ({ addressFrom, addressTo, amount, asset }: NormalTxParams): Promise<BroadcastTxCommitResult | null> => {
    const from = addressFrom || await this.getAddress()
    const privkey = await this.getPrivkey()
    if (!from) {
      return Promise.reject(
        new Error(
          'Parameter `addressFrom` has to be set. Or set a phrase by calling `setPhrase` before to use an address of an imported key.',
        ),
      )
    } else if (!privkey) {
      return Promise.reject(
        new Error(
          'Set privkey by calling `setPhrase` before to use an address of an imported key.',
        ),
      )
    }
    return await this.thorClient.transfer(privkey, from, addressTo, amount, asset)
  }
}

export { Client }
