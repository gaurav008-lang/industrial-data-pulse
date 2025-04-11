import { ref, set, serverTimestamp } from 'firebase/database';
import { database } from './firebase';

interface SocketService {
  socket: WebSocket | null;
  isConnected: boolean;
  onDataCallback: ((data: any) => void) | null;
  onStatusChangeCallback: ((isConnected: boolean) => void) | null;
  
  connect: (url: string) => void;
  disconnect: () => void;
  onData: (callback: (data: any) => void) => void;
  onStatusChange: (callback: (isConnected: boolean) => void) => void;
}

// WebSocket service for connecting to Flask backend
export const socketService: SocketService = {
  socket: null,
  isConnected: false,
  onDataCallback: null,
  onStatusChangeCallback: null,
  
  connect(url: string = 'ws://localhost:5000/ws') {
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
          this.connect(url);
        }
      }, 5000);
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received data:', data);
        
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
            register: 0x6304, // Update this with actual register from data
          });
          
          // Add to history
          const newDataRef = ref(database, `plc/history/${Date.now()}`);
          set(newDataRef, {
            timestamp,
            data: data.data,
            register: 0x6304, // Update this with actual register from data
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
  }
};

export default socketService;
