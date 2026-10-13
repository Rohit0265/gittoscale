import React from 'react';
import { ScrollTimeline, TimelineEvent } from './lightswind/scroll-timeline';

interface HeroSectionProps {
  events?: TimelineEvent[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ events }) => {
  return (
    <div className="w-full">
      <ScrollTimeline events={events} />
    </div>
  );
};

export default HeroSection;