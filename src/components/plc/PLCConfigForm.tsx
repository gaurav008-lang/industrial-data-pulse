
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';

interface PLCConfigFormProps {
  onConnect: (config: PLCConfiguration) => void;
  connectionStatus: 'online' | 'offline' | 'connecting';
}

export interface PLCConfiguration {
  type: 'tcp' | 'rtu';
  // TCP fields
  ip?: string;
  port?: number;
  // RTU fields
  comPort?: string;
  baudRate?: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'N' | 'E' | 'O';
  // Common fields
  registerAddress: number;
  registerCount: number;
  unitId: number;
  pollInterval: number;
  saveToCloud: boolean;
}

const PLCConfigForm: React.FC<PLCConfigFormProps> = ({ onConnect, connectionStatus }) => {
  const [activeTab, setActiveTab] = useState<string>('tcp');
  const [config, setConfig] = useState<PLCConfiguration>({
    type: 'tcp',
    ip: '192.168.1.10',
    port: 502,
    comPort: 'COM8',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'O',
    registerAddress: 0x6304,
    registerCount: 1,
    unitId: 1,
    pollInterval: 5,
    saveToCloud: true
  });

  const handleConnectClick = () => {
    // Validate form based on active type
    if (activeTab === 'tcp') {
      if (!config.ip || !config.port) {
        toast.error('Please fill all required TCP fields');
        return;
      }
    } else {
      if (!config.comPort || !config.baudRate) {
        toast.error('Please fill all required RTU fields');
        return;
      }
    }

    // Update the config type based on selected tab
    const updatedConfig = { ...config, type: activeTab as 'tcp' | 'rtu' };
    
    // Save configuration to Firebase if enabled
    if (config.saveToCloud) {
      set(ref(database, 'plc/configuration'), updatedConfig)
        .then(() => {
          toast.success('Configuration saved to cloud');
        })
        .catch((error) => {
          console.error('Error saving to Firebase:', error);
          toast.error('Failed to save configuration to cloud');
        });
    }

    // Notify parent component about connection request
    onConnect(updatedConfig);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert to appropriate type
    const processedValue = type === 'number' ? parseFloat(value) : value;
    
    setConfig(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      saveToCloud: checked
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>PLC Connection Configuration</CardTitle>
            <CardDescription>Configure your connection parameters</CardDescription>
          </div>
          <StatusIndicator status={connectionStatus} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tcp">Modbus TCP</TabsTrigger>
            <TabsTrigger value="rtu">Modbus RTU</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tcp">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ip">IP Address</Label>
                <Input
                  id="ip"
                  name="ip"
                  placeholder="e.g. 192.168.1.10"
                  value={config.ip}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  placeholder="502"
                  value={config.port}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="rtu">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="comPort">COM Port</Label>
                <Input
                  id="comPort"
                  name="comPort"
                  placeholder="COM8"
                  value={config.comPort}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  Windows: COM3, Linux: /dev/ttyUSB0
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baudRate">Baud Rate</Label>
                <Select 
                  onValueChange={value => handleSelectChange("baudRate", value)}
                  value={config.baudRate?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select baud rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9600">9600</SelectItem>
                    <SelectItem value="19200">19200</SelectItem>
                    <SelectItem value="38400">38400</SelectItem>
                    <SelectItem value="57600">57600</SelectItem>
                    <SelectItem value="115200">115200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parity">Parity</Label>
                <Select 
                  onValueChange={value => handleSelectChange("parity", value)}
                  value={config.parity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">None (N)</SelectItem>
                    <SelectItem value="E">Even (E)</SelectItem>
                    <SelectItem value="O">Odd (O)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataBits">Data Bits</Label>
                  <Select 
                    onValueChange={value => handleSelectChange("dataBits", value)}
                    value={config.dataBits?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Data bits" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stopBits">Stop Bits</Label>
                  <Select 
                    onValueChange={value => handleSelectChange("stopBits", value)}
                    value={config.stopBits?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Stop bits" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <div className="mt-6 space-y-6">
            <h3 className="text-lg font-medium">Modbus Settings</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registerAddress">Register Address (Hex)</Label>
                <Input
                  id="registerAddress"
                  name="registerAddress"
                  placeholder="0x6304"
                  value={config.registerAddress}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerCount">Register Count</Label>
                <Input
                  id="registerCount"
                  name="registerCount"
                  type="number"
                  placeholder="1"
                  min="1"
                  value={config.registerCount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit ID</Label>
                <Input
                  id="unitId"
                  name="unitId"
                  type="number"
                  placeholder="1"
                  min="0"
                  max="255"
                  value={config.unitId}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pollInterval">Poll Interval (seconds)</Label>
                <Input
                  id="pollInterval"
                  name="pollInterval"
                  type="number"
                  placeholder="5"
                  min="1"
                  value={config.pollInterval}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <Switch 
                id="saveToCloud"
                checked={config.saveToCloud}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="saveToCloud">Save configuration to cloud</Label>
            </div>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleConnectClick} 
          disabled={connectionStatus === 'connecting'} 
          className="bg-industrial-teal hover:bg-industrial-teal/90"
        >
          {connectionStatus === 'connecting' ? 'Connecting...' : 
           connectionStatus === 'online' ? 'Reconnect' : 'Connect to PLC'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PLCConfigForm;
