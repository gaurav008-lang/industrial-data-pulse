import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { toast } from 'sonner';
import Dashboard from '@/components/layout/Dashboard';
import PLCConfigForm, { PLCConfiguration } from '@/components/plc/PLCConfigForm';
import PLCDataMonitor from '@/components/plc/PLCDataMonitor';
import DataHistory from '@/components/plc/DataHistory';
import CloudStatus from '@/components/cloud/CloudStatus';
import socketService from '@/lib/socket';

// Generate unique ID for entries
const generateId = () => Math.random().toString(36).substr(2, 9);

const Index = () => {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('offline');
  const [lastUpdateTime, setLastUpdateTime] = useState('--:--:--');
  const [plcData, setPlcData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  
  // Function to connect to PLC
  const handleConnect = (config: PLCConfiguration) => {
    setConnectionStatus('connecting');
    
    // In a real implementation, we would send the config to the backend
    // For this demo, we'll simulate a connection request
    setTimeout(() => {
      // Start WebSocket connection 
      socketService.connect();
      
      toast.success('PLC connection successful!', {
        description: `Connected to ${config.type === 'tcp' ? config.ip : config.comPort}`
      });
      
      setConnectionStatus('online');
    }, 1500);
  };
  
  // Set up WebSocket event handlers
  useEffect(() => {
    // Handle connection status changes
    socketService.onStatusChange((isConnected) => {
      setConnectionStatus(isConnected ? 'online' : 'offline');
      
      if (!isConnected) {
        toast.error('Connection to PLC lost', {
          description: 'Attempting to reconnect...'
        });
      }
    });
    
    // Handle data updates
    socketService.onData((data) => {
      if (data && data.data) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        setLastUpdateTime(timeString);
        
        // Create data point
        const dataPoint = {
          timestamp: now.toLocaleString(),
          value: Boolean(data.data[0]), // Convert to boolean
          register: 0x6304, // This should come from the actual data
          id: generateId(),
          source: 'plc'
        };
        
        // Update current data
        setPlcData(prev => {
          // Keep only the latest data point
          return [dataPoint];
        });
        
        // Add to historical data
        setHistoricalData(prev => {
          // Add new data at the beginning and keep last 100 points
          return [dataPoint, ...prev].slice(0, 100);
        });
      }
    });
    
    // Fetch initial data from Firebase
    const historyRef = ref(database, 'plc/history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          timestamp: value.timestamp,
          value: Boolean(value.data?.[0]),
          register: value.register || 0x6304,
          source: 'cloud'
        })).slice(0, 100);
        
        setHistoricalData(prev => {
          // Combine local and cloud data, sort by timestamp (newest first)
          const localData = prev.filter(item => item.source === 'plc');
          return [...localData, ...historyArray]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 100);
        });
      }
    });
    
    return () => {
      // Clean up
      socketService.disconnect();
    };
  }, []);
  
  // Function to handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Function to refresh data history
  const handleRefreshHistory = () => {
    toast.info('Refreshing data history...');
    // In a real implementation, we would fetch new data from the server
    // For this demo, we'll just simulate a refresh
    setTimeout(() => {
      toast.success('Data history refreshed');
    }, 800);
  };

  return (
    <Dashboard activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <PLCDataMonitor
            recentData={plcData}
            historicalData={historicalData}
            lastUpdateTime={lastUpdateTime}
            totalSamples={historicalData.length}
          />
        </div>
      )}
      
      {activeTab === 'configuration' && (
        <div className="space-y-6">
          <PLCConfigForm 
            onConnect={handleConnect} 
            connectionStatus={connectionStatus} 
          />
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="space-y-6">
          <DataHistory 
            data={historicalData}
            onRefresh={handleRefreshHistory}
          />
        </div>
      )}
      
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          <CloudStatus />
        </div>
      )}
    </Dashboard>
  );
};

export default Index;
