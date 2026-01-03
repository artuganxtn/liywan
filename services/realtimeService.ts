// Real-time service for WebSocket/SSE connections
// This service handles real-time updates for notifications, events, and other data

import { io as socketIOClient, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../utils/apiConfig';

export class RealtimeService {
  private ws: WebSocket | null = null;
  private socket: Socket | null = null; // Socket.IO socket
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;
  private isDisabled = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private useSocketIO = true; // Use Socket.IO by default (backend uses Socket.IO)

  constructor(private url: string = 'http://localhost:8000') {
    // Check if WebSocket should be enabled (can be disabled via env variable)
    const wsEnabled = import.meta.env.VITE_WS_ENABLED !== 'false';
    
    if (!wsEnabled) {
      this.isDisabled = true;
      return;
    }

    // Delay connection attempt until page is fully loaded to avoid connection errors during page load
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        // Page already loaded, connect immediately
        this.connectSocketIO();
      } else {
        // Wait for page to load before attempting connection
        window.addEventListener('load', () => {
          // Small delay to ensure everything is ready
          setTimeout(() => {
            this.connectSocketIO();
          }, 1000);
        });
      }
    } else {
      // Not in browser environment, connect immediately
      this.connectSocketIO();
    }
  }

  connectSocketIO() {
    if (this.isDisabled || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    try {
      // Convert ws:// URLs to http:// for Socket.IO
      let httpUrl = this.url;
      if (httpUrl.startsWith('ws://')) {
        httpUrl = httpUrl.replace('ws://', 'http://');
      } else if (httpUrl.startsWith('wss://')) {
        httpUrl = httpUrl.replace('wss://', 'https://');
      }
      // Remove /ws path if present (Socket.IO uses root path)
      httpUrl = httpUrl.replace('/ws', '');

      this.socket = socketIOClient(httpUrl, {
        transports: ['polling'], // Use polling only to avoid WebSocket connection errors
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        autoConnect: true,
        forceNew: false,
        withCredentials: true,
        // Suppress all connection errors
        upgrade: false, // Don't upgrade to WebSocket to avoid connection errors
      });

      this.socket.on('connect', () => {
        // Only log on successful connection, suppress all other logs
        if (this.reconnectAttempts === 0) {
          console.log('✅ Real-time updates connected');
        }
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.emit('connected', {});
      });

      this.socket.on('disconnect', (reason: string) => {
        // Suppress disconnect logging - Socket.IO handles reconnection automatically
        this.isConnected = false;
        this.emit('disconnected', {});
        
        if (reason === 'io server disconnect') {
          // Server disconnected, don't reconnect
          this.isDisabled = true;
        }
        // Socket.IO will automatically attempt reconnection for other disconnect reasons
      });

      this.socket.on('connect_error', (error: Error) => {
        // Suppress error logging completely - Socket.IO will handle reconnection automatically
        // These errors are expected if backend is not running or during page load
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          // Silently disable after max attempts - no console logging
          this.isDisabled = true;
          this.emit('reconnect_failed', {});
        }
      });

      // Handle various event types
      this.socket.on('notification', (data: any) => {
        this.emit('notification', data);
      });

      this.socket.on('payment_update', (data: any) => {
        this.emit('payment_update', data);
      });

      this.socket.on('event_update', (data: any) => {
        this.emit('event_update', data);
      });

      this.socket.on('staff_update', (data: any) => {
        this.emit('staff_update', data);
      });

      this.socket.on('application_update', (data: any) => {
        this.emit('application_update', data);
      });

      // Generic message handler
      this.socket.onAny((event: string, data: any) => {
        this.emit(event, data);
      });

    } catch (error) {
      console.warn('Socket.IO connection failed. Using polling fallback.');
      this.isDisabled = true;
      this.useSocketIO = false;
    }
  }

  connect() {
    // This method is kept for backward compatibility but won't be used
    // since we're using Socket.IO instead of raw WebSocket
    if (this.useSocketIO) {
      return;
    }

    // Don't attempt connection if disabled or already at max attempts
    if (this.isDisabled || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    try {
      // Set a connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected && this.ws) {
          this.ws.close();
          this.isDisabled = true;
          this.emit('reconnect_failed', {});
        }
      }, 5000);

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Suppress WebSocket errors - they're expected if server uses Socket.IO
        this.emit('error', { error });
      };

      this.ws.onclose = (event) => {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.isConnected = false;
        this.emit('disconnected', {});
        
        if (!this.isDisabled && event.code !== 1000) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      this.isDisabled = true;
      this.emit('reconnect_failed', {});
    }
  }

  private attemptReconnect() {
    if (this.isDisabled) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      this.isDisabled = true;
      this.emit('reconnect_failed', {});
    }
  }

  private handleMessage(data: any) {
    const { type, payload } = data;
    
    switch (type) {
      case 'notification':
        this.emit('notification', payload);
        break;
      case 'payment_update':
        this.emit('payment_update', payload);
        break;
      case 'event_update':
        this.emit('event_update', payload);
        break;
      case 'staff_update':
        this.emit('staff_update', payload);
        break;
      case 'application_update':
        this.emit('application_update', payload);
        break;
      default:
        this.emit('message', data);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  send(type: string, payload: any) {
    if (this.useSocketIO && this.socket && this.isConnected) {
      this.socket.emit(type, payload);
    } else if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  isWebSocketAvailable(): boolean {
    return !this.isDisabled && (this.useSocketIO || typeof WebSocket !== 'undefined');
  }

  disable() {
    this.isDisabled = true;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}

// Singleton instance
let realtimeInstance: RealtimeService | null = null;

export const getRealtimeService = (): RealtimeService => {
  if (!realtimeInstance) {
    // Socket.IO uses HTTP URL, not ws://
    // Use the same logic as API base URL, but remove /api suffix for Socket.IO
    let wsUrl: string;
    
    if (import.meta.env.VITE_WS_URL) {
      // Explicit WebSocket URL override
      wsUrl = import.meta.env.VITE_WS_URL;
    } else {
      // Use API base URL but remove /api suffix for Socket.IO
      const apiBaseUrl = getApiBaseUrl();
      if (apiBaseUrl.startsWith('/api')) {
        // Production: use empty string (same origin) - Socket.IO will use /socket.io path
        wsUrl = '';
      } else {
        // Development: use the API URL without /api suffix
        wsUrl = apiBaseUrl.replace('/api', '');
      }
    }
    
    realtimeInstance = new RealtimeService(wsUrl);
    
    // Disable WebSocket if explicitly disabled via env
    const wsEnabled = import.meta.env.VITE_WS_ENABLED !== 'false';
    if (!wsEnabled) {
      realtimeInstance.disable();
    }
  }
  return realtimeInstance;
};

// Fallback polling service when WebSocket is not available
export class PollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  startPolling(key: string, fetchFn: () => Promise<any>, interval: number = 30000) {
    // Clear existing interval if any
    this.stopPolling(key);

    // Initial fetch
    fetchFn().then(data => {
      this.emit(key, data);
    });

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchFn().then(data => {
        this.emit(key, data);
      }).catch(error => {
        console.error(`Error polling ${key}:`, error);
      });
    }, interval);

    this.intervals.set(key, intervalId);
  }

  stopPolling(key: string) {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in polling listener for ${event}:`, error);
        }
      });
    }
  }

  stopAll() {
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();
    this.listeners.clear();
  }
}

let pollingInstance: PollingService | null = null;

export const getPollingService = (): PollingService => {
  if (!pollingInstance) {
    pollingInstance = new PollingService();
  }
  return pollingInstance;
};
