import { GT } from "@graphql/index"
import Memo from "@graphql/types/scalar/memo"
import { mapAndParseErrorForGqlResponse } from "@graphql/error-map"
import WalletId from "@graphql/types/scalar/wallet-id"
import SatsAmount from "@graphql/types/scalar/sat-amount"
import OnChainAddress from "@graphql/types/scalar/on-chain-address"
import PaymentSendPayload from "@graphql/types/payload/payment-send"
import TargetConfirmations from "@graphql/types/scalar/target-confirmations"
import { Wallets } from "@app"

const OnChainUsdPaymentSendAsBtcDenominatedInput = GT.Input({
  name: "OnChainUsdPaymentSendAsBtcDenominatedInput",
  fields: () => ({
    walletId: { type: GT.NonNull(WalletId) },
    address: { type: GT.NonNull(OnChainAddress) },
    amount: { type: GT.NonNull(SatsAmount) },
    memo: { type: Memo },
    targetConfirmations: { type: TargetConfirmations, defaultValue: 1 },
  }),
})

const OnChainUsdPaymentSendAsBtcDenominatedMutation = GT.Field<
  {
    input: {
      walletId: WalletId | InputValidationError
      address: OnChainAddress | InputValidationError
      amount: number
      memo: Memo | InputValidationError | null
      targetConfirmations: TargetConfirmations | InputValidationError
    }
  },
  null,
  GraphQLContextAuth
>({
  extensions: {
    complexity: 120,
  },
  type: GT.NonNull(PaymentSendPayload),
  args: {
    input: { type: GT.NonNull(OnChainUsdPaymentSendAsBtcDenominatedInput) },
  },
  resolve: async (_, args, { domainAccount }) => {
    const { walletId, address, amount, memo, targetConfirmations } = args.input

    if (walletId instanceof Error) {
      return { errors: [{ message: walletId.message }] }
    }

    if (address instanceof Error) {
      return { errors: [{ message: address.message }] }
    }

    if (memo instanceof Error) {
      return { errors: [{ message: memo.message }] }
    }

    if (targetConfirmations instanceof Error) {
      return { errors: [{ message: targetConfirmations.message }] }
    }

    const status = await Wallets.payOnChainByWalletIdForUsdWalletAndBtcAmount({
      senderAccount: domainAccount,
      senderWalletId: walletId,
      amount,
      address,
      targetConfirmations,
      memo,
      sendAll: false,
    })

    if (status instanceof Error) {
      return { status: "failed", errors: [mapAndParseErrorForGqlResponse(status)] }
    }

    return {
      errors: [],
      status: status.value,
    }
  },
})

export default OnChainUsdPaymentSendAsBtcDenominatedMutation
