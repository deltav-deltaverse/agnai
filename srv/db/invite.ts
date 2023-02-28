/**
 * @TODO
 * Invites should be event sourced
 * For now I'm going to remove accepted and rejected invites
 *
 * Once event sourced, I'll support blocking users and will have an audit trail of all invites
 */

import { v4 } from 'uuid'
import { errors, StatusError } from '../api/wrap'
import { getChat } from './chats'
import { db } from './client'
import { AppSchema } from './schema'

const invs = db('chat-invite')
const members = db('chat-member')
const chats = db('chat')

export type NewInvite = {
  chatId: string
  byUserId: string
  invitedId: string
}

export async function list(userId: string) {
  const invites = await invs.find({ kind: 'chat-invite', invitedId: userId })
  return invites
}

export async function create(invite: NewInvite) {
  const chat = await getChat(invite.chatId)
  if (chat?.userId !== invite.byUserId) {
    throw errors.Forbidden
  }

  const membership = await members.findOne({ chatId: invite.chatId, userId: invite.invitedId })
  if (membership) return membership

  const prev = await invs.findOne({
    kind: 'chat-invite',
    chatId: invite.chatId,
    inviteId: invite.invitedId,
  })

  if (prev) throw new StatusError('Invite already pending', 400)

  const inv: AppSchema.ChatInvite = {
    _id: v4(),
    byUserId: invite.byUserId,
    chatId: invite.chatId,
    createdAt: new Date().toISOString(),
    invitedId: invite.invitedId,
    kind: 'chat-invite',
    state: 'pending',
  }

  await invs.insertOne(inv)
  return inv
}

export async function answer(userId: string, inviteId: string, accept: boolean) {
  const prev = await invs.findOne({ _id: inviteId, kind: 'chat-invite', inviteId: userId })
  if (!prev) {
    throw errors.NotFound
  }

  if (prev.state !== 'pending') {
    // Non-pending invites should be deleted and/or not displayed to the user
    throw new StatusError('Invitation already actioned', 400)
  }

  const chat = await chats.findOne({ _id: prev.chatId })
  if (!chat) {
    await invs.deleteOne({ _id: inviteId, kind: 'chat-invite' }, {})
    throw new StatusError('Chat no longer exists', 400)
  }

  const member: AppSchema.ChatMember = {
    _id: v4(),
    kind: 'chat-member',
    chatId: prev.chatId,
    createdAt: new Date().toISOString(),
    userId: prev.invitedId,
  }

  if (accept) {
    await members.insertOne(member)
    await chats.updateOne(
      { _id: chat._id, kind: 'chat' },
      { $set: { memberIds: chat.memberIds.concat(userId) } }
    )
  }

  await invs.deleteOne({ _id: inviteId, kind: 'chat-invite' }, {})

  return accept ? member : undefined
}
