import { Loader2 } from 'lucide-react';

export const Loader = ({ size = 20 }: { size?: number }) => (
  <div className="flex justify-center items-center">
    <Loader2 size={size} className="animate-spin text-primary" />
  </div>
);
