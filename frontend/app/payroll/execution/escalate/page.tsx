"use client";

import DashboardLayout from '../../../components/DashboardLayout';
import EscalationForm from '../../execution/components/EscalationForm';

export default function EscalatePage() {
  return (
    <DashboardLayout title="Escalate Irregularity" description="Report an irregularity to Payroll Manager">
      <div className="py-6">
        <EscalationForm />
      </div>
    </DashboardLayout>
  );
}
