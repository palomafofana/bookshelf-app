'use client';

import { useState, useCallback } from 'react';
import { parseGoodreadsCSV } from '@/lib/parseGoodreadsCSV';
import { fetchBookCover } from '@/lib/bookCoverAPI';
import { EnrichedBook, GoodreadsBook } from '@/types/book';

interface FileUploaderProps {
  onBooksLoaded: (books: EnrichedBook[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function FileUploader({ onBooksLoaded, setIsLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichBookWithImages = async (book: GoodreadsBook): Promise<EnrichedBook> => {
    let imageData = null;

    // Try ISBN13 first, then ISBN, then title/author
    if (book.isbn13) {
      imageData = await fetchBookCover(book.title, book.author, book.isbn13, undefined);
    }

    if (!imageData && book.isbn) {
      imageData = await fetchBookCover(book.title, book.author, undefined, book.isbn);
    }

    if (!imageData) {
      imageData = await fetchBookCover(book.title, book.author);
    }

    const yearRead = book.dateRead 
      ? new Date(book. dateRead).getFullYear() 
      : undefined;

    return {
      ...book,
      accuratePageCount: book.numberOfPages,
      spineWidth: Math.max(book.numberOfPages / 100, 20),
      yearRead,
      coverImageUrl:  imageData?. coverImageUrl,
      spineImageUrl: imageData?.thumbnailUrl,
    };
  };

  const handleFile = async (file: File) => {
    if (!file. name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const books = await parseGoodreadsCSV(file);
      
      // Enrich books with cover images (in batches to avoid rate limiting)
      const enrichedBooks:  EnrichedBook[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < books.length; i += batchSize) {
        const batch = books.slice(i, i + batchSize);
        const enrichedBatch = await Promise. all(
          batch.map(book => enrichBookWithImages(book))
        );
        enrichedBooks.push(...enrichedBatch);
        
        // Small delay between batches
        if (i + batchSize < books.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      onBooksLoaded(enrichedBooks);
    } catch (err) {
      setError('Failed to parse CSV file.  Please make sure it\'s a valid Goodreads export.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = useCallback((e: React. DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React. DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer. files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <input
          type="file"
          id="file-upload"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragActive
              ? 'border-green-500 bg-green-500 bg-opacity-10'
              : 'border-gray-600 bg-[#2a2a2a] hover:bg-[#3a3a3a]'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-12 h-12 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Goodreads CSV export file</p>
          </div>
        </label>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-400">
        <p className="mb-2">How to export your Goodreads library:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Go to Goodreads.com and log in</li>
          <li>Click "My Books" in the top menu</li>
          <li>Click "Import and export" at the top</li>
          <li>Click "Export Library" and download the CSV</li>
        </ol>
      </div>
    </div>
  );
}