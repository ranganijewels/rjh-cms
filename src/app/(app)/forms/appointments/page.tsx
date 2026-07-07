'use client'
import InboxView from '@/components/InboxView'

export default function AppointmentsPage() {
  return (
    <InboxView
      title="Appointment Bookings"
      description="In-store or virtual consultation requests."
      endpoint="/storefront/appointments"
      primaryField="name"
      fields={[
        { key: 'name', label: 'Customer name' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'preferred_date', label: 'Preferred date', type: 'date' },
        { key: 'preferred_time', label: 'Preferred time' },
        { key: 'location', label: 'Location / mode' },
        { key: 'notes', label: 'Notes', type: 'long' },
        { key: 'created_at', label: 'Submitted at' },
      ]}
    />
  )
}
