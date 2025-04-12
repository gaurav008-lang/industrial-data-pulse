
import { ref, set, serverTimestamp } from 'firebase/database';
import { database } from './firebase';

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
    
    this.socket = new WebSocket(url);
    
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.isConnected = true;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true);
      }
      
      // If config is provided, send it to the server to initiate PLC connection
      if (config) {
        this.socket.send(JSON.stringify({
          action: 'connect_plc',
          config: config
        }));
      }
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
      
      // Try to reconnect after delay
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect(url, config);
        }
      }, 5000);
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received data from PLC:', data);
        
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
          });
          
          // Add to history
          const newDataRef = ref(database, `plc/history/${Date.now()}`);
          set(newDataRef, {
            timestamp,
            data: data.data,
            register: data.register || 0x6304,
          });
          
          // Update status
          set(ref(database, 'status'), {
            lastUpload: timestamp,
            recordCount: data.recordCount || 0,
            serverTime: serverTimestamp()
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  },
  
  disconnect() {
    if (this.socket) {
      // Send disconnect message before closing
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
          action: 'disconnect_plc'
        }));
      }
      
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
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
              resolve(true);
            } else {
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
      this.socket.send(JSON.stringify({
        action: 'write_plc',
        register: register,
        value: numValue,
        messageId: messageId
      }));
      
      // Set a timeout to clean up the handler if no response
      setTimeout(() => {
        this.socket?.removeEventListener('message', messageHandler);
        reject('Write request timed out');
      }, 5000);
    });
  }
};

export default socketService;
