"use client";

import DashboardLayout from '../../../components/DashboardLayout';
import EscalationsList from '../../execution/components/EscalationsList';

export default function EscalationsPage() {
  return (
    <DashboardLayout title="Escalated Irregularities" description="Review escalated irregularities">
      <div className="py-6">
        <EscalationsList />
      </div>
    </DashboardLayout>
  );
}
