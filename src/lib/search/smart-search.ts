/**
 * Smart Search System
 * 
 * Data Structures:
 * - Trie: O(m) prefix search where m = query length
 * - HashMap: O(1) exact lookup
 * - MinHeap: O(k log n) for top-k suggestions
 * 
 * Algorithms:
 * - Levenshtein Distance: O(m*n) edit distance
 * - Fuzzy scoring: weighted combination of metrics
 * - Prefix matching with Trie traversal
 * 
 * Complexity Analysis:
 * - Search: O(m) for prefix, O(m*n*k) worst case for fuzzy (k = dataset size)
 * - Suggestion: O(k log k) for ranking top results
 * - Correction: O(m*n) per candidate
 * 
 * Scalability:
 * - Trie enables sub-linear search for large datasets
 * - Caching prevents redundant computations
 * - Debouncing reduces API calls
 */

// ============================================
// TRIE DATA STRUCTURE
// ============================================

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  data: string | null; // Original word stored at end
  frequency: number; // Popularity weight
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return {
      children: new Map(),
      isEndOfWord: false,
      data: null,
      frequency: 0,
    };
  }

  /**
   * Insert word into Trie
   * Time: O(m) where m = word length
   * Space: O(m) for new nodes
   */
  insert(word: string, frequency: number = 1): void {
    let current = this.root;
    const normalized = word.toLowerCase();

    for (const char of normalized) {
      if (!current.children.has(char)) {
        current.children.set(char, this.createNode());
      }
      current = current.children.get(char)!;
    }

    current.isEndOfWord = true;
    current.data = word; // Store original casing
    current.frequency = frequency;
  }

  /**
   * Search for exact word
   * Time: O(m)
   */
  search(word: string): boolean {
    const node = this.findNode(word.toLowerCase());
    return node !== null && node.isEndOfWord;
  }

  /**
   * Check if prefix exists
   * Time: O(m)
   */
  startsWith(prefix: string): boolean {
    return this.findNode(prefix.toLowerCase()) !== null;
  }

  /**
   * Get all words with given prefix
   * Time: O(m + n) where n = number of matching words
   */
  getWordsWithPrefix(prefix: string): Array<{ word: string; frequency: number }> {
    const results: Array<{ word: string; frequency: number }> = [];
    const node = this.findNode(prefix.toLowerCase());

    if (node) {
      this.collectWords(node, results);
    }

    return results.sort((a, b) => b.frequency - a.frequency);
  }

  private findNode(prefix: string): TrieNode | null {
    let current = this.root;

    for (const char of prefix) {
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }

    return current;
  }

  private collectWords(
    node: TrieNode,
    results: Array<{ word: string; frequency: number }>
  ): void {
    if (node.isEndOfWord && node.data) {
      results.push({ word: node.data, frequency: node.frequency });
    }

    for (const child of node.children.values()) {
      this.collectWords(child, results);
    }
  }

  /**
   * Get all words in Trie
   */
  getAllWords(): Array<{ word: string; frequency: number }> {
    return this.getWordsWithPrefix("");
  }
}

// ============================================
// LEVENSHTEIN DISTANCE (Edit Distance)
// ============================================

/**
 * Calculate minimum edit distance between two strings
 * Time: O(m * n)
 * Space: O(min(m, n)) with optimization
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();

  // Optimize by ensuring a is shorter
  if (a.length > b.length) {
    return levenshteinDistance(b, a);
  }

  // Use single row for space optimization
  let previousRow = Array.from({ length: a.length + 1 }, (_, i) => i);

  for (let j = 1; j <= b.length; j++) {
    const currentRow = [j];

    for (let i = 1; i <= a.length; i++) {
      const insertCost = currentRow[i - 1] + 1;
      const deleteCost = previousRow[i] + 1;
      const replaceCost = previousRow[i - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0);

      currentRow.push(Math.min(insertCost, deleteCost, replaceCost));
    }

    previousRow = currentRow;
  }

  return previousRow[a.length];
}

/**
 * Normalized similarity score (0-1)
 * Higher = more similar
 */
export function similarityScore(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

// ============================================
// FUZZY MATCHING SYSTEM
// ============================================

export interface FuzzyMatch {
  item: string;
  score: number;
  matchType: "exact" | "prefix" | "fuzzy" | "substring";
  distance: number;
}

/**
 * Calculate comprehensive fuzzy match score
 * Combines multiple signals for ranking
 */
export function calculateFuzzyScore(query: string, target: string): FuzzyMatch {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();

  // Exact match
  if (q === t) {
    return { item: target, score: 1.0, matchType: "exact", distance: 0 };
  }

  // Prefix match (high priority)
  if (t.startsWith(q)) {
    const prefixScore = 0.9 + (q.length / t.length) * 0.1;
    return { item: target, score: prefixScore, matchType: "prefix", distance: 0 };
  }

  // Substring match
  if (t.includes(q)) {
    const substringScore = 0.7 + (q.length / t.length) * 0.2;
    return { item: target, score: substringScore, matchType: "substring", distance: 0 };
  }

  // Fuzzy match using Levenshtein
  const distance = levenshteinDistance(q, t);
  const similarity = similarityScore(q, t);

  // Apply threshold - if too different, low score
  const fuzzyScore = similarity > 0.4 ? similarity * 0.8 : similarity * 0.3;

  return { item: target, score: fuzzyScore, matchType: "fuzzy", distance };
}

// ============================================
// MIN HEAP (Priority Queue) for Top-K
// ============================================

export class MinHeap<T> {
  private heap: T[] = [];
  private compareFn: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number) {
    this.compareFn = compareFn;
  }

  get size(): number {
    return this.heap.length;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const top = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return top;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareFn(this.heap[index], this.heap[parentIndex]) >= 0) break;

      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.compareFn(this.heap[leftChild], this.heap[smallest]) < 0) {
        smallest = leftChild;
      }

      if (rightChild < length && this.compareFn(this.heap[rightChild], this.heap[smallest]) < 0) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  toArray(): T[] {
    return [...this.heap].sort((a, b) => -this.compareFn(a, b));
  }
}

// ============================================
// SMART SEARCH ENGINE
// ============================================

export interface SearchResult {
  matches: FuzzyMatch[];
  suggestion: string | null;
  isSupported: boolean;
  confidence: number;
  message: string | null;
}

export interface SearchConfig {
  maxSuggestions: number;
  fuzzyThreshold: number;
  suggestionThreshold: number;
  unsupportedThreshold: number;
}

const DEFAULT_CONFIG: SearchConfig = {
  maxSuggestions: 5,
  fuzzyThreshold: 0.3,      // Min score to be considered a match
  suggestionThreshold: 0.5,  // Min score for "Did you mean?"
  unsupportedThreshold: 0.25, // Below this = unsupported
};

export class SmartSearchEngine {
  private trie: Trie;
  private itemSet: Set<string>;
  private itemMap: Map<string, number>; // word -> popularity
  private cache: Map<string, SearchResult>;
  private config: SearchConfig;

  constructor(items: string[], config: Partial<SearchConfig> = {}) {
    this.trie = new Trie();
    this.itemSet = new Set();
    this.itemMap = new Map();
    this.cache = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Build index
    items.forEach((item, index) => {
      const popularity = items.length - index; // Higher index = lower popularity
      this.trie.insert(item, popularity);
      this.itemSet.add(item.toLowerCase());
      this.itemMap.set(item.toLowerCase(), popularity);
    });
  }

  /**
   * Main search function
   * Time: O(m + k*n) where m=query length, k=dataset size, n=avg item length
   */
  search(query: string): SearchResult {
    const normalizedQuery = query.trim();

    // Edge case: empty query
    if (!normalizedQuery) {
      return {
        matches: [],
        suggestion: null,
        isSupported: true,
        confidence: 1,
        message: null,
      };
    }

    // Check cache
    const cacheKey = normalizedQuery.toLowerCase();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Get all items and calculate scores
    const allItems = this.trie.getAllWords();
    const matches: FuzzyMatch[] = [];

    // Use MinHeap for top-k efficiency
    const heap = new MinHeap<FuzzyMatch>((a, b) => a.score - b.score);

    for (const { word, frequency } of allItems) {
      const match = calculateFuzzyScore(normalizedQuery, word);
      
      // Boost score by frequency
      match.score = match.score * (1 + frequency / 100);

      if (match.score >= this.config.fuzzyThreshold) {
        heap.push(match);

        // Keep only top N
        if (heap.size > this.config.maxSuggestions) {
          heap.pop();
        }
      }
    }

    // Extract sorted results
    const topMatches = heap.toArray();

    // Determine result type
    const bestMatch = topMatches[0];
    const hasExactOrPrefix = topMatches.some(
      (m) => m.matchType === "exact" || m.matchType === "prefix"
    );

    let result: SearchResult;

    if (hasExactOrPrefix) {
      // Direct match found
      result = {
        matches: topMatches,
        suggestion: null,
        isSupported: true,
        confidence: bestMatch?.score || 1,
        message: null,
      };
    } else if (bestMatch && bestMatch.score >= this.config.suggestionThreshold) {
      // Fuzzy match - show "Did you mean?"
      result = {
        matches: topMatches,
        suggestion: bestMatch.item,
        isSupported: true,
        confidence: bestMatch.score,
        message: `Did you mean "${bestMatch.item}"?`,
      };
    } else if (bestMatch && bestMatch.score >= this.config.unsupportedThreshold) {
      // Weak match - might be supported soon
      result = {
        matches: topMatches,
        suggestion: bestMatch.item,
        isSupported: false,
        confidence: bestMatch.score,
        message: `"${normalizedQuery}" is not supported yet. Did you mean "${bestMatch.item}"?`,
      };
    } else {
      // No good match - unsupported
      result = {
        matches: [],
        suggestion: null,
        isSupported: false,
        confidence: 0,
        message: `"${normalizedQuery}" is not currently supported. We've noted this request.`,
      };
    }

    // Cache result
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Get autocomplete suggestions for prefix
   * Time: O(m + n) where m=prefix length, n=matching words
   */
  getSuggestions(prefix: string): string[] {
    if (!prefix.trim()) return [];

    const results = this.trie.getWordsWithPrefix(prefix);
    return results.slice(0, this.config.maxSuggestions).map((r) => r.word);
  }

  /**
   * Find best correction for typo
   * Time: O(k * m * n) where k=dataset size
   */
  findCorrection(typo: string): string | null {
    const allItems = this.trie.getAllWords();
    let bestMatch: { word: string; score: number } | null = null;

    for (const { word } of allItems) {
      const score = similarityScore(typo, word);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { word, score };
      }
    }

    if (bestMatch && bestMatch.score >= this.config.suggestionThreshold) {
      return bestMatch.word;
    }

    return null;
  }

  /**
   * Clear cache (call when data changes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if exact item exists
   * Time: O(m)
   */
  hasItem(item: string): boolean {
    return this.itemSet.has(item.toLowerCase());
  }
}

// ============================================
// DEBOUNCE UTILITY
// ============================================

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================
// SANITIZATION UTILITIES
// ============================================

/**
 * Sanitize search input
 * - Remove special characters
 * - Normalize whitespace
 * - Prevent injection
 */
export function sanitizeQuery(query: string): string {
  return query
    .replace(/[<>{}[\]\\^~`|]/g, "") // Remove dangerous chars
    .replace(/\s+/g, " ")             // Normalize whitespace
    .trim()
    .slice(0, 100);                   // Limit length
}

/**
 * Check if query is valid
 */
export function isValidQuery(query: string): boolean {
  if (!query || query.length > 100) return false;
  if (/^[\s\W]+$/.test(query)) return false; // Only special chars
  return true;
}
