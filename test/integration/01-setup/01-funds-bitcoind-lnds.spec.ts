import { btc2sat } from "src/utils"
import { baseLogger } from "src/logger"
import { getFunderWallet } from "src/walletFactory"
import {
  lnd1,
  lndOutside1,
  bitcoindClient,
  getChainBalance,
  fundLnd,
  waitUntilSyncAll,
  checkIsBalanced,
  getUserWallet,
  waitUntilBlockHeight,
} from "test/helpers"

jest.mock("src/realtimePrice", () => require("test/mocks/realtimePrice"))

const defaultWallet = ""

describe("Bitcoind", () => {
  it("create default wallet", async () => {
    try {
      const { name } = await bitcoindClient.createWallet(defaultWallet)
      // depends of bitcoind version. needed in < 0.20 but failed in 0.21?
      expect(name).toBe(defaultWallet)
    } catch (error) {
      baseLogger.warn({ error }, "bitcoind wallet already exists")
    }
    const wallets = await bitcoindClient.listWallets()
    expect(wallets).toContain("")
  })

  it("should be funded mining 10 blocks", async () => {
    const numOfBlock = 10
    const bitcoindAddress = await bitcoindClient.getNewAddress()
    await bitcoindClient.mineAndConfirm(numOfBlock, bitcoindAddress)
    const balance = await bitcoindClient.getBalance()
    expect(balance).toBeGreaterThanOrEqual(50 * numOfBlock)
  })

  it("funds outside lnd node", async () => {
    const amount = 1
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lndOutside1 })
    const sats = initialBalance + btc2sat(amount)
    await fundLnd(lndOutside1, amount)
    const { chain_balance: balance } = await getChainBalance({ lnd: lndOutside1 })
    expect(balance).toBe(sats)
  })

  it("funds lnd1 node", async () => {
    const amount = 1
    const { chain_balance: initialBalance } = await getChainBalance({ lnd: lnd1 })
    const sats = initialBalance + btc2sat(amount)

    // load funder wallet before use it
    await getUserWallet(4)
    const funderWallet = await getFunderWallet({ logger: baseLogger })
    const address = await funderWallet.getOnChainAddress()

    await bitcoindClient.sendToAddressAndConfirm(address, amount)
    await waitUntilBlockHeight({ lnd: lnd1 })

    const { chain_balance: balance } = await getChainBalance({ lnd: lnd1 })
    expect(balance).toBe(sats)
    await checkIsBalanced()
  })
})
