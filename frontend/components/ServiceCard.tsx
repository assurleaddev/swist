// File: frontend/components/ServiceCard.tsx
import { Card, CardContent } from "@/components/ui/card/Card";
import { ArrowRight } from 'lucide-react';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer">
      <CardContent className="p-6">
        <div className="flex flex-col items-start space-y-4">
          <div className="text-swiss-red">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ArrowRight className="absolute bottom-4 right-4 h-6 w-6 text-gray-400 group-hover:text-swiss-red transition-colors duration-300 transform group-hover:translate-x-1" />
      </CardContent>
    </Card>
  );
}

