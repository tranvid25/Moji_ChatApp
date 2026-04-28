import React, { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Film, Search, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface GifPickerProps {
  onSelect: (url: string) => void;
}

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || "SvyM4r40pharoboNjkUHLCktfByXrjJF";
const LIMIT = 20;

export default function GifPicker({ onSelect }: GifPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"gif" | "sticker">("gif");
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Record<string, any[]>>({});

  const searchGifs = async (searchQuery: string, newOffset: number = 0, isLoadMore = false) => {
    if (!searchQuery.trim()) {
      setGifs([]);
      setHasMore(false);
      return;
    }
    
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    
    const type = activeTab === "gif" ? "gifs" : "stickers";
    const cacheKey = `${type}_${searchQuery}`;

    if (!isLoadMore && cacheRef.current[cacheKey]) {
      setGifs(cacheRef.current[cacheKey]);
      setHasMore(cacheRef.current[cacheKey].length >= LIMIT);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://api.giphy.com/v1/${type}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          searchQuery
        )}&limit=${LIMIT}&offset=${newOffset}`
      );
      const data = await res.json();
      
      const results = data.data || [];
      if (isLoadMore) {
        setGifs((prev) => {
           const newGifs = [...prev, ...results];
           cacheRef.current[cacheKey] = newGifs;
           return newGifs;
        });
      } else {
        cacheRef.current[cacheKey] = results;
        setGifs(results);
      }
      
      setHasMore(results.length === LIMIT);
      setOffset(newOffset);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchTrending = async (newOffset: number = 0, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    const type = activeTab === "gif" ? "gifs" : "stickers";
    const cacheKey = `${type}_trending`;

    if (!isLoadMore && cacheRef.current[cacheKey]) {
      setGifs(cacheRef.current[cacheKey]);
      setHasMore(cacheRef.current[cacheKey].length >= LIMIT);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://api.giphy.com/v1/${type}/trending?api_key=${GIPHY_API_KEY}&limit=${LIMIT}&offset=${newOffset}`
      );
      const data = await res.json();
      
      const results = data.data || [];
      if (isLoadMore) {
        setGifs((prev) => {
           const newGifs = [...prev, ...results];
           cacheRef.current[cacheKey] = newGifs;
           return newGifs;
        });
      } else {
        cacheRef.current[cacheKey] = results;
        setGifs(results);
      }
      
      setHasMore(results.length === LIMIT);
      setOffset(newOffset);
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (query.trim() === "") {
        fetchTrending();
        return;
    }

    timeoutRef.current = setTimeout(() => {
      searchGifs(query, 0, false);
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, activeTab]);

  useEffect(() => {
    if(isOpen && query.trim() === "") {
        fetchTrending(0, false);
    }
  }, [isOpen, activeTab]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && !loadingMore && hasMore) {
        if (query.trim()) {
            searchGifs(query, offset + LIMIT, true);
        } else {
            fetchTrending(offset + LIMIT, true);
        }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 transition-smooth">
          <Film className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-[320px] p-0 mb-2 border border-border/50 shadow-xl rounded-xl overflow-hidden bg-background"
      >
        <div className="flex border-b border-border/50">
            <button 
                onClick={() => {
                  setActiveTab('gif');
                  setOffset(0);
                  setGifs([]);
                }}
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'gif' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted'}`}
            >
                GIFs
            </button>
            <button 
                onClick={() => {
                  setActiveTab('sticker');
                  setOffset(0);
                  setGifs([]);
                }}
                className={`flex-1 py-2 text-sm font-medium ${activeTab === 'sticker' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted'}`}
            >
                Stickers
            </button>
        </div>
        <div className="p-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[300px] overflow-y-auto p-2 scroll-smooth"
        >
          {loading && gifs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Không tìm thấy kết quả
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <div
                  key={gif.id}
                  className="relative cursor-pointer overflow-hidden rounded-md bg-muted aspect-square group"
                  onClick={() => {
                    onSelect(gif.images.original.url);
                    setIsOpen(false);
                  }}
                >
                  <img
                    src={gif.images.fixed_width.url}
                    alt={gif.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
          
          {loadingMore && (
            <div className="flex justify-center py-2 mt-2">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
