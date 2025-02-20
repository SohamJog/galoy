import { DisplayCurrency } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

import {
  getCurrentPriceAsDisplayPriceRatio,
  getCurrentPriceAsWalletPriceRatio,
} from "@app/prices"
import { LedgerService } from "@services/ledger"
import { WalletsRepository, UsersRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"
import { wrapAsyncToRunInSpan } from "@services/tracing"

import { getRecentlyActiveAccounts } from "./active-accounts"

export const sendDefaultWalletBalanceToAccounts = async () => {
  const accounts = getRecentlyActiveAccounts()
  if (accounts instanceof Error) throw accounts

  const notifyUser = wrapAsyncToRunInSpan({
    namespace: "daily-balance-notification",
    fn: async (account: Account): Promise<void | ApplicationError> => {
      const user = await UsersRepository().findById(account.kratosUserId)
      if (user instanceof Error) return user
      if (user.deviceTokens.length === 0) return

      const wallet = await WalletsRepository().findById(account.defaultWalletId)
      if (wallet instanceof Error) return wallet

      const balanceAmount = await LedgerService().getWalletBalanceAmount(wallet)
      if (balanceAmount instanceof Error) return balanceAmount

      const { displayCurrency } = account
      const displayPriceRatio = await getCurrentPriceAsDisplayPriceRatio({
        currency: displayCurrency,
      })

      let displayAmount: DisplayAmount<DisplayCurrency> | undefined
      if (!(displayPriceRatio instanceof Error)) {
        if (balanceAmount.currency === WalletCurrency.Btc) {
          displayAmount = displayPriceRatio.convertFromWallet(
            balanceAmount as BtcPaymentAmount,
          )
        }

        if (balanceAmount.currency === WalletCurrency.Usd) {
          const usdWalletPriceRatio = await getCurrentPriceAsWalletPriceRatio({
            currency: DisplayCurrency.Usd,
          })

          if (!(usdWalletPriceRatio instanceof Error)) {
            const btcBalanceAmount = usdWalletPriceRatio.convertFromUsd(
              balanceAmount as UsdPaymentAmount,
            )
            displayAmount = displayPriceRatio.convertFromWallet(btcBalanceAmount)
          }
        }
      }

      return NotificationsService().sendBalance({
        balanceAmount,
        deviceTokens: user.deviceTokens,
        displayBalanceAmount: displayAmount,
        recipientLanguage: user.language,
      })
    },
  })

  for await (const account of accounts) {
    await notifyUser(account)
  }
}
