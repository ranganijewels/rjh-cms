'use client'
import InboxView from '@/components/InboxView'

export default function CustomRequestsPage() {
  return (
    <InboxView
      title="Custom Design Requests"
      description="Customers requesting bespoke jewellery designs."
      endpoint="/storefront/custom-requests"
      primaryField="name"
      fields={[
        { key: 'name', label: 'Customer name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'jewelry_type', label: 'Jewelry type' },
        { key: 'metal', label: 'Metal preference' },
        { key: 'stone', label: 'Stone preference' },
        { key: 'budget', label: 'Budget' },
        { key: 'description', label: 'Design description', type: 'long' },
        { key: 'created_at', label: 'Submitted at' },
      ]}
    />
  )
}
