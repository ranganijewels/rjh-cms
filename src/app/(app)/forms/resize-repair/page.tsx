'use client'
import InboxView from '@/components/InboxView'

export default function ResizeRepairPage() {
  return (
    <InboxView
      title="Resize & Repair Requests"
      description="Customer requests to resize, repair, or restore jewellery."
      endpoint="/storefront/resize-repair-requests"
      primaryField="name"
      fields={[
        { key: 'name', label: 'Customer name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'order_number', label: 'Order number' },
        { key: 'service_type', label: 'Service type' },
        { key: 'details', label: 'Details', type: 'long' },
        { key: 'created_at', label: 'Submitted at' },
      ]}
    />
  )
}
