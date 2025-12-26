'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import FileUploader from '@/components/FileUploader';
import BookPlaylist from '@/components/BookPlaylist';
import { EnrichedBook } from '@/types/book';

export default function Home() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, loading:  authLoading, signOut } = useAuth();
  const router = useRouter();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not logged in (will redirect)
  if (!user) {
    return null;
  }

  const handleBooksLoaded = (loadedBooks: EnrichedBook[]) => {
    setBooks(loadedBooks);
  };

  return (
    <main className="min-h-screen bg-[#121212]">
      {/* Header with profile */}
      <div className="bg-[#181818] border-b border-gray-800">
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">📚 My Reading List</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                {profile?. username. charAt(0).toUpperCase() || '?'}
              </div>
              <span className="text-white text-sm">{profile?.username}</span>
            </div>
            <button
              onClick={signOut}
              className="text-gray-400 hover:text-white text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {! isLoading && books.length === 0 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Welcome, {profile?.username}!
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Upload your Goodreads library to create your reading playlist
          </p>
          <FileUploader onBooksLoaded={handleBooksLoaded} setIsLoading={setIsLoading} />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading your books... Could take some time if you have a large library.</p>
          </div>
        </div>
      )}

      {books.length > 0 && ! isLoading && (
        <BookPlaylist books={books} />
      )}
    </main>
  );
}