'use client';

import { Quest } from '@/types/quest';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';

interface QuestDetailProps {
  quest: Quest;
}

export const QuestDetail = ({ quest }: QuestDetailProps) => {
  const router = useRouter();
  const [buttonState, setButtonState] = useState<'pending' | 'success' | 'failed' | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCurrentPosition, loading: locationLoading } = useGeolocation();

  const requiresPhoto = ['photo', 'selfie', 'location', 'location_time'].includes(quest.verificationType);
  const requiresLocation = ['location', 'location_time'].includes(quest.verificationType) || quest.targetLocation;

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

  const handleCompleteQuest = async () => {
    setButtonState('pending');
    setErrorMessage(null);

    try {
      let userLocation: { latitude: number; longitude: number } | null = null;

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

      // Verify photo with YOLO vision API if photo is required
      if (requiresPhoto && photoPreview) {
        try {
          const visionResponse = await fetch('/api/vision/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questId: quest.id,
              imageBase64: photoPreview,
            }),
          });

          const visionResult = await visionResponse.json();
          console.log('Vision result:', visionResult);

          if (!visionResult.verified && !visionResult.fallback) {
            setButtonState('failed');
            setErrorMessage(visionResult.message || 'Photo verification failed. Please take a photo that shows the required items.');
            return;
          }
          
          // Show success feedback with what was detected
          if (visionResult.verified) {
            console.log(`Verified: ${visionResult.strict_match_count}/${visionResult.required_count} items detected`);
          }
        } catch (visionError) {
          console.warn('Vision API unavailable, proceeding without verification:', visionError);
        }
      }

      // Submit quest completion
      const response = await fetch('/api/quests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questId: quest.id,
          userId: 'current-user', // In production, get from session
          proof: photoPreview || 'completed',
          location: userLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quest');
      }

      setButtonState('success');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Error completing quest:', error);
      setButtonState('failed');
      setErrorMessage('Failed to complete quest. Please try again.');
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

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      <LiveFeedback
        label={{
          failed: errorMessage || 'Failed to complete quest',
          pending: locationLoading ? 'Getting location...' : 'Submitting...',
          success: 'Quest completed!',
        }}
        state={buttonState}
        className="w-full"
      >
        <Button
          onClick={handleCompleteQuest}
          disabled={buttonState === 'pending' || (requiresPhoto && !photoPreview)}
          size="lg"
          variant="primary"
          className="w-full"
        >
          {requiresPhoto && !photoPreview ? 'Take Photo First' : 'Complete Quest'}
        </Button>
      </LiveFeedback>

      <Button
        onClick={() => router.push('/')}
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
