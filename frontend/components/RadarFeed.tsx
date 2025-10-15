// File: frontend/components/RadarFeed.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Radar } from 'lucide-react';

interface RadarFeedProps {
  feed: string;
  loading: boolean;
}

export default function RadarFeed({ feed, loading }: RadarFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Radar</CardTitle>
        <Radar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-5/6 animate-pulse"></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{feed}</p>
        )}
      </CardContent>
    </Card>
  );
}

