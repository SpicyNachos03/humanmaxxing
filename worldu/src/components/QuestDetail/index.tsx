'use client';

import { Quest } from '@/types/quest';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { QRScanner } from '@/components/QRScanner';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { useSession } from 'next-auth/react';
import { getQuestCooldownRemainingHours } from '@/lib/questCooldown';

interface QuestDetailProps {
  quest: Quest;
}

export const QuestDetail = ({ quest }: QuestDetailProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [peerWorldId, setPeerWorldId] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCurrentPosition, loading: locationLoading } = useGeolocation();

  const requiresPhoto = ['photo', 'selfie', 'location', 'location_time'].includes(quest.verificationType);
  const requiresLocation = ['location', 'location_time'].includes(quest.verificationType) || quest.targetLocation;
  const requiresPeerConfirm = quest.verificationType === 'peer_confirm';

  const getVerificationLabel = () => {
    switch (quest.verificationType) {
      case 'photo':
        return 'Photo proof required';
      case 'location':
        return 'Location verification';
      case 'location_time':
        return 'Location & time verification';
      case 'timer':
        return `Timer: ${quest.duration} minutes`;
      case 'qr_code':
        return 'QR code check-in';
      case 'peer_confirm':
        return 'Peer confirmation required';
      case 'selfie':
        return 'Selfie verification';
      default:
        return 'Verification required';
    }
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePeerVerification = (qrData: string) => {
    console.log('Scanned QR data:', qrData);
    console.log('My wallet address:', session?.user?.walletAddress);

    // Validate that the QR data is a valid Ethereum address
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(qrData);
    
    if (!isValidAddress) {
      setErrorMessage('Invalid QR code. Please scan a valid user QR code.');
      return;
    }

    // Prevent scanning your own QR code
    if (qrData.toLowerCase() === session?.user?.walletAddress?.toLowerCase()) {
      setErrorMessage('You cannot scan your own QR code. Please scan a peer QR code.');
      return;
    }

    setPeerWorldId(qrData);
    setShowQRScanner(false);
  };

  const getMyPeerId = () => {
    // Use wallet address as peer ID for QR code
    return session?.user?.walletAddress || 'user-id';
  };

  // Check cooldown status on mount and after completion
  useEffect(() => {
    const checkCooldown = async () => {
      if (!session?.user?.walletAddress) return;

      try {
        const response = await fetch(
          `/api/user/progress?userId=${session.user.walletAddress}`,
          { cache: 'no-store' }
        );
        const data = await response.json();

        const remaining = getQuestCooldownRemainingHours(
          quest.id,
          data?.questCompletions
        );

        if (remaining !== null) {
          setCooldownRemaining(remaining);
          // Redirect home if user navigated here while still on cooldown
          if (buttonState !== 'success') {
            router.replace('/home');
          }
        } else {
          setCooldownRemaining(null);
        }
      } catch (error) {
        console.error('Error checking cooldown:', error);
      }
    };

    checkCooldown();
  }, [session?.user?.walletAddress, quest.id, buttonState, router]);

  const handleCompleteQuest = async () => {
    setButtonState('pending');
    setErrorMessage(null);

    try {
      let userLocation: { latitude: number; longitude: number } | null = null;
      let peerConfirmation: string | undefined;

      // Get peer World ID if required
      if (requiresPeerConfirm) {
        if (!peerWorldId) {
          setButtonState('failed');
          setErrorMessage('Please verify your peer\'s World ID first');
          return;
        }
        peerConfirmation = peerWorldId;
      }

      // Get current location if required
      if (requiresLocation) {
        const coords = await getCurrentPosition();
        if (!coords) {
          setButtonState('failed');
          setErrorMessage('Unable to get your location. Please enable location services and try again.');
          return;
        }
        userLocation = { latitude: coords.latitude, longitude: coords.longitude };

        // Verify location against quest target if defined
        if (quest.targetLocation) {
          const distance = calculateDistance(
            coords.latitude,
            coords.longitude,
            quest.targetLocation.latitude,
            quest.targetLocation.longitude
          );

          if (distance > quest.targetLocation.radiusMeters) {
            setButtonState('failed');
            const distanceKm = (distance / 1000).toFixed(1);
            setErrorMessage(
              `You are ${distanceKm}km away from the quest location${quest.targetLocation.name ? ` (${quest.targetLocation.name})` : ''}. Please move closer to complete this quest.`
            );
            return;
          }
        }
      }

      // Submit quest completion
      const submissionData = {
        questId: quest.id,
        userId: session?.user?.walletAddress || 'current-user',
        proof: photoPreview || 'completed',
        location: userLocation,
        peerConfirmation,
      };
      
      console.log('Submitting quest with data:', submissionData);

      const response = await fetch('/api/quests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quest');
      }

      setButtonState('success');
      setTimeout(() => {
        router.replace('/home');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error completing quest:', error);
      setButtonState('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete quest. Please try again.');
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-gray-200 rounded-xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{quest.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{quest.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-green-600">+{quest.points}</span>
              <span className="text-sm text-gray-500">points</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-gray-600">{quest.instructions}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Verification Method</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {getVerificationLabel()}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Category</h3>
            <span className="text-sm px-3 py-1 bg-gray-100 rounded-full capitalize">
              {quest.category}
            </span>
          </div>
          {quest.targetLocation && (
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-sm text-gray-600">
                  {quest.targetLocation.name || 'Target location'} (within {quest.targetLocation.radiusMeters}m)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {requiresPhoto && (
        <div className="border-2 border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Photo Proof</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />
          {photoPreview ? (
            <div className="relative w-full h-48">
              <Image
                src={photoPreview}
                alt="Quest proof"
                fill
                className="object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setPhotoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="w-full"
            >
              📷 Take Photo
            </Button>
          )}
        </div>
      )}

      {requiresLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-blue-700">
            <span>📍</span>
            <span className="text-sm">
              {locationLoading
                ? 'Getting your location...'
                : 'Your location will be captured when you complete this quest'}
            </span>
          </div>
        </div>
      )}

      {requiresPeerConfirm && (
        <div className="border-2 border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-3">Peer Verification</h3>
          <p className="text-sm text-gray-600 mb-3">
            Scan your peer QR code or show your QR code to be scanned.
          </p>
          {peerWorldId ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <span>✓</span>
                <span className="text-sm font-semibold">Peer verified!</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Peer ID: {peerWorldId.slice(0, 8)}...{peerWorldId.slice(-4)}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowQRScanner(true)}
                variant="secondary"
                className="flex-1"
              >
                🔍 Scan QR
              </Button>
              <Button
                onClick={() => setShowMyQR(true)}
                variant="secondary"
                className="flex-1"
              >
                Show My QR
              </Button>
            </div>
          )}
        </div>
      )}

      {showQRScanner && (
        <QRScanner
          onScan={handlePeerVerification}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showMyQR && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Your QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Show this QR code to your peer so they can scan it.
            </p>
            <QRCodeDisplay value={getMyPeerId()} size={200} />
            <Button
              onClick={() => setShowMyQR(false)}
              variant="secondary"
              className="w-full mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {cooldownRemaining ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <span>⏰</span>
            <span className="font-semibold">Quest on Cooldown</span>
          </div>
          <p className="text-sm text-yellow-600 mt-1">
            You can complete this quest again in {cooldownRemaining} hours.
          </p>
        </div>
      ) : null}

      <LiveFeedback
        label={{
          failed: 'Failed to complete quest',
          pending: 'Completing...',
          success: 'Quest completed!',
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={handleCompleteQuest}
          disabled={buttonState === 'pending' || cooldownRemaining !== null}
          size="lg"
          variant="primary"
          className="w-full"
        >
          {cooldownRemaining ? 'On Cooldown' : 'Complete Quest'}
        </Button>
      </LiveFeedback>

      <Button
        onClick={() => router.push('/home')}
        disabled={buttonState === 'pending'}
        size="lg"
        variant="secondary"
        className="w-full mt-3"
      >
        Back to Quests
      </Button>
    </div>
  );
};
