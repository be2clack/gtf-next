import prisma from '@/lib/prisma'
import { addMinutes, isAfter } from 'date-fns'

const PIN_LENGTH = 6
const PIN_EXPIRY_MINUTES = 5
const MAX_ATTEMPTS = 5

/**
 * Generate a random PIN code
 */
export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Create a new login PIN for a phone number
 */
export async function createLoginPin(phone: string, userId?: number): Promise<{
  pin: string
  expiresAt: Date
}> {
  const pin = generatePin()
  const expiresAt = addMinutes(new Date(), PIN_EXPIRY_MINUTES)

  // Delete any existing pins for this phone
  await prisma.loginPin.deleteMany({
    where: { phone },
  })

  // Create new pin
  await prisma.loginPin.create({
    data: {
      phone,
      userId,
      code: pin,
      expiresAt,
      attemptCount: 0,
    },
  })

  return { pin, expiresAt }
}

/**
 * Verify a PIN code
 */
export async function verifyPin(phone: string, code: string): Promise<{
  success: boolean
  userId?: number
  error?: string
}> {
  const loginPin = await prisma.loginPin.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
  })

  if (!loginPin) {
    return { success: false, error: 'PIN not found. Please request a new one.' }
  }

  // Check if expired
  if (isAfter(new Date(), loginPin.expiresAt)) {
    await prisma.loginPin.delete({ where: { id: loginPin.id } })
    return { success: false, error: 'PIN has expired. Please request a new one.' }
  }

  // Check max attempts
  if (loginPin.attemptCount >= MAX_ATTEMPTS) {
    await prisma.loginPin.delete({ where: { id: loginPin.id } })
    return { success: false, error: 'Too many attempts. Please request a new PIN.' }
  }

  // Verify code
  if (loginPin.code !== code) {
    await prisma.loginPin.update({
      where: { id: loginPin.id },
      data: { attemptCount: loginPin.attemptCount + 1 },
    })
    return {
      success: false,
      error: `Invalid PIN. ${MAX_ATTEMPTS - loginPin.attemptCount - 1} attempts remaining.`
    }
  }

  // Success - mark as used and return
  await prisma.loginPin.update({
    where: { id: loginPin.id },
    data: { usedAt: new Date() },
  })

  return { success: true, userId: loginPin.userId ?? undefined }
}

/**
 * Find or create user by phone
 */
export async function findOrCreateUserByPhone(phone: string): Promise<{
  user: { id: number; name: string; type: string; federationId: number | null }
  isNew: boolean
}> {
  // First try to find existing user
  let user = await prisma.user.findFirst({
    where: { phone },
    select: { id: true, name: true, type: true, federationId: true },
  })

  if (user) {
    return { user, isNew: false }
  }

  // Try to find sportsman by phone
  const sportsman = await prisma.sportsman.findFirst({
    where: { phone },
    select: { id: true, firstName: true, lastName: true, federationId: true },
  })

  if (sportsman) {
    // Create user for sportsman
    user = await prisma.user.create({
      data: {
        name: `${sportsman.lastName || ''} ${sportsman.firstName || ''}`.trim() || 'User',
        phone,
        type: 'SPORTSMAN',
        entityId: sportsman.id,
        federationId: sportsman.federationId,
      },
      select: { id: true, name: true, type: true, federationId: true },
    })
    return { user, isNew: true }
  }

  // Try to find trainer by phone
  const trainer = await prisma.trainer.findFirst({
    where: { phone },
    select: { id: true, firstName: true, lastName: true, federationId: true },
  })

  if (trainer) {
    user = await prisma.user.create({
      data: {
        name: `${trainer.lastName || ''} ${trainer.firstName || ''}`.trim() || 'Trainer',
        phone,
        type: 'TRAINER',
        entityId: trainer.id,
        federationId: trainer.federationId,
      },
      select: { id: true, name: true, type: true, federationId: true },
    })
    return { user, isNew: true }
  }

  // Try to find representative by phone
  const representative = await prisma.representative.findFirst({
    where: { phone },
    select: { id: true, firstName: true, lastName: true },
  })

  if (representative) {
    user = await prisma.user.create({
      data: {
        name: `${representative.lastName || ''} ${representative.firstName || ''}`.trim() || 'Representative',
        phone,
        type: 'REPRESENTATIVE',
        entityId: representative.id,
      },
      select: { id: true, name: true, type: true, federationId: true },
    })
    return { user, isNew: true }
  }

  // No matching entity found - create as new user
  user = await prisma.user.create({
    data: {
      name: 'New User',
      phone,
      type: 'REPRESENTATIVE', // Default type for new users
    },
    select: { id: true, name: true, type: true, federationId: true },
  })

  return { user, isNew: true }
}
