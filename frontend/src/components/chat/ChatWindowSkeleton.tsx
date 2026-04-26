import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

const ChatWindowSkeleton = () => {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden w-full">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Messages Body Skeleton */}
      <div className="flex-1 overflow-hidden p-4 space-y-6 overflow-y-auto overflow-x-hidden">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "flex items-end gap-3",
              i % 2 === 0 ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar skeleton for received messages */}
            {i % 2 !== 0 && (
              <Skeleton className="h-8 w-8 rounded-full shrink-0 mb-1" />
            )}
            
            <div className={cn(
              "space-y-1 max-w-[70%]",
              i % 2 === 0 ? "flex flex-col items-end" : ""
            )}>
              {/* Message bubble skeleton */}
              <Skeleton
                className={cn(
                  "min-h-[40px] rounded-2xl",
                  i % 2 === 0 
                    ? "bg-primary/20 w-[180px] rounded-br-none" 
                    : "bg-muted/60 w-[220px] rounded-bl-none",
                  i % 3 === 0 ? "h-20" : "h-10" // Varying heights
                )}
              />
              <Skeleton className={cn(
                "h-2 w-12 bg-muted/40 rounded",
                i % 2 === 0 ? "mr-1" : "ml-1"
              )} />
            </div>
          </div>
        ))}
      </div>

      {/* Input Skeleton */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 relative">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default ChatWindowSkeleton;
