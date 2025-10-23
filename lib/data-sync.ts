import AsyncStorage from '@react-native-async-storage/async-storage';

// Data Synchronization Service for future server integration
export interface SyncConfig {
  serverEndpoint?: string;
  apiKey?: string;
  syncInterval: number; // in milliseconds
  retryAttempts: number;
  enableOfflineMode: boolean;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  syncInProgress: boolean;
  pendingOperations: number;
  lastError: string | null;
  isOnline: boolean;
}

export interface PendingOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  resourceType: 'profile' | 'progress' | 'achievement' | 'content';
  resourceId: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

class DataSyncService {
  private config: SyncConfig;
  private status: SyncStatus;
  private syncTimer: NodeJS.Timeout | null = null;
  private pendingOperations: PendingOperation[] = [];

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      syncInterval: 30000, // 30 seconds
      retryAttempts: 3,
      enableOfflineMode: true,
      ...config,
    };

    this.status = {
      lastSyncTime: null,
      syncInProgress: false,
      pendingOperations: 0,
      lastError: null,
      isOnline: true, // Assume online initially
    };

    this.loadPendingOperations();
  }

  // Initialize sync service
  async initialize(): Promise<void> {
    await this.loadSyncStatus();
    
    if (this.config.enableOfflineMode) {
      this.startPeriodicSync();
    }

    // Listen for network changes (would need network info package)
    // this.setupNetworkListener();
  }

  // Start periodic synchronization
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (!this.status.syncInProgress && this.status.isOnline) {
        await this.performSync();
      }
    }, this.config.syncInterval);
  }

  // Stop periodic synchronization
  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // Add operation to pending queue
  async queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const pendingOp: PendingOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.pendingOperations.push(pendingOp);
    await this.savePendingOperations();
    
    this.updateSyncStatus({
      pendingOperations: this.pendingOperations.length,
    });

    // Try immediate sync if online and not already syncing
    if (this.status.isOnline && !this.status.syncInProgress) {
      await this.performSync();
    }
  }

  // Perform full synchronization
  async performSync(): Promise<boolean> {
    if (!this.config.serverEndpoint || !this.status.isOnline) {
      return false;
    }

    this.updateSyncStatus({ syncInProgress: true, lastError: null });

    try {
      // Process pending operations
      await this.processPendingOperations();
      
      // Fetch updates from server
      await this.fetchServerUpdates();
      
      this.updateSyncStatus({
        syncInProgress: false,
        lastSyncTime: new Date().toISOString(),
        pendingOperations: this.pendingOperations.length,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.updateSyncStatus({
        syncInProgress: false,
        lastError: errorMessage,
      });
      
      console.error('Sync failed:', error);
      return false;
    }
  }

  // Process pending operations
  private async processPendingOperations(): Promise<void> {
    const operationsToProcess = [...this.pendingOperations];
    
    for (const operation of operationsToProcess) {
      try {
        const success = await this.executeOperation(operation);
        
        if (success) {
          // Remove successful operation
          this.pendingOperations = this.pendingOperations.filter(op => op.id !== operation.id);
        } else {
          // Increment retry count
          const opIndex = this.pendingOperations.findIndex(op => op.id === operation.id);
          if (opIndex >= 0) {
            this.pendingOperations[opIndex].retryCount++;
            
            // Remove operation if max retries exceeded
            if (this.pendingOperations[opIndex].retryCount >= this.config.retryAttempts) {
              console.warn('Max retries exceeded for operation:', operation.id);
              this.pendingOperations.splice(opIndex, 1);
            }
          }
        }
      } catch (error) {
        console.error('Error processing operation:', operation.id, error);
      }
    }

    await this.savePendingOperations();
  }

  // Execute individual operation
  private async executeOperation(operation: PendingOperation): Promise<boolean> {
    if (!this.config.serverEndpoint) return false;

    try {
      const response = await fetch(`${this.config.serverEndpoint}/${operation.resourceType}/${operation.resourceId}`, {
        method: operation.operation === 'create' ? 'POST' : 
                operation.operation === 'update' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: operation.operation !== 'delete' ? JSON.stringify(operation.data) : undefined,
      });

      return response.ok;
    } catch (error) {
      console.error('Network error during operation:', error);
      return false;
    }
  }

  // Fetch updates from server
  private async fetchServerUpdates(): Promise<void> {
    if (!this.config.serverEndpoint) return;

    try {
      const lastSync = this.status.lastSyncTime || new Date(0).toISOString();
      
      const response = await fetch(`${this.config.serverEndpoint}/sync?since=${lastSync}`, {
        headers: {
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const updates = await response.json();
      await this.applyServerUpdates(updates);
    } catch (error) {
      console.error('Error fetching server updates:', error);
      throw error;
    }
  }

  // Apply server updates to local storage
  private async applyServerUpdates(updates: any): Promise<void> {
    // This would update local Zustand stores based on server data
    // Implementation depends on the specific update format from server
    
    if (updates.profile) {
      // Update profile store
      // await updateLocalProfile(updates.profile);
    }
    
    if (updates.progress) {
      // Update progress stores
      // await updateLocalProgress(updates.progress);
    }
    
    if (updates.content) {
      // Update content store
      // await updateLocalContent(updates.content);
    }
  }

  // Export data for backup/migration
  async exportData(): Promise<string> {
    try {
      const allData = {
        profile: await AsyncStorage.getItem('upmindx-profile'),
        xp: await AsyncStorage.getItem('upmindx-xp'),
        sessions: await AsyncStorage.getItem('upmindx-sessions'),
        tasks: await AsyncStorage.getItem('upmindx-tasks'),
        journal: await AsyncStorage.getItem('upmindx-journal'),
        content: await AsyncStorage.getItem('upmindx-content'),
        analytics: await AsyncStorage.getItem('upmindx-analytics'),
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };

      return JSON.stringify(allData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data from backup
  async importData(dataString: string): Promise<boolean> {
    try {
      const data = JSON.parse(dataString);
      
      // Validate data structure
      if (!data.exportedAt || !data.version) {
        throw new Error('Invalid data format');
      }

      // Import each store's data
      if (data.profile) await AsyncStorage.setItem('upmindx-profile', data.profile);
      if (data.xp) await AsyncStorage.setItem('upmindx-xp', data.xp);
      if (data.sessions) await AsyncStorage.setItem('upmindx-sessions', data.sessions);
      if (data.tasks) await AsyncStorage.setItem('upmindx-tasks', data.tasks);
      if (data.journal) await AsyncStorage.setItem('upmindx-journal', data.journal);
      if (data.content) await AsyncStorage.setItem('upmindx-content', data.content);
      if (data.analytics) await AsyncStorage.setItem('upmindx-analytics', data.analytics);

      console.log('Data import successful');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all local data
  async clearAllData(): Promise<void> {
    const keys = [
      'upmindx-profile',
      'upmindx-xp',
      'upmindx-sessions',
      'upmindx-tasks',
      'upmindx-journal',
      'upmindx-content',
      'upmindx-analytics',
      'upmindx-sync-status',
      'upmindx-pending-ops',
    ];

    await AsyncStorage.multiRemove(keys);
    this.pendingOperations = [];
    console.log('All data cleared');
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.status };
  }

  // Update sync configuration
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableOfflineMode) {
      this.startPeriodicSync();
    } else {
      this.stopSync();
    }
  }

  // Private utility methods
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...updates };
    this.saveSyncStatus();
  }

  private async loadSyncStatus(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('upmindx-sync-status');
      if (stored) {
        this.status = { ...this.status, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  }

  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem('upmindx-sync-status', JSON.stringify(this.status));
    } catch (error) {
      console.error('Error saving sync status:', error);
    }
  }

  private async loadPendingOperations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('upmindx-pending-ops');
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }

  private async savePendingOperations(): Promise<void> {
    try {
      await AsyncStorage.setItem('upmindx-pending-ops', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }
}

// Singleton instance
export const dataSyncService = new DataSyncService();

// Utility functions for common operations
export const syncUtils = {
  // Initialize sync service
  async init(config?: Partial<SyncConfig>): Promise<void> {
    if (config) {
      dataSyncService.updateConfig(config);
    }
    await dataSyncService.initialize();
  },

  // Queue profile update
  async syncProfile(userId: string, profileData: any): Promise<void> {
    await dataSyncService.queueOperation({
      operation: 'update',
      resourceType: 'profile',
      resourceId: userId,
      data: profileData,
    });
  },

  // Queue progress update
  async syncProgress(userId: string, progressData: any): Promise<void> {
    await dataSyncService.queueOperation({
      operation: 'update',
      resourceType: 'progress',
      resourceId: userId,
      data: progressData,
    });
  },

  // Force immediate sync
  async forceSync(): Promise<boolean> {
    return await dataSyncService.performSync();
  },

  // Get sync status
  getStatus(): SyncStatus {
    return dataSyncService.getSyncStatus();
  },

  // Export all data
  async exportAllData(): Promise<string> {
    return await dataSyncService.exportData();
  },

  // Import data
  async importAllData(dataString: string): Promise<boolean> {
    return await dataSyncService.importData(dataString);
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    await dataSyncService.clearAllData();
  },
};
