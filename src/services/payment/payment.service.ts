import prisma from '@/lib/prisma'
import { PaymentStatus, PaymentMethod, Prisma } from '@prisma/client'

/**
 * Payment service for membership and competition fees
 * Supports PayBox (Kyrgyzstan) and Stripe (International)
 */

export interface PaymentResult {
  url: string
  transactionId: string
}

export interface CreatePaymentInput {
  membershipId?: number
  userId?: number
  amount: number
  currency: string
  method?: PaymentMethod
}

export interface CompetitionPaymentResult {
  paymentId: number
  originalAmount: number
  originalCurrency: string
  convertedAmount: number
  exchangeRate: number
}

export class PaymentService {
  /**
   * Create membership payment
   */
  async createMembershipPayment(
    membershipId: number,
    amount: number,
    currency = 'KGS',
    method: PaymentMethod = 'ONLINE',
    userId?: number
  ) {
    return prisma.membershipPayment.create({
      data: {
        membershipId,
        userId,
        amount: new Prisma.Decimal(amount),
        currency,
        method,
        status: 'PENDING',
      },
    })
  }

  /**
   * Initiate online payment (PayBox / Stripe)
   */
  async initiateOnlinePayment(
    paymentId: number,
    gateway: 'paybox' | 'stripe' = 'paybox'
  ): Promise<PaymentResult> {
    const payment = await prisma.membershipPayment.findUnique({
      where: { id: paymentId },
      include: {
        membership: true,
      },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    if (gateway === 'paybox') {
      return this.initiatePayBoxPayment(payment)
    } else if (gateway === 'stripe') {
      return this.initiateStripePayment(payment)
    }

    throw new Error(`Unsupported payment gateway: ${gateway}`)
  }

  /**
   * PayBox integration (Kyrgyzstan)
   */
  private async initiatePayBoxPayment(payment: {
    id: number
    amount: Prisma.Decimal
    currency: string
    membershipId: number
  }): Promise<PaymentResult> {
    const merchantId = process.env.PAYBOX_MERCHANT_ID
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const params = new URLSearchParams({
      pg_merchant_id: merchantId || '',
      pg_amount: payment.amount.toString(),
      pg_currency: payment.currency,
      pg_description: `Членский взнос #${payment.membershipId}`,
      pg_order_id: payment.id.toString(),
      pg_success_url: `${baseUrl}/payment/success`,
      pg_failure_url: `${baseUrl}/payment/failure`,
      pg_result_url: `${baseUrl}/api/v1/payment/callback/paybox`,
    })

    // Generate signature (TODO: implement actual signature)
    // params.append('pg_sig', this.generatePayBoxSignature(params))

    const paymentUrl = `https://api.paybox.money/payment.php?${params.toString()}`
    const transactionId = `PB_${this.generateRandomString(20)}`

    // Update payment with transaction ID
    await prisma.membershipPayment.update({
      where: { id: payment.id },
      data: { transactionId },
    })

    return {
      url: paymentUrl,
      transactionId,
    }
  }

  /**
   * Stripe integration (International)
   */
  private async initiateStripePayment(payment: {
    id: number
    amount: Prisma.Decimal
    currency: string
  }): Promise<PaymentResult> {
    // TODO: Real Stripe integration
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // const session = await stripe.checkout.sessions.create({...})

    const transactionId = `STRIPE_${this.generateRandomString(20)}`

    await prisma.membershipPayment.update({
      where: { id: payment.id },
      data: { transactionId },
    })

    return {
      url: 'https://checkout.stripe.com/pay/xxx',
      transactionId,
    }
  }

  /**
   * Handle payment callback from payment system
   */
  async handlePaymentCallback(
    data: Record<string, string>,
    gateway: 'paybox' | 'stripe'
  ): Promise<boolean> {
    if (gateway === 'paybox') {
      return this.handlePayBoxCallback(data)
    } else if (gateway === 'stripe') {
      return this.handleStripeCallback(data)
    }

    return false
  }

  /**
   * PayBox callback handler
   */
  private async handlePayBoxCallback(data: Record<string, string>): Promise<boolean> {
    const orderId = data.pg_order_id
    const status = parseInt(data.pg_result || '0')

    if (!orderId) {
      return false
    }

    const payment = await prisma.membershipPayment.findUnique({
      where: { id: parseInt(orderId) },
    })

    if (!payment) {
      return false
    }

    if (status === 1) {
      // Successful payment
      await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          transactionId: data.pg_payment_id || payment.transactionId,
          paidAt: new Date(),
          confirmationData: data as unknown as Prisma.JsonObject,
        },
      })

      // Activate membership
      await prisma.membership.update({
        where: { id: payment.membershipId },
        data: { status: 'ACTIVE' },
      })

      return true
    } else {
      // Failed payment
      await prisma.membershipPayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          confirmationData: {
            error: data.pg_failure_description || 'Payment failed',
            ...data,
          } as unknown as Prisma.JsonObject,
        },
      })

      return false
    }
  }

  /**
   * Stripe callback handler
   */
  private async handleStripeCallback(_data: Record<string, string>): Promise<boolean> {
    // TODO: Implement Stripe webhook handling
    return false
  }

  /**
   * Get competition fee with early bird discount check
   */
  async getCompetitionFee(competitionId: number): Promise<number> {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        isPaid: true,
        entryFee: true,
        earlyBirdFee: true,
        earlyBirdDeadline: true,
      },
    })

    if (!competition || !competition.isPaid) {
      return 0
    }

    // Check early bird deadline
    if (
      competition.earlyBirdDeadline &&
      competition.earlyBirdFee &&
      new Date() < competition.earlyBirdDeadline
    ) {
      return competition.earlyBirdFee.toNumber()
    }

    return competition.entryFee?.toNumber() || 0
  }

  /**
   * Create competition registration payment with currency conversion
   */
  async createCompetitionPayment(
    competitionId: number,
    sportsmanId: number,
    targetCurrency: string
  ): Promise<CompetitionPaymentResult> {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        currency: true,
        isPaid: true,
        entryFee: true,
        earlyBirdFee: true,
        earlyBirdDeadline: true,
      },
    })

    if (!competition) {
      throw new Error('Competition not found')
    }

    const originalAmount = await this.getCompetitionFee(competitionId)
    const originalCurrency = competition.currency || 'USD'

    let convertedAmount = originalAmount
    let exchangeRate = 1.0

    // Convert if currencies are different
    if (originalCurrency !== targetCurrency) {
      const rate = await this.getExchangeRate(originalCurrency, targetCurrency)
      if (rate) {
        exchangeRate = rate
        convertedAmount = Math.round(originalAmount * exchangeRate * 100) / 100
      } else {
        throw new Error(`Cannot get exchange rate ${originalCurrency} → ${targetCurrency}`)
      }
    }

    // Create payment in sportsman's federation currency
    const payment = await prisma.membershipPayment.create({
      data: {
        membershipId: 0, // Will be linked later
        amount: new Prisma.Decimal(convertedAmount),
        currency: targetCurrency,
        method: 'ONLINE',
        status: 'PENDING',
        paymentDetails: {
          competitionId: competition.id,
          sportsmanId,
          originalAmount,
          originalCurrency,
          convertedAmount,
          targetCurrency,
          exchangeRate,
          conversionDate: new Date().toISOString(),
        },
      },
    })

    return {
      paymentId: payment.id,
      originalAmount,
      originalCurrency,
      convertedAmount,
      exchangeRate,
    }
  }

  /**
   * Get exchange rate between currencies
   */
  async getExchangeRate(from: string, to: string): Promise<number | null> {
    const rate = await prisma.currencyExchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: from,
          toCurrency: to,
        },
      },
    })

    return rate?.rate.toNumber() || null
  }

  /**
   * Update exchange rates (should be called periodically)
   */
  async updateExchangeRates(rates: { from: string; to: string; rate: number }[]) {
    for (const { from, to, rate } of rates) {
      await prisma.currencyExchangeRate.upsert({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: from,
            toCurrency: to,
          },
        },
        create: {
          fromCurrency: from,
          toCurrency: to,
          rate: new Prisma.Decimal(rate),
        },
        update: {
          rate: new Prisma.Decimal(rate),
        },
      })
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: number) {
    return prisma.membershipPayment.findUnique({
      where: { id },
      include: {
        membership: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Get payments for membership
   */
  async getPaymentsForMembership(membershipId: number) {
    return prisma.membershipPayment.findMany({
      where: { membershipId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Confirm manual payment (by admin)
   */
  async confirmManualPayment(paymentId: number, confirmedById: number, notes?: string) {
    return prisma.membershipPayment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        confirmedById,
        confirmedAt: new Date(),
        paidAt: new Date(),
        confirmationData: notes ? { notes } : undefined,
      },
    })
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: number, reason?: string) {
    const payment = await prisma.membershipPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment || payment.status !== 'PAID') {
      throw new Error('Payment not found or not paid')
    }

    return prisma.membershipPayment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        confirmationData: {
          ...(payment.confirmationData as object || {}),
          refundReason: reason,
          refundedAt: new Date().toISOString(),
        },
      },
    })
  }

  /**
   * Generate random string for transaction IDs
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
}

export const paymentService = new PaymentService()