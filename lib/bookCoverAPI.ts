// lib/bookCoverAPI.ts

export interface BookImageData {
  coverImageUrl?:  string;
  thumbnailUrl?:  string;
  source?: string;
}

const GOOGLE_API_KEY = process.env. NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

// Clean and normalize strings for better matching
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Extract main title without series info
const cleanTitle = (title: string): string => {
  return title
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/\s*\[[^\]]*\]\s*/g, '')
    .replace(/:\s*.*$/, '')
    .trim();
};

// Extract author last name - IMPROVED to handle Jr., Sr., etc.
const getAuthorLastName = (author:  string): string => {
  if (! author) return '';
  
  // Remove common suffixes
  const cleaned = author.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/gi, '').trim();
  
  const parts = cleaned.split(/\s+/);
  return parts[parts.length - 1];
};

// Check if Open Library image actually exists (not a placeholder)
const validateOpenLibraryImage = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) return false;
    
    const blob = await response.blob();
    
    // Open Library placeholders are very small (< 500 bytes)
    // Real book covers are usually > 5KB
    if (blob.size < 5000) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// 1. Open Library by Title
const tryOpenLibraryTitle = async (title: string, author: string): Promise<string | null> => {
  try {
    const cleanedTitle = cleanTitle(title);
    const authorLastName = getAuthorLastName(author);
    
    let response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanedTitle)}&author=${encodeURIComponent(authorLastName)}&limit=5`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(authorLastName)}&limit=5`,
        { signal: AbortSignal.timeout(5000) }
      );
    }

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.docs && data.docs.length > 0) {
      for (const doc of data.docs) {
        if (doc.cover_i) {
          const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
          
          const isValid = await validateOpenLibraryImage(url);
          if (! isValid) continue;
          
          const resultTitle = normalizeString(doc.title || '');
          const searchTitle = normalizeString(cleanedTitle);
          
          if (resultTitle. includes(searchTitle. substring(0, Math.max(5, searchTitle.length / 2))) ||
              searchTitle.includes(resultTitle.substring(0, Math.max(5, resultTitle.length / 2)))) {
            return url;
          }
        }
      }
      
      for (const doc of data.docs) {
        if (doc.cover_i) {
          const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
          const isValid = await validateOpenLibraryImage(url);
          if (isValid) return url;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

// 2. Google Books by ISBN
const tryGoogleBooksISBN = async (isbn: string): Promise<string | null> => {
  if (!isbn || ! GOOGLE_API_KEY) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes? q=isbn:${isbn}&key=${GOOGLE_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response. json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      
      if (item.volumeInfo. imageLinks?.thumbnail) {
        return item.volumeInfo.imageLinks.thumbnail. replace('zoom=1', 'zoom=0');
      }
      
      return `https://books.google.com/books/content?id=${item. id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
    }

    return null;
  } catch {
    return null;
  }
};

// 3. Google Books by Title + Author
const tryGoogleBooksTitle = async (title: string, author:  string): Promise<string | null> => {
  if (! GOOGLE_API_KEY) return null;

  const cleanedTitle = cleanTitle(title);
  const authorLastName = getAuthorLastName(author);

  const searches = [
    `intitle:"${cleanedTitle}"+inauthor: ${authorLastName}`,
    `intitle:"${title}"+inauthor:${authorLastName}`,
    `intitle:"${cleanedTitle}"`,
    `${cleanedTitle. replace(/\s+/g, '+')}+${authorLastName}`,
    `${cleanedTitle.split(' ').slice(0, 3).join('+')}+${authorLastName}`,
  ];

  for (const query of searches) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_API_KEY}&maxResults=3`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            const resultTitle = normalizeString(item. volumeInfo.title);
            const searchTitle = normalizeString(cleanedTitle);
            const resultAuthor = normalizeString(item.volumeInfo.authors?.[0] || '');
            const searchAuthor = normalizeString(author);
            
            const titleMatch = 
              resultTitle.includes(searchTitle.substring(0, Math. max(5, searchTitle.length / 2))) ||
              searchTitle.includes(resultTitle.substring(0, Math.max(5, resultTitle.length / 2)));
            
            const authorMatch = 
              resultAuthor. includes(searchAuthor.split(' ')[searchAuthor.split(' ').length - 1]) ||
              searchAuthor.includes(resultAuthor.split(' ')[resultAuthor.split(' ').length - 1]);
            
            if (titleMatch && authorMatch) {
              if (item.volumeInfo.imageLinks?. thumbnail) {
                return item. volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=0');
              }
              
              return `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
            }
          }
        }
      }
    } catch {
      continue;
    }
  }

  return null;
};

// MAIN FUNCTION
export const fetchBookCover = async (
  title:  string,
  author: string,
  isbn13?: string,
  isbn?:  string
): Promise<BookImageData | null> => {
  
  // Strategy 1: Google Books ISBN13
  if (isbn13) {
    const googleISBN13 = await tryGoogleBooksISBN(isbn13);
    if (googleISBN13) return { coverImageUrl: googleISBN13, thumbnailUrl: googleISBN13, source: 'Google-ISBN13' };
  }

  // Strategy 2: Google Books ISBN
  if (isbn) {
    const googleISBN = await tryGoogleBooksISBN(isbn);
    if (googleISBN) return { coverImageUrl: googleISBN, thumbnailUrl: googleISBN, source: 'Google-ISBN' };
  }

  // Strategy 3: Open Library title search (validated)
  const openLibTitle = await tryOpenLibraryTitle(title, author);
  if (openLibTitle) return { coverImageUrl: openLibTitle, thumbnailUrl: openLibTitle, source: 'OpenLibrary-Title' };

  // Strategy 4: Google Books title search
  const googleTitle = await tryGoogleBooksTitle(title, author);
  if (googleTitle) return { coverImageUrl: googleTitle, thumbnailUrl: googleTitle, source: 'Google-Title' };

  return null;
};