
import React, { useState, useEffect } from 'react';
import { Button } from './button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    // Check if display mode is standalone or fullscreen (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         (window.navigator as any).standalone === true;
    
    setIsInstalled(isStandalone);
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67+ from automatically showing the prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt as it can't be used again
    setInstallPrompt(null);
  };
  
  // Only show the install button if the PWA is not installed and the install prompt is available
  if (isInstalled || !installPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-xs">
      <div className="mb-2 font-medium">Install Data Pulse</div>
      <p className="text-sm text-gray-600 mb-3">Install this app on your device for quick and easy access when you're on the go.</p>
      <div className="flex justify-end">
        <Button onClick={handleInstallClick} className="bg-blue-600 hover:bg-blue-700">
          Install
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
