// components/FileUploader. tsx
'use client';

import { useState, useRef } from 'react';
import { parseGoodreadsCSV } from '@/lib/parseGoodreadsCSV';
import { calculateSpineWidth } from '@/lib/spineWidth';
import { EnrichedBook, GoodreadsBook } from '@/types/book';

interface FileUploaderProps {
  onBooksLoaded: (books: EnrichedBook[]) => void;
  setIsLoading: (loading: boolean) => void;
}

export default function FileUploader({ onBooksLoaded, setIsLoading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processBooks = (goodreadsBooks: GoodreadsBook[]) => {
    const enrichedBooks: EnrichedBook[] = goodreadsBooks.map((book) => {
      const yearRead = book.dateRead 
        ? new Date(book.dateRead).getFullYear() 
        : undefined;

      return {
        ...book,
        accuratePageCount: book.numberOfPages,
        spineWidth: calculateSpineWidth(book.numberOfPages),
        yearRead,
        // We'll add image fetching in the next step
        coverImageUrl: undefined,
        spineImageUrl:  undefined,
      };
    });

    onBooksLoaded(enrichedBooks);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    if (!file. name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setIsLoading(false);
      return;
    }

    try {
      const books = await parseGoodreadsCSV(file);
      
      if (books.length === 0) {
        setError('No read books found in the CSV file');
        setIsLoading(false);
        return;
      }

      processBooks(books);
    } catch (err) {
      setError('Error parsing CSV file. Please make sure it\'s a valid Goodreads export.');
      setIsLoading(false);
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-4 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-amber-500 bg-amber-50' 
            : 'border-amber-300 bg-white hover: border-amber-400 hover:bg-amber-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <svg
            className="mx-auto h-16 w-16 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-xl font-semibold text-amber-900 mb-2">
              Upload your Goodreads Library
            </p>
            <p className="text-sm text-amber-700 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-amber-600">
              Export your library from Goodreads:  My Books → Import and export → Export Library
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-8 bg-amber-50 rounded-lg p-6 border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-2">How to export from Goodreads:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
          <li>Go to <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="underline">goodreads.com/review/import</a></li>
          <li>Click "Export Library" button</li>
          <li>Wait for the email with your CSV file</li>
          <li>Download the CSV and upload it here</li>
        </ol>
      </div>
    </div>
  );
}