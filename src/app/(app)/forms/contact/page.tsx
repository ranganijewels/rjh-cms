'use client'
import InboxView from '@/components/InboxView'

export default function ContactInboxPage() {
  return (
    <InboxView
      title="Contact Form Inbox"
      description="Generic enquiries submitted via the storefront contact form."
      endpoint="/storefront/contact-submissions"
      primaryField="name"
      fields={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'subject', label: 'Subject' },
        { key: 'message', label: 'Message', type: 'long' },
        { key: 'created_at', label: 'Submitted at' },
      ]}
    />
  )
}
