// File: frontend/components/MCPContext.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip/tooltip";

interface MCPContextProps {
  context: string;
  loading: boolean;
}

export default function MCPContext({ context, loading }: MCPContextProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Why this suggestion?</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This explains the AI's reasoning based on the MCP (Model Context Protocol).</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md dark:bg-gray-700 w-5/6 animate-pulse"></div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{context}</p>
        )}
      </CardContent>
    </Card>
  );
}

