// lib/database.ts
import { supabase } from './supabase';
import { EnrichedBook, Book, Bookshelf } from '@/types/book';

// Save books to database
export const saveBooksToDatabase = async (userId: string, books: EnrichedBook[]) => {
  // First, save all books
  const booksToInsert = books.map(book => ({
    user_id: userId,
    goodreads_book_id: book.bookId,
    title: book. title,
    author: book.author,
    author_last_first: book.authorLastFirst,
    additional_authors: book.additionalAuthors,
    isbn: book.isbn,
    isbn13: book.isbn13,
    cover_image_url: book.coverImageUrl,
    number_of_pages: book.numberOfPages,
    publisher: book.publisher,
    binding: book.binding,
    year_published: book.yearPublished,
    original_publication_year: book.originalPublicationYear,
    my_rating: book.myRating,
    average_rating: book.averageRating,
    date_read: book.dateRead,
    date_added: book. dateAdded,
    year_read: book.yearRead,
    exclusive_shelf: book.exclusiveShelf,
    my_review:  book.myReview,
    spoiler:  book.spoiler,
    private_notes: book.privateNotes,
    read_count: book.readCount,
    owned_copies: book.ownedCopies,
  }));

  const { data:  savedBooks, error:  booksError } = await supabase
    .from('books')
    .upsert(booksToInsert, { 
      onConflict: 'user_id,goodreads_book_id',
      ignoreDuplicates: false 
    })
    .select();

  if (booksError) throw booksError;

  // Extract unique shelves from books
  const allShelves = new Set<string>();
  books.forEach(book => {
    if (book.exclusiveShelf) allShelves.add(book.exclusiveShelf);
    book.bookshelves.forEach(shelf => allShelves.add(shelf));
  });

  // Create bookshelves
  const shelvesToInsert = Array.from(allShelves).map(shelfName => ({
    user_id: userId,
    name: shelfName,
    is_default: ['read', 'currently-reading', 'to-read'].includes(shelfName),
  }));

  const { data: savedShelves, error: shelvesError } = await supabase
    .from('bookshelves')
    .upsert(shelvesToInsert, { 
      onConflict: 'user_id,name',
      ignoreDuplicates: true 
    })
    .select();

  if (shelvesError) throw shelvesError;

  // Create book-shelf relationships
  const bookShelfRelations:  any[] = [];
  
  savedBooks?. forEach(savedBook => {
    const originalBook = books.find(b => b.bookId === savedBook.goodreads_book_id);
    if (! originalBook) return;

    // Add to exclusive shelf
    if (originalBook. exclusiveShelf) {
      const shelf = savedShelves?. find(s => s.name === originalBook.exclusiveShelf);
      if (shelf) {
        bookShelfRelations.push({
          book_id: savedBook.id,
          bookshelf_id: shelf.id,
        });
      }
    }

    // Add to custom shelves
    originalBook.bookshelves.forEach(shelfName => {
      const shelf = savedShelves?.find(s => s.name === shelfName);
      if (shelf && shelfName !== originalBook.exclusiveShelf) {
        bookShelfRelations. push({
          book_id:  savedBook.id,
          bookshelf_id: shelf.id,
        });
      }
    });
  });

  if (bookShelfRelations.length > 0) {
    const { error: relationsError } = await supabase
      .from('book_shelves')
      .upsert(bookShelfRelations, { 
        onConflict: 'book_id,bookshelf_id',
        ignoreDuplicates: true 
      });

    if (relationsError) throw relationsError;
  }

  return savedBooks;
};

// Get all books for a user
export const getUserBooks = async (userId: string): Promise<EnrichedBook[]> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('date_read', { ascending: false });

  if (error) throw error;

  return data. map(book => ({
    bookId: book.goodreads_book_id || '',
    title: book.title,
    author: book.author,
    authorLastFirst: book.author_last_first || '',
    additionalAuthors:  book.additional_authors || '',
    isbn: book.isbn || '',
    isbn13: book. isbn13 || '',
    numberOfPages: book.number_of_pages || 0,
    myRating: book.my_rating || 0,
    averageRating: book.average_rating || 0,
    publisher: book.publisher || '',
    binding: book.binding || '',
    yearPublished: book.year_published || 0,
    originalPublicationYear: book. original_publication_year || 0,
    dateRead: book.date_read || '',
    dateAdded: book. date_added || '',
    bookshelves: [],
    bookshelvesWithPositions: '',
    exclusiveShelf: book.exclusive_shelf as any,
    myReview: book.my_review || '',
    spoiler: book.spoiler || '',
    privateNotes: book.private_notes || '',
    readCount: book.read_count || 0,
    ownedCopies: book.owned_copies || 0,
    accuratePageCount: book.number_of_pages || 0,
    spineWidth: Math.max((book.number_of_pages || 0) / 100, 20),
    yearRead: book.year_read,
    coverImageUrl: book.cover_image_url,
    spineImageUrl: book.cover_image_url,
    friendRating: book.friend_rating || 0,
  }));
};

// Get all bookshelves for a user
export const getUserBookshelves = async (userId:  string) => {
  const { data, error } = await supabase
    .from('bookshelves')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw error;
  return data;
};

// Get books by shelf
export const getBooksByShelf = async (userId: string, shelfName: string): Promise<EnrichedBook[]> => {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      book_shelves! inner(
        bookshelves!inner(name)
      )
    `)
    .eq('user_id', userId)
    .eq('book_shelves.bookshelves. name', shelfName);

  if (error) throw error;

  return data.map(book => ({
    bookId: book. goodreads_book_id || '',
    title: book.title,
    author: book.author,
    authorLastFirst: book. author_last_first || '',
    additionalAuthors: book. additional_authors || '',
    isbn: book.isbn || '',
    isbn13: book.isbn13 || '',
    numberOfPages: book.number_of_pages || 0,
    myRating:  book.my_rating || 0,
    averageRating:  book.average_rating || 0,
    publisher: book.publisher || '',
    binding: book. binding || '',
    yearPublished: book.year_published || 0,
    originalPublicationYear: book.original_publication_year || 0,
    dateRead: book.date_read || '',
    dateAdded: book.date_added || '',
    bookshelves: [],
    bookshelvesWithPositions:  '',
    exclusiveShelf:  book.exclusive_shelf as any,
    myReview: book. my_review || '',
    spoiler: book.spoiler || '',
    privateNotes: book. private_notes || '',
    readCount: book.read_count || 0,
    ownedCopies: book.owned_copies || 0,
    accuratePageCount: book.number_of_pages || 0,
    spineWidth: Math.max((book.number_of_pages || 0) / 100, 20),
    yearRead: book.year_read,
    coverImageUrl: book.cover_image_url,
    spineImageUrl: book.cover_image_url,
  }));
};

// Get books by year
export const getBooksByYear = async (userId: string, year:  number): Promise<EnrichedBook[]> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .eq('year_read', year)
    .order('date_read', { ascending: false });

  if (error) throw error;

  return data.map(book => ({
    bookId: book.goodreads_book_id || '',
    title:  book.title,
    author: book.author,
    authorLastFirst: book.author_last_first || '',
    additionalAuthors: book.additional_authors || '',
    isbn: book.isbn || '',
    isbn13: book.isbn13 || '',
    numberOfPages: book.number_of_pages || 0,
    myRating: book.my_rating || 0,
    averageRating: book.average_rating || 0,
    publisher: book.publisher || '',
    binding: book.binding || '',
    yearPublished: book.year_published || 0,
    originalPublicationYear: book. original_publication_year || 0,
    dateRead: book. date_read || '',
    dateAdded: book.date_added || '',
    bookshelves: [],
    bookshelvesWithPositions: '',
    exclusiveShelf: book.exclusive_shelf as any,
    myReview: book.my_review || '',
    spoiler: book. spoiler || '',
    privateNotes: book.private_notes || '',
    readCount: book. read_count || 0,
    ownedCopies:  book.owned_copies || 0,
    accuratePageCount:  book.number_of_pages || 0,
    spineWidth: Math.max((book.number_of_pages || 0) / 100, 20),
    yearRead: book.year_read,
    coverImageUrl:  book.cover_image_url,
    spineImageUrl: book.cover_image_url,
  }));
};

// Get books with 5-star rating
export const getFiveStarBooks = async (userId: string): Promise<EnrichedBook[]> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .eq('my_rating', 5)
    .order('date_read', { ascending: false });

  if (error) throw error;

  return data.map(book => ({
    bookId: book.goodreads_book_id || '',
    title: book.title,
    author: book.author,
    authorLastFirst: book. author_last_first || '',
    additionalAuthors: book. additional_authors || '',
    isbn: book.isbn || '',
    isbn13: book.isbn13 || '',
    numberOfPages: book.number_of_pages || 0,
    myRating:  book.my_rating || 0,
    averageRating:  book.average_rating || 0,
    publisher: book.publisher || '',
    binding: book. binding || '',
    yearPublished: book.year_published || 0,
    originalPublicationYear: book.original_publication_year || 0,
    dateRead: book.date_read || '',
    dateAdded: book.date_added || '',
    bookshelves: [],
    bookshelvesWithPositions:  '',
    exclusiveShelf:  book.exclusive_shelf as any,
    myReview: book. my_review || '',
    spoiler: book.spoiler || '',
    privateNotes: book. private_notes || '',
    readCount: book.read_count || 0,
    ownedCopies: book.owned_copies || 0,
    accuratePageCount: book.number_of_pages || 0,
    spineWidth: Math.max((book.number_of_pages || 0) / 100, 20),
    yearRead: book.year_read,
    coverImageUrl: book.cover_image_url,
    spineImageUrl: book.cover_image_url,
  }));
};