// Google Pay Configuration & Request Specification Matrix

export const baseGPayRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
  allowedPaymentMethods: [
    {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
      },
      tokenizationSpecification: {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          'gateway': 'example',
          'gatewayMerchantId': 'exampleGatewayMerchantId'
        }
      }
    }
  ],
  transactionInfo: {
    totalPriceStatus: 'FINAL',
    totalPriceLabel: 'Total',
    totalPrice: '0.00',
    currencyCode: 'INR',
    countryCode: 'IN'
  },
  merchantInfo: {
    merchantName: 'Vibe Dev Engine'
  }
};

/**
 * Validates if the user's browser/device is configured to support Google Pay transactions
 */
export async function checkGPayReady(paymentsClient: any): Promise<boolean> {
  try {
    const isReadyToPayRequest = {
      apiVersion: baseGPayRequest.apiVersion,
      apiVersionMinor: baseGPayRequest.apiVersionMinor,
      allowedPaymentMethods: baseGPayRequest.allowedPaymentMethods
    };
    const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
    return response.result;
  } catch (err) {
    console.error("Google Pay readiness check failed:", err);
    return false;
  }
}