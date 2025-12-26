// types/book.ts

export interface GoodreadsBook {
  bookId: string;
  title: string;
  author: string;
  authorLastFirst: string;
  additionalAuthors: string;
  isbn:  string;
  isbn13: string;
  myRating: number;
  averageRating:  number;
  publisher: string;
  binding: string;
  numberOfPages: number;
  yearPublished: number;
  originalPublicationYear: number;
  dateRead: string;
  dateAdded: string;
  bookshelves: string[];
  bookshelvesWithPositions: string;
  exclusiveShelf: 'read' | 'currently-reading' | 'to-read';
  myReview: string;
  spoiler: string;
  privateNotes: string;
  readCount: number;
  ownedCopies:  number;
}

export interface EnrichedBook extends GoodreadsBook {
  accuratePageCount: number;
  spineWidth: number;
  yearRead?:  number;
  coverImageUrl?: string;
  spineImageUrl?: string;
}