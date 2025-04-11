
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleOff, CircleDot, Activity, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PLCDataPoint {
  timestamp: string;
  value: boolean;
  values?: number[];
  register: number;
}

interface PLCDataMonitorProps {
  recentData: PLCDataPoint[];
  historicalData: PLCDataPoint[];
  lastUpdateTime: string;
  totalSamples: number;
}

const PLCDataMonitor: React.FC<PLCDataMonitorProps> = ({ 
  recentData, 
  historicalData, 
  lastUpdateTime, 
  totalSamples 
}) => {
  // Format historical data for the chart
  const chartData = historicalData.map(item => ({
    name: item.timestamp.split(' ')[1], // Just show the time
    value: item.value ? 1 : 0,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>PLC Data Monitor</CardTitle>
            <CardDescription>Live data from your PLC</CardDescription>
          </div>
          <div className="flex flex-col items-end text-sm">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-industrial-teal" />
              <span>Last update: {lastUpdateTime || 'No data'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-industrial-teal" />
              <span>Samples: {totalSamples}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current">
          <TabsList className="mb-6">
            <TabsTrigger value="current">Current State</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentData.length > 0 ? recentData.map((item, index) => (
                <Card key={index} className="border bg-white">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2 text-sm font-medium text-muted-foreground">
                        Register {item.register.toString(16).toUpperCase().padStart(4, '0')} (0x{item.register.toString(16).toUpperCase().padStart(4, '0')})
                      </div>
                      {item.value ? (
                        <CircleDot size={48} className="text-industrial-success mb-2" />
                      ) : (
                        <CircleOff size={48} className="text-industrial-danger mb-2" />
                      )}
                      <h3 className="text-xl font-bold">
                        {item.value ? 'ON' : 'OFF'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        {item.timestamp}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                  <Activity size={48} className="text-muted-foreground mb-4" />
                  <h3 className="font-medium">No data available</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Connect to your PLC to start monitoring data
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="trend">
            <div className="h-80 bg-white p-4 border rounded-md">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 1]} ticks={[0, 1]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="stepAfter" 
                      dataKey="value" 
                      name="Signal State" 
                      stroke="#0d9488" 
                      strokeWidth={2} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <Activity size={48} className="text-muted-foreground mb-4" />
                  <h3 className="font-medium">No historical data available</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Data will appear here as it's collected
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PLCDataMonitor;
