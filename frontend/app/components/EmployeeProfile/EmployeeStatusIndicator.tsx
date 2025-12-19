'use client';

import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface EmployeeStatusIndicatorProps {
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED';
  className?: string;
}

export default function EmployeeStatusIndicator({
  status,
  className = '',
}: EmployeeStatusIndicatorProps) {
  const statusConfig = {
    ACTIVE: {
      label: 'Active',
      color: 'bg-green-600',
      textColor: 'text-green-600',
      icon: CheckCircle2,
      bgColor: 'bg-green-600/20',
    },
    ON_LEAVE: {
      label: 'On Leave',
      color: 'bg-yellow-600',
      textColor: 'text-yellow-600',
      icon: Clock,
      bgColor: 'bg-yellow-600/20',
    },
    SUSPENDED: {
      label: 'Suspended',
      color: 'bg-red-600',
      textColor: 'text-red-600',
      icon: AlertCircle,
      bgColor: 'bg-red-600/20',
    },
    RETIRED: {
      label: 'Retired',
      color: 'bg-gray-600',
      textColor: 'text-gray-600',
      icon: CheckCircle2,
      bgColor: 'bg-gray-600/20',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-1 rounded-full ${config.bgColor}`}>
        <Icon size={16} className={config.textColor} />
      </div>
      <span className="text-sm font-medium text-gray-300">{config.label}</span>
    </div>
  );
}
