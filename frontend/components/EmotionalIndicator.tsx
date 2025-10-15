// File: frontend/components/EmotionalIndicator.tsx
import { motion } from "framer-motion";
import { Smile, Frown, Meh, Sparkles } from 'lucide-react';
import { useMemo } from "react";

interface EmotionalIndicatorProps {
  mood: string;
  color: string;
}

const EmotionalIndicator = ({ mood, color }: EmotionalIndicatorProps) => {
  const Icon = useMemo(() => {
    switch(mood.toLowerCase()){
      case 'excited':
      case 'adventurous':
      case 'joyful':
        return Sparkles;
      case 'relaxed':
      case 'calm':
        return Smile;
      case 'stressed':
      case 'frustrated':
        return Frown;
      default:
        return Meh;
    }
  }, [mood]);

  return (
    <motion.div
      key={mood}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/20"
    >
      <div className="relative flex items-center justify-center">
         <motion.div 
            className="absolute h-3 w-3 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
         />
      </div>
       <Icon className="h-4 w-4 ml-3" style={{ color }} />
      <span className="text-sm font-medium text-white capitalize">{mood}</span>
    </motion.div>
  );
};

export default EmotionalIndicator;

