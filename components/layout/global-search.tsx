'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Book, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchResult {
  type: 'book' | 'chapter';
  id: string;
  title: string;
  bookTitle?: string;
  bookId?: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    if (result.type === 'book') {
      router.push(`/dashboard/books/${result.id}`);
    } else {
      router.push(`/dashboard/books/${result.bookId}/chapters/${result.id}`);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search books, chapters..."
        className="pl-10 pr-10 rounded-sm bg-transparent! border-gray-500! focus:border-primary"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 1 && setIsOpen(true)}
      />

      {/* Clear button (×) – hidden when loading or query empty */}
      {query.length > 0 && !loading && (
        <button
          onClick={clearQuery}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Loading spinner – replaces the clear button when loading */}
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {/* Results dropdown – solid background */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-md shadow-lg z-20 max-h-80 overflow-y-auto">
          <ul>
            {results.map((result) => (
              <li key={`${result.type}-${result.id}`}>
                <button
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-accent flex items-center gap-3"
                >
                  {result.type === 'book' ? (
                    <Book className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{result.title}</p>
                    {result.type === 'chapter' && (
                      <p className="text-xs text-muted-foreground truncate">
                        In: {result.bookTitle}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && results.length === 0 && query.length > 1 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-md shadow-lg z-20 p-4 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            No results found for
            <span className="truncate max-w-[200px] inline-block align-bottom">
              "{query}"
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
