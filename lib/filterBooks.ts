import { EnrichedBook, BookshelfFilters } from '@/types/book';

export const filterBooks = (
  books:  EnrichedBook[],
  filters: BookshelfFilters
): EnrichedBook[] => {
  return books.filter((book) => {
    // Year filter
    if (filters.year !== 'all' && book.yearRead?.toString() !== filters.year) {
      return false;
    }

    // Shelf filter
    if (filters.shelf !== 'all' && ! book.bookshelves.includes(filters.shelf)) {
      return false;
    }

    return true;
  });
};

export const getUniqueYears = (books: EnrichedBook[]): string[] => {
  const years = books
    .map((book) => book.yearRead?.toString())
    .filter(Boolean) as string[];
  
  return ['all', ...Array.from(new Set(years)).sort().reverse()];
};

export const getUniqueShelves = (books:  EnrichedBook[]): string[] => {
  const shelves = books. flatMap((book) => book.bookshelves);
  return ['all', ...Array.from(new Set(shelves)).sort()];
};