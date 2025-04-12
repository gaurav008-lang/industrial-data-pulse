
import { ref, set, serverTimestamp } from 'firebase/database';
import { database } from './firebase';
import { toast } from 'sonner';

interface SocketService {
  socket: WebSocket | null;
  isConnected: boolean;
  onDataCallback: ((data: any) => void) | null;
  onStatusChangeCallback: ((isConnected: boolean) => void) | null;
  
  connect: (url: string, config?: PLCConfig) => void;
  disconnect: () => void;
  onData: (callback: (data: any) => void) => void;
  onStatusChange: (callback: (isConnected: boolean) => void) => void;
  writePLCData: (register: number, value: number | boolean) => Promise<boolean>;
  readPLCData: (register: number, count?: number) => Promise<any>;
}

export interface PLCConfig {
  type: 'tcp' | 'serial';
  ip?: string;
  port?: number;
  comPort?: string;
  baudRate?: number;
  slave?: number;
  timeout?: number;
}

// WebSocket service for connecting to Flask backend with PyModbus
export const socketService: SocketService = {
  socket: null,
  isConnected: false,
  onDataCallback: null,
  onStatusChangeCallback: null,
  
  connect(url: string = 'ws://localhost:5000/ws', config?: PLCConfig) {
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(true);
        }
        
        // If config is provided, send it to the server to initiate PLC connection
        if (config) {
          if (this.socket) {
            this.socket.send(JSON.stringify({
              action: 'connect_plc',
              config: config
            }));
            
            console.log('Sent PLC connection config to server:', config);
          }
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        this.isConnected = false;
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(false);
        }
        
        // Try to reconnect after delay
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('Attempting to reconnect WebSocket...');
            this.connect(url, config);
          }
        }, 5000);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received data from PLC:', data);
          
          // Check for error responses
          if (data.error) {
            console.error('Server error:', data.error);
            toast.error(`PLC Error: ${data.error}`);
            return;
          }
          
          // Send data to callback
          if (this.onDataCallback) {
            this.onDataCallback(data);
          }
          
          // Store in Firebase if we have data
          if (data && data.data) {
            const timestamp = new Date().toISOString();
            // Store current status
            set(ref(database, 'plc/currentData'), {
              timestamp,
              data: data.data,
              register: data.register || 0x6304,
            })
            .then(() => console.log('Current PLC data stored in Firebase'))
            .catch(err => console.error('Error storing current PLC data:', err));
            
            // Add to history
            const newDataRef = ref(database, `plc/history/${Date.now()}`);
            set(newDataRef, {
              timestamp,
              data: data.data,
              register: data.register || 0x6304,
            })
            .then(() => console.log('PLC history data stored in Firebase'))
            .catch(err => console.error('Error storing PLC history data:', err));
            
            // Update status
            set(ref(database, 'status'), {
              lastUpload: timestamp,
              recordCount: data.recordCount || 0,
              serverTime: serverTimestamp()
            })
            .then(() => console.log('Status updated in Firebase'))
            .catch(err => console.error('Error updating status:', err));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error. Please check if the PLC server is running.');
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      toast.error('Failed to connect to PLC server.');
    }
  },
  
  disconnect() {
    if (this.socket) {
      // Send disconnect message before closing
      if (this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({
            action: 'disconnect_plc'
          }));
          console.log('Disconnect message sent to server');
        } catch (error) {
          console.error('Error sending disconnect message:', error);
        }
      }
      
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      console.log('WebSocket disconnected');
    }
  },
  
  onData(callback: (data: any) => void) {
    this.onDataCallback = callback;
  },
  
  onStatusChange(callback: (isConnected: boolean) => void) {
    this.onStatusChangeCallback = callback;
    
    // Immediately call with current status
    if (callback) {
      callback(this.isConnected);
    }
  },
  
  // Write data to PLC
  async writePLCData(register: number, value: number | boolean): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        toast.error('Cannot write to PLC: Not connected');
        reject('WebSocket not connected');
        return;
      }
      
      // Convert boolean to number if needed
      const numValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      
      // Create a message ID for this request
      const messageId = Date.now().toString();
      
      // Create handler for response
      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          
          // Check if this is the response to our write request
          if (response.messageId === messageId) {
            // Remove this event listener
            this.socket?.removeEventListener('message', messageHandler);
            
            if (response.success) {
              console.log(`Successfully wrote value ${numValue} to register ${register}`);
              toast.success(`Value written to PLC register ${register.toString(16).toUpperCase()}`);
              resolve(true);
            } else {
              console.error('Write failed:', response.error);
              toast.error(`Failed to write to PLC: ${response.error || 'Unknown error'}`);
              reject(response.error || 'Write failed');
            }
          }
        } catch (error) {
          console.error('Error handling write response:', error);
        }
      };
      
      // Add temporary message handler
      this.socket.addEventListener('message', messageHandler);
      
      // Send write request
      console.log(`Sending write request: Register=${register}, Value=${numValue}`);
      this.socket.send(JSON.stringify({
        action: 'write_plc',
        register: register,
        value: numValue,
        messageId: messageId
      }));
      
      // Set a timeout to clean up the handler if no response
      setTimeout(() => {
        this.socket?.removeEventListener('message', messageHandler);
        toast.error('Write request timed out');
        reject('Write request timed out');
      }, 5000);
    });
  },
  
  // Read data from PLC
  async readPLCData(register: number, count: number = 1): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        toast.error('Cannot read from PLC: Not connected');
        reject('WebSocket not connected');
        return;
      }
      
      // Create a message ID for this request
      const messageId = Date.now().toString();
      
      // Create handler for response
      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          
          // Check if this is the response to our read request
          if (response.messageId === messageId) {
            // Remove this event listener
            this.socket?.removeEventListener('message', messageHandler);
            
            if (response.data !== undefined) {
              console.log(`Successfully read data from register ${register}:`, response.data);
              resolve(response.data);
            } else {
              console.error('Read failed:', response.error);
              toast.error(`Failed to read from PLC: ${response.error || 'Unknown error'}`);
              reject(response.error || 'Read failed');
            }
          }
        } catch (error) {
          console.error('Error handling read response:', error);
        }
      };
      
      // Add temporary message handler
      this.socket.addEventListener('message', messageHandler);
      
      // Send read request
      console.log(`Sending read request: Register=${register}, Count=${count}`);
      this.socket.send(JSON.stringify({
        action: 'read_plc',
        register: register,
        count: count,
        messageId: messageId
      }));
      
      // Set a timeout to clean up the handler if no response
      setTimeout(() => {
        this.socket?.removeEventListener('message', messageHandler);
        toast.error('Read request timed out');
        reject('Read request timed out');
      }, 5000);
    });
  }
};

export default socketService;
