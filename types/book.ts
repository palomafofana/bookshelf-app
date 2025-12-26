// Books from Goodreads CSV
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

// Database types
export interface Profile {
  id:  string;
  username: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  goodreads_book_id?:  string;
  title: string;
  author: string;
  author_last_first?:  string;
  additional_authors?:  string;
  isbn?:  string;
  isbn13?: string;
  cover_image_url?: string;
  number_of_pages?: number;
  publisher?: string;
  binding?: string;
  year_published?: number;
  original_publication_year?: number;
  my_rating?: number;
  average_rating?: number;
  date_read?: string;
  date_added?: string;
  year_read?: number;
  exclusive_shelf?: string;
  my_review?: string;
  spoiler?: string;
  private_notes?: string;
  read_count?: number;
  owned_copies?: number;
  created_at:  string;
  updated_at:  string;
}

export interface Bookshelf {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public:  boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}