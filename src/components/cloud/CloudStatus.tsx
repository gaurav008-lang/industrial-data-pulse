
import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { Database, Upload, Download, Clock, Server } from 'lucide-react';

const CloudStatus: React.FC = () => {
  const [status, setStatus] = useState({
    connected: false,
    lastUpload: '-- --',
    recordCount: 0,
    latency: 0
  });

  useEffect(() => {
    // Set up Firebase connection status listener
    const connectedRef = ref(database, '.info/connected');
    const statusRef = ref(database, 'status');
    
    const connectedListener = onValue(connectedRef, (snap) => {
      setStatus(prev => ({ ...prev, connected: !!snap.val() }));
    });
    
    const statusListener = onValue(statusRef, (snap) => {
      const data = snap.val();
      if (data) {
        setStatus(prev => ({
          ...prev,
          lastUpload: data.lastUpload || prev.lastUpload,
          recordCount: data.recordCount || prev.recordCount,
          latency: data.latency || prev.latency
        }));
      }
    });
    
    // Simulate latency calculation
    const latencyInterval = setInterval(() => {
      const start = Date.now();
      const pingRef = ref(database, '.info/serverTimeOffset');
      onValue(pingRef, () => {
        const latency = Date.now() - start;
        setStatus(prev => ({ ...prev, latency }));
      }, { onlyOnce: true });
    }, 10000);
    
    return () => {
      // Clean up listeners
      connectedListener();
      statusListener();
      clearInterval(latencyInterval);
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Cloud Connection Status</CardTitle>
          <StatusIndicator 
            status={status.connected ? 'cloud-connected' : 'cloud-disconnected'} 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-start p-4 bg-white border rounded-md">
            <Database className="h-10 w-10 mr-3 text-industrial-teal" />
            <div>
              <h3 className="font-medium">Stored Records</h3>
              <p className="text-2xl font-semibold">{status.recordCount}</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-white border rounded-md">
            <Clock className="h-10 w-10 mr-3 text-industrial-teal" />
            <div>
              <h3 className="font-medium">Cloud Latency</h3>
              <p className="text-2xl font-semibold">{status.latency} ms</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-white border rounded-md">
            <Upload className="h-10 w-10 mr-3 text-industrial-teal" />
            <div>
              <h3 className="font-medium">Last Upload</h3>
              <p className="text-md">{status.lastUpload}</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-white border rounded-md">
            <Server className="h-10 w-10 mr-3 text-industrial-teal" />
            <div>
              <h3 className="font-medium">Database</h3>
              <p className="text-md">Firebase Realtime DB</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CloudStatus;
