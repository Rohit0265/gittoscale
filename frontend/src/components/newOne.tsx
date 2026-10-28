import React from 'react';

export interface NewOneProps {
  onSelectTestSite?: () => void;
  onSelectUseRepository?: () => void;
  onOpenRecommender?: () => void;
  onOpenAuth?: () => void;
  isDark?: boolean;
}

export const NewOne: React.FC<NewOneProps> = () => {
  return (
    <div className="w-full">
      dfghfgh
    </div>
  );
};

export default NewOne;
