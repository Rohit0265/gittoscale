import React from 'react';
import { NewOne, NewOneProps } from './newOne';

export const HeroSection: React.FC<NewOneProps> = (props) => {
  return <NewOne {...props} />;
};

export default HeroSection;
