'use server'

import { redirect } from 'next/navigation'

interface InvitePageProps {
  params: { username: string }
}

export default async function InvitePage({ params }: InvitePageProps) {
  redirect(`/api/invite/${params.username}`)
}
