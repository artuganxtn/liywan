import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  isConnecting = false 
}) => {
  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <Loader2 size={16} className="text-amber-600 animate-spin" />
              <span className="text-sm font-medium text-amber-800">Reconnecting...</span>
            </>
          ) : (
            <>
              <WifiOff size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Offline - Using cached data</span>
            </>
          )}
        </motion.div>
      )}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2"
        >
          <Wifi size={16} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800">Connected</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

