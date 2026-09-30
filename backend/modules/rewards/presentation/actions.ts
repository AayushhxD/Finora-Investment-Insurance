'use server'
import { revalidatePath } from 'next/cache'
import { getStore, logActivity } from '@backend/infrastructure/mock-store/store'
import type { RewardStatus } from '@shared/types/store-types'
import { z } from 'zod'

export async function getRewards() {
  const store = getStore()
  return store.rewards.map(r => {
    const customer = store.customers.find(c => c.id === r.customerId)
    return { ...r, customerName: customer?.name ?? '—' }
  })
}

export async function getCustomerRewards(customerId: string) {
  const store = getStore()
  return store.rewards.filter(r => r.customerId === customerId)
}

export async function updateRewardStatus(id: string, status: RewardStatus, performedBy: string) {
  const store = getStore()
  const idx = store.rewards.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Reward not found')
  store.rewards[idx].status = status
  const reward = store.rewards[idx]
  const customer = store.customers.find(c => c.id === reward.customerId)
  logActivity('reward', id, `Reward - ${customer?.name}`, `Reward marked ${status}`, performedBy)
  revalidatePath('/rewards')
  return { ok: true }
}

export async function getRewardRules() {
  return getStore().rewardRules
}

export async function updateRewardRule(id: string, data: { amountPerReferral?: number; enabled?: boolean }) {
  const store = getStore()
  const idx = store.rewardRules.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Rule not found')
  store.rewardRules[idx] = { ...store.rewardRules[idx], ...data }
  revalidatePath('/rewards')
  return { ok: true }
}

export async function getRewardStats() {
  const store = getStore()
  const rewards = store.rewards
  return {
    totalEligible: rewards.filter(r => r.status === 'ELIGIBLE').reduce((s, r) => s + r.amount, 0),
    totalPending: rewards.filter(r => r.status === 'PENDING_PAYMENT').reduce((s, r) => s + r.amount, 0),
    totalPaid: rewards.filter(r => r.status === 'PAID').reduce((s, r) => s + r.amount, 0),
    count: rewards.length,
  }
}
