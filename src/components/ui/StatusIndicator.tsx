
import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';

type StatusType = 'online' | 'offline' | 'warning' | 'connecting' | 'cloud-connected' | 'cloud-disconnected';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, className }) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'online':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          iconColor: 'text-industrial-success',
          label: label || 'Online'
        };
      case 'offline':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          iconColor: 'text-industrial-danger',
          label: label || 'Offline'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          label: label || 'Warning'
        };
      case 'connecting':
        return {
          icon: Wifi,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          label: label || 'Connecting',
          animate: true
        };
      case 'cloud-connected':
        return {
          icon: Cloud,
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-800',
          borderColor: 'border-indigo-200',
          iconColor: 'text-indigo-600',
          label: label || 'Cloud Connected'
        };
      case 'cloud-disconnected':
        return {
          icon: CloudOff,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          label: label || 'Cloud Disconnected'
        };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium',
      config.bgColor,
      config.textColor,
      config.borderColor,
      className
    )}>
      <config.icon 
        className={cn(
          'h-4 w-4 mr-1.5',
          config.iconColor,
          config.animate && 'animate-pulse-slow'
        )} 
      />
      <span>{config.label}</span>
    </div>
  );
};

export default StatusIndicator;
