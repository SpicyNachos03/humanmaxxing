'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { Camera } from 'iconoir-react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!scanning) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanning = async () => {
      try {
        console.log('Starting camera...');
        
        // Check camera permissions first
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        console.log('Camera access granted');
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        
        if (videoRef.current) {
          await reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
              console.log('QR code detected:', result.getText());
              onScan(result.getText());
              setScanning(false);
              reader.reset();
            }
            if (err && !(err instanceof Error && err.name === 'NotFoundException')) {
              console.error('Scanning error:', err);
              setError(`Scanning error: ${err.message}`);
            }
          });
        }
      } catch (err) {
        console.error('Failed to start scanner:', err);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError('Camera permission denied. Please allow camera access in your browser settings.');
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.');
          } else {
            setError(`Failed to access camera: ${err.message}`);
          }
        } else {
          setError('Failed to access camera. Please ensure camera permissions are granted.');
        }
        setScanning(false);
      }
    };

    startScanning();

    return () => {
      reader.reset();
    };
  }, [scanning, onScan]);

  const handleStartScan = () => {
    setError(null);
    setScanning(true);
  };

  const handleStopScan = () => {
    setScanning(false);
    if (readerRef.current) {
      readerRef.current.reset();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Scan Peer QR Code</h3>
        
        {!scanning ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Scan the QR code displayed on your peer's device to verify their identity.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <Button onClick={handleStartScan} variant="primary" className="w-full">
              Start Camera
            </Button>
            <Button onClick={onClose} variant="secondary" className="w-full">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-white/50 rounded-lg" />
              </div>
            </div>
            <p className="text-center text-sm text-gray-600">
              Point camera at the QR code
            </p>
            <Button onClick={handleStopScan} variant="secondary" className="w-full">
              Stop Scanning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
