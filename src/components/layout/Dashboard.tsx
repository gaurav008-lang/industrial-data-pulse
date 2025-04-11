
import React, { ReactNode } from 'react';
import { Gauge, Settings, Activity, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'monitoring', name: 'Monitoring', icon: Gauge },
    { id: 'configuration', name: 'Configuration', icon: Settings },
    { id: 'history', name: 'Data History', icon: Activity },
    { id: 'cloud', name: 'Cloud Status', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-industrial-background">
      {/* Header */}
      <header className="bg-industrial-blue text-white shadow-md">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Gauge size={28} className="text-industrial-teal" />
              <h1 className="text-2xl font-bold">Industrial Data Pulse</h1>
            </div>
            <div className="text-sm">
              <span className="opacity-75">Last Updated:</span> <span id="last-update-time" className="ml-1">--:--:--</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200",
                  activeTab === tab.id
                    ? "border-industrial-teal text-industrial-teal"
                    : "border-transparent text-industrial-text hover:text-industrial-teal hover:border-industrial-teal/30"
                )}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-industrial-blue text-white mt-auto py-4">
        <div className="container mx-auto px-6 text-sm opacity-75 text-center">
          Industrial Data Pulse &copy; {new Date().getFullYear()} | Real-time PLC Monitoring System
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
