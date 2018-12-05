import nock from 'nock'
import Tx from '../lib/tx/tx'
import {DEFAULT_HTTP_HOST} from '../lib/config'
import {
    miner,
    emptyAccount,
    currentBlock,
    block1,
    block0,
    currentHeight,
    oneChangeLogsBlock,
    chainID,
    HxGasPriceAdvice,
    nodeVersion,
    isMining,
    peersCount,
    infos,
} from './datas'

const mockInfos = [
    {
        method: 'account_getAccount',
        paramsCount: 1,
        reply([address]) {
            const result = address === miner.address ? miner : emptyAccount
            return {...result, address}
        },
    },
    {
        method: 'account_getBalance',
        paramsCount: 1,
        reply([address]) {
            return address === miner.address ? miner.balance : emptyAccount.balance
        },
    },
    {
        method: 'chain_latestStableBlock',
        paramsCount: 1,
        reply([withBody]) {
            return withBody ? currentBlock : {...currentBlock, transactions: null}
        },
    },
    {
        method: 'chain_currentBlock',
        paramsCount: 1,
        reply([withBody]) {
            return withBody ? currentBlock : {...currentBlock, transactions: null}
        },
    },
    {
        method: 'chain_getBlockByHeight',
        paramsCount: 2,
        reply([height, withBody]) {
            let result = null
            if (height === 2) {
                result = currentBlock
            } else if (height === 1) {
                result = block1
            } else if (height === 0) {
                result = block0
            }
            if (result && !withBody) {
                result = {...result, transactions: null}
            }
            return result
        },
    },
    {
        method: 'chain_getBlockByHash',
        paramsCount: 2,
        reply([hash, withBody]) {
            let result = null
            if (hash === currentBlock.header.hash) {
                result = currentBlock
            } else if (hash === block1.header.hash) {
                result = block1
            } else if (hash === block0.header.hash) {
                result = block0
            }
            if (result && !withBody) {
                result = {...result, transactions: null}
            }
            return result
        },
    },
    {
        method: 'chain_latestStableHeight',
        paramsCount: 0,
        reply() {
            return currentHeight
        },
    },
    {
        method: 'chain_currentHeight',
        paramsCount: 0,
        reply() {
            return currentHeight
        },
    },
    {
        method: 'chain_genesis',
        paramsCount: 0,
        reply() {
            return oneChangeLogsBlock
        },
    },
    {
        method: 'chain_chainID',
        paramsCount: 0,
        reply() {
            return chainID
        },
    },
    {
        method: 'chain_gasPriceAdvice',
        paramsCount: 0,
        reply() {
            return HxGasPriceAdvice
        },
    },
    {
        method: 'chain_nodeVersion',
        paramsCount: 0,
        reply() {
            return nodeVersion
        },
    },
    {
        method: 'mine_isMining',
        paramsCount: 0,
        reply() {
            return isMining
        },
    },
    {
        method: 'mine_miner',
        paramsCount: 0,
        reply() {
            return miner.address
        },
    },
    {
        method: 'net_peersCount',
        paramsCount: 0,
        reply() {
            return peersCount
        },
    },
    {
        method: 'net_info',
        paramsCount: 0,
        reply() {
            return infos
        },
    },
    {
        method: 'tx_sendTx',
        paramsCount: 1,
        reply([txConfig]) {
            const tx = new Tx(txConfig)
            return `0x${tx.hash().toString('hex')}`
        },
    },
]

function startMock() {
    nock(DEFAULT_HTTP_HOST)
    // .log(console.log)
        .post('/', body => {
            const mockInfo = mockInfos.find(info => info.method === body.method)
            return (
                body.jsonrpc === '2.0' &&
                typeof body.id === 'number' &&
                Array.isArray(body.params) &&
                mockInfo &&
                body.params.length === mockInfo.paramsCount
            )
        })
        .times(10000000000)
        .reply((uri, body) => {
            const mockInfo = mockInfos.find(info => info.method === body.method)
            const result = mockInfo.reply(body.params)
            return [
                200,
                {
                    jsonrpc: '2.0',
                    id: 123,
                    result,
                },
            ]
        })
}

startMock()
