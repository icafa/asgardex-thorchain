import { Client } from '../src/client'

const phrase = 'rural bright ball negative already grass good grant nation screen model pizza'
const validator = 'thor1mhrfyf2hyrfclauv3gw4t9gnasc6axxypek0ug'

const test_mainnet = async () => {
  console.log('Main Net Testing...')

  const thorchainClient = new Client({ phrase, network: 'mainnet' })
  console.log('Network      : ', thorchainClient.getNetwork())
  console.log('Client URL   : ', thorchainClient.getClientUrl())
  console.log('Explorer URL : ', thorchainClient.getExplorerUrl())
  console.log('Prefix       : ', thorchainClient.getPrefix())

  thorchainClient.setPhrase(phrase)
  console.log('Address      : ', await thorchainClient.getAddress())
  console.log('Is valid address? : ', thorchainClient.validateAddress('thor1vr2qu5a64tqq9m6mh3d0ghe8yxwzxhfqahkxwa'))
  console.log('Balance      : ', await thorchainClient.getBalance(validator))
  console.log('Transactions : ', await thorchainClient.getTransactions({
    messageSender: 'thor1v8ppstuf6e3x0r4glqc68d5jqcs2tf38cg2q6y'
  }))
  console.log('Vault TX     : ', await thorchainClient.vaultTx({
    addressTo: 'thor1vr2qu5a64tqq9m6mh3d0ghe8yxwzxhfqahkxwa',
    amount: '100',
    asset: 'thor',
    memo: 'transfer'
  }))
  console.log('Normal TX    : ', await thorchainClient.normalTx({
    addressTo: 'thor1vr2qu5a64tqq9m6mh3d0ghe8yxwzxhfqahkxwa',
    amount: '100',
    asset: 'thor',
  }))
}

const test_testnet = async () => {
  console.log('Test Net Testing...')

  const thorchainClient = new Client({ phrase, network: 'testnet' })
  console.log('Network      : ', thorchainClient.getNetwork())
  console.log('Client URL   : ', thorchainClient.getClientUrl())
  console.log('Explorer URL : ', thorchainClient.getExplorerUrl())
  console.log('Prefix       : ', thorchainClient.getPrefix())

  thorchainClient.setPhrase(phrase)
  console.log('Address      : ', await thorchainClient.getAddress())
  console.log('Is valid address? : ', thorchainClient.validateAddress('tthor1xkc5syzd8mmsr5yjg0nrrwkyj7r9r5takaflf3'))
  console.log('Vault TX     : ', await thorchainClient.vaultTx({
    addressTo: 'tthor1xkc5syzd8mmsr5yjg0nrrwkyj7r9r5takaflf3',
    amount: '100',
    asset: 'thor',
    memo: 'transfer'
  }))
  console.log('Normal TX    : ', await thorchainClient.normalTx({
    addressTo: 'tthor1xkc5syzd8mmsr5yjg0nrrwkyj7r9r5takaflf3',
    amount: '100',
    asset: 'thor',
  }))
}

const main = async () => {
  await test_mainnet()
  await test_testnet()
}

main()
