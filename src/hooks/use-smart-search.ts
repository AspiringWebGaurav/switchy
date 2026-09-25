"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  SmartSearchEngine,
  SearchResult,
  sanitizeQuery,
  isValidQuery,
} from "@/lib/search/smart-search";

export interface UseSmartSearchOptions {
  items: string[];
  debounceMs?: number;
  maxSuggestions?: number;
}

export interface SmartSearchState {
  query: string;
  results: SearchResult;
  suggestions: string[];
  isSearching: boolean;
  hasInteracted: boolean;
}

export interface SmartSearchActions {
  setQuery: (query: string) => void;
  selectSuggestion: (suggestion: string) => void;
  reset: () => void;
  acceptCorrection: () => void;
}

export type UseSmartSearchReturn = SmartSearchState & SmartSearchActions;

const EMPTY_RESULT: SearchResult = {
  matches: [],
  suggestion: null,
  isSupported: true,
  confidence: 1,
  message: null,
};

export function useSmartSearch({
  items,
  debounceMs = 150,
  maxSuggestions = 5,
}: UseSmartSearchOptions): UseSmartSearchReturn {
  // Initialize search engine (memoized)
  const searchEngine = useMemo(() => {
    return new SmartSearchEngine(items, { maxSuggestions });
  }, [items, maxSuggestions]);

  // State
  const [query, setQueryInternal] = useState("");
  const [results, setResults] = useState<SearchResult>(EMPTY_RESULT);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Refs for debouncing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef("");

  // Perform search with debouncing
  const performSearch = useCallback(
    (searchQuery: string) => {
      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const sanitized = sanitizeQuery(searchQuery);

      // Immediate UI update for responsiveness
      setQueryInternal(searchQuery);
      setHasInteracted(true);

      // Empty query - reset to default
      if (!sanitized) {
        setResults(EMPTY_RESULT);
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      // Validate query
      if (!isValidQuery(sanitized)) {
        setResults({
          matches: [],
          suggestion: null,
          isSupported: false,
          confidence: 0,
          message: "Please enter a valid search term",
        });
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      // Show loading state
      setIsSearching(true);

      // Debounced search
      debounceRef.current = setTimeout(() => {
        // Get instant suggestions (prefix-based)
        const prefixSuggestions = searchEngine.getSuggestions(sanitized);
        setSuggestions(prefixSuggestions);

        // Full fuzzy search
        const searchResults = searchEngine.search(sanitized);
        setResults(searchResults);

        setIsSearching(false);
      }, debounceMs);
    },
    [searchEngine, debounceMs]
  );

  // Set query handler
  const setQuery = useCallback(
    (newQuery: string) => {
      performSearch(newQuery);
    },
    [performSearch]
  );

  // Select a suggestion
  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setQueryInternal(suggestion);
      setResults({
        matches: [
          {
            item: suggestion,
            score: 1,
            matchType: "exact",
            distance: 0,
          },
        ],
        suggestion: null,
        isSupported: true,
        confidence: 1,
        message: null,
      });
      setSuggestions([]);
      setIsSearching(false);
    },
    []
  );

  // Accept "Did you mean?" correction
  const acceptCorrection = useCallback(() => {
    if (results.suggestion) {
      selectSuggestion(results.suggestion);
    }
  }, [results.suggestion, selectSuggestion]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQueryInternal("");
    setResults(EMPTY_RESULT);
    setSuggestions([]);
    setIsSearching(false);
    setHasInteracted(false);
    lastQueryRef.current = "";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    suggestions,
    isSearching,
    hasInteracted,
    setQuery,
    selectSuggestion,
    reset,
    acceptCorrection,
  };
}
