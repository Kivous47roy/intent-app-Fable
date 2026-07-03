'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { ritualById } from '@/lib/rituals';
import { RitualRunner } from '@/components/RitualRunner';

export default function RitualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ritual = ritualById(id);
  if (!ritual) notFound();
  return <RitualRunner ritual={ritual} />;
}
