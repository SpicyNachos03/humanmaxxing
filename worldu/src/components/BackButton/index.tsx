'use client';

import { NavArrowLeft } from 'iconoir-react';
import { useRouter } from 'next/navigation';

export const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Go back"
    >
      <NavArrowLeft className="w-6 h-6 text-gray-700" />
    </button>
  );
};
