// lib/parseGoodreadsCSV.ts
import Papa from 'papaparse';
import { GoodreadsBook } from '@/types/book';

export const parseGoodreadsCSV = (file: File): Promise<GoodreadsBook[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete:  (results) => {
        const books = results.data.map((row: any) => {
          // Clean ISBN fields - remove quotes and equals signs
          const cleanISBN = (isbn: string) => {
            if (! isbn) return '';
            return isbn.replace(/[="']/g, '').trim();
          };

          return {
            bookId: row['Book Id'],
            title: row['Title'],
            author: row['Author'],
            authorLastFirst: row['Author l-f'],
            additionalAuthors: row['Additional Authors'],
            isbn: cleanISBN(row['ISBN']),
            isbn13: cleanISBN(row['ISBN13']),
            myRating: parseInt(row['My Rating']) || 0,
            averageRating: parseFloat(row['Average Rating']) || 0,
            publisher: row['Publisher'],
            binding: row['Binding'],
            numberOfPages: parseInt(row['Number of Pages']) || 0,
            yearPublished: parseInt(row['Year Published']) || 0,
            originalPublicationYear: parseInt(row['Original Publication Year']) || 0,
            dateRead: row['Date Read'],
            dateAdded: row['Date Added'],
            bookshelves: row['Bookshelves']?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
            bookshelvesWithPositions: row['Bookshelves with positions'],
            exclusiveShelf: row['Exclusive Shelf'] as 'read' | 'currently-reading' | 'to-read',
            myReview: row['My Review'],
            spoiler: row['Spoiler'],
            privateNotes: row['Private Notes'],
            readCount: parseInt(row['Read Count']) || 0,
            ownedCopies: parseInt(row['Owned Copies']) || 0,
          };
        });

        // Filter to only read books with a date
        const readBooksWithDate = books.filter(
          (book:  GoodreadsBook) => book.exclusiveShelf === 'read' && book.dateRead
        );

        resolve(readBooksWithDate);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};