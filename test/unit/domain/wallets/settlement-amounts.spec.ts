import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, displayAmountFromNumber, toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { SettlementAmounts } from "@domain/wallets/settlement-amounts"

describe("SettlementAmounts", () => {
  const txnCommon = {
    id: "id" as LedgerTransactionId,
    journalId: "journalId" as LedgerJournalId,
    walletId: "walletId" as WalletId,
    type: "type" as LedgerTransactionType,
    timestamp: new Date(Date.now()),
    pendingConfirmation: false,
    feeKnownInAdvance: true,

    fee: 0,
    feeUsd: 0,
    usd: 0,
  }

  const satsAmount = toSats(10_000)
  const satsFee = toSats(100)
  const centsAmount = toCents(200)
  const centsFee = toCents(2)
  const displayAmount = 1400 as DisplayCurrencyBaseAmount
  const displayFee = 14 as DisplayCurrencyBaseAmount
  const displayCurrency = "TTD" as DisplayCurrency

  const txnsAmounts = {
    satsAmount,
    satsFee,
    centsAmount,
    centsFee,
    displayAmount,
    displayFee,
    displayCurrency,
  }

  const expectedDisplayFeeObj = displayAmountFromNumber({
    amount: displayFee,
    currency: displayCurrency,
  })
  if (expectedDisplayFeeObj instanceof Error) throw expectedDisplayFeeObj
  const expectedDisplayFee = expectedDisplayFeeObj.displayInMajor

  const debitCreditScenarios = {
    "amount": {
      sats: satsAmount,
      cents: centsAmount,
      display: displayAmount,
    },
    "fee": {
      sats: satsFee,
      cents: centsFee,
      display: displayFee,
    },
    "amount + fee": {
      sats: satsAmount + satsFee,
      cents: centsAmount + centsFee,
      display: displayAmount + displayFee,
    },
    "amount - fee": {
      sats: satsAmount - satsFee,
      cents: centsAmount - centsFee,
      display: displayAmount - displayFee,
    },
  }

  describe("Check all possible BTC entries", () => {
    const txnForBtcWallet = {
      ...txnCommon,
      ...txnsAmounts,
      currency: WalletCurrency.Btc,
    }

    describe("debit", () => {
      for (const testCase of Object.keys(debitCreditScenarios)) {
        it(`${testCase}`, () => {
          const testValues = debitCreditScenarios[testCase]
          const debit = testValues.sats

          const expectedSettlementAmountForDebit = -debit
          const expectedDisplayAmount = -testValues.display

          const txnDebit: LedgerTransaction<"BTC"> = {
            ...txnForBtcWallet,
            credit: toSats(0),
            debit: toSats(debit),
          }
          const settlementAmounts = SettlementAmounts().fromTxn(txnDebit)
          const { settlementAmount, settlementDisplayAmount, settlementDisplayFee } =
            settlementAmounts

          const expectedDisplayAmountForDebitObj = displayAmountFromNumber({
            amount: expectedDisplayAmount,
            currency: txnDebit.displayCurrency || DisplayCurrency.Usd,
          })
          if (expectedDisplayAmountForDebitObj instanceof Error) {
            throw expectedDisplayAmountForDebitObj
          }
          const expectedDisplayAmountForDebit =
            expectedDisplayAmountForDebitObj.displayInMajor

          expect(settlementAmount).toEqual(expectedSettlementAmountForDebit)
          expect(settlementDisplayAmount).toEqual(expectedDisplayAmountForDebit)
          expect(settlementDisplayFee).toEqual(expectedDisplayFee)
        })
      }
    })

    describe("credit", () => {
      for (const testCase of Object.keys(debitCreditScenarios)) {
        it(`${testCase}`, () => {
          const testValues = debitCreditScenarios[testCase]
          const credit = testValues.sats

          const expectedSettlementAmountForCredit = credit
          const expectedDisplayAmount = testValues.display

          const txnCredit: LedgerTransaction<"BTC"> = {
            ...txnForBtcWallet,
            credit: toSats(credit),
            debit: toSats(0),
          }
          const settlementAmounts = SettlementAmounts().fromTxn(txnCredit)
          const { settlementAmount, settlementDisplayAmount, settlementDisplayFee } =
            settlementAmounts

          const expectedDisplayAmountForCreditObj = displayAmountFromNumber({
            amount: expectedDisplayAmount,
            currency: txnCredit.displayCurrency || DisplayCurrency.Usd,
          })
          if (expectedDisplayAmountForCreditObj instanceof Error) {
            throw expectedDisplayAmountForCreditObj
          }
          const expectedDisplayAmountForCredit =
            expectedDisplayAmountForCreditObj.displayInMajor

          expect(settlementAmount).toEqual(expectedSettlementAmountForCredit)
          expect(settlementDisplayAmount).toEqual(expectedDisplayAmountForCredit)
          expect(settlementDisplayFee).toEqual(expectedDisplayFee)
        })
      }
    })
  })

  describe("Check all possible USD entries", () => {
    const txnForBtcWallet = {
      ...txnCommon,
      ...txnsAmounts,
      currency: WalletCurrency.Usd,
    }

    describe("debit", () => {
      for (const testCase of Object.keys(debitCreditScenarios)) {
        it(`${testCase}`, () => {
          const testValues = debitCreditScenarios[testCase]
          const debit = testValues.cents

          const expectedSettlementAmountForDebit = -debit
          const expectedDisplayAmount = -testValues.display

          const txnDebit: LedgerTransaction<"USD"> = {
            ...txnForBtcWallet,
            credit: toCents(0),
            debit: toCents(debit),
          }
          const settlementAmounts = SettlementAmounts().fromTxn(txnDebit)
          const { settlementAmount, settlementDisplayAmount, settlementDisplayFee } =
            settlementAmounts

          const expectedDisplayAmountForDebitObj = displayAmountFromNumber({
            amount: expectedDisplayAmount,
            currency: txnDebit.displayCurrency || DisplayCurrency.Usd,
          })
          if (expectedDisplayAmountForDebitObj instanceof Error) {
            throw expectedDisplayAmountForDebitObj
          }
          const expectedDisplayAmountForDebit =
            expectedDisplayAmountForDebitObj.displayInMajor

          expect(settlementAmount).toEqual(expectedSettlementAmountForDebit)
          expect(settlementDisplayAmount).toEqual(expectedDisplayAmountForDebit)
          expect(settlementDisplayFee).toEqual(expectedDisplayFee)
        })
      }
    })

    describe("credit", () => {
      for (const testCase of Object.keys(debitCreditScenarios)) {
        it(`${testCase}`, () => {
          const testValues = debitCreditScenarios[testCase]
          const credit = testValues.cents

          const expectedSettlementAmountForCredit = credit
          const expectedDisplayAmount = testValues.display

          const txnCredit: LedgerTransaction<"USD"> = {
            ...txnForBtcWallet,
            credit: toCents(credit),
            debit: toCents(0),
          }
          const settlementAmounts = SettlementAmounts().fromTxn(txnCredit)
          const { settlementAmount, settlementDisplayAmount, settlementDisplayFee } =
            settlementAmounts

          const expectedDisplayAmountForCreditObj = displayAmountFromNumber({
            amount: expectedDisplayAmount,
            currency: txnCredit.displayCurrency || DisplayCurrency.Usd,
          })
          if (expectedDisplayAmountForCreditObj instanceof Error) {
            throw expectedDisplayAmountForCreditObj
          }
          const expectedDisplayAmountForCredit =
            expectedDisplayAmountForCreditObj.displayInMajor

          expect(settlementAmount).toEqual(expectedSettlementAmountForCredit)
          expect(settlementDisplayAmount).toEqual(expectedDisplayAmountForCredit)
          expect(settlementDisplayFee).toEqual(expectedDisplayFee)
        })
      }
    })
  })
})
