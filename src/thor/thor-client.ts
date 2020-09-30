import { BigSource } from 'big.js'
import { CosmosSDK, AccAddress, PrivKeyEd25519, PrivKey } from 'cosmos-client'
import { auth } from 'cosmos-client/x/auth'
import { bank } from 'cosmos-client/x/bank'
import { codec } from 'cosmos-client/codec'

import { MsgSend, NETWORK_PREFIX_MAPPING } from './types'

export class ThorClient {
  sdk: CosmosSDK

  server: string
  chainId: string
  prefix: string
  network: keyof typeof NETWORK_PREFIX_MAPPING = 'testnet'

  constructor(server: string, chainId: string, prefix: string) {
    this.server = server
    this.chainId = chainId
    this.prefix = prefix
    this.sdk = new CosmosSDK(this.server, this.chainId)
    this.chooseNetwork('testnet')

    codec.registerCodec('thorchain/MsgSend', MsgSend, MsgSend.fromJSON)
  }

  chooseNetwork(network: keyof typeof NETWORK_PREFIX_MAPPING) {
    this.network = network
    AccAddress.setBech32Prefix(
      this.prefix,
      this.prefix + 'pub',
      this.prefix + 'valoper',
      this.prefix + 'valoperpub',
      this.prefix + 'valcons',
      this.prefix + 'valconspub',
    )
  }

  async getAddressFromPrivKey(privkey: PrivKey) {
    return AccAddress.fromPublicKey(privkey.getPubKey()).toBech32()
  }

  async getPrivKeyFromMnemonic(mnemonic: string) {
    const privKeyBuffer = await this.sdk.generatePrivKeyFromMnemonic(mnemonic)
    return new PrivKeyEd25519(privKeyBuffer)
  }

  checkAddress(address: string) {
    try {
      if (!address.startsWith(this.prefix)) {
        return false
      }

      const account = AccAddress.fromBech32(address)
      return account.toBech32() == address
    } catch (err) {
      return false
    }
  }

  async getBalance(address: string) {
    try {
      const accAddress = AccAddress.fromBech32(address)
      const account = await auth.accountsAddressGet(this.sdk, accAddress).then((res) => res.data.result)

      return account.coins
    } catch (err) {
      console.log('getBalance error')
      return null
    }
  }

  async searchTx(
    messageAction?: string,
    messageSender?: string,
    page?: number,
    limit?: number,
    txMinHeight?: number,
    txMaxHeight?: number,
  ) {
    try {
      const search_result = await auth
        .txsGet(this.sdk, messageAction, messageSender, page, limit, txMinHeight, txMaxHeight)
        .then((res) => res.data)

      return {
        ...search_result,
        txs: search_result.txs?.map((tx: any) => {
          return {
            hash: tx.txhash,
            height: tx.height,
            tx: tx.tx,
            result: {
              log: tx.raw_log,
              gas_wanted: tx.gas_wanted,
              gas_used: tx.gas_used,
              tags: tx.logs,
            },
          }
        }),
      }
    } catch (err) {
      console.log('searchTx error')
      return null
    }
  }

  async transfer(privkey: PrivKey, from: string, to: string, amount: BigSource, asset: string, memo?: string) {
    try {
      const fromAddress = AccAddress.fromBech32(from)
      const toAddress = AccAddress.fromBech32(to)

      const account = await auth.accountsAddressGet(this.sdk, fromAddress).then((res) => res.data.result)

      const unsignedStdTx = await bank
        .accountsAddressTransfersPost(this.sdk, toAddress, {
          base_req: {
            from: fromAddress.toBech32(),
            memo: memo,
            chain_id: this.sdk.chainID,
            account_number: account.account_number.toString(),
            sequence: account.sequence.toString(),
            gas: '',
            gas_adjustment: '',
            fees: [],
            simulate: false,
          },
          amount: [{ denom: asset, amount: amount.toString() }],
        })
        .then((res) => res.data)

      unsignedStdTx.msg = unsignedStdTx.msg.map((msg: any) => {
        return MsgSend.fromJSON({
          from_address: msg.from_address.toBech32(),
          to_address: msg.to_address.toBech32(),
          amount: msg.amount,
        })
      })

      const signedStdTx = auth.signStdTx(
        this.sdk,
        privkey,
        unsignedStdTx,
        account.account_number.toString(),
        account.sequence.toString(),
      )

      const result = await auth.txsPost(this.sdk, signedStdTx, 'sync').then((res) => res.data)

      return result
    } catch (err) {
      console.log('transfer error')
      return null
    }
  }
}
