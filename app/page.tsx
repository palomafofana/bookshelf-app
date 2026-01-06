'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import FileUploader from '@/components/FileUploader';
import BookPlaylist from '@/components/BookPlaylist';
import Sidebar from '@/components/Sidebar';
import { EnrichedBook } from '@/types/book';
import {
  getUserBooks,
  getUserBookshelves,
  getBooksByShelf,
  getBooksByYear,
  getFiveStarBooks,
  saveBooksToDatabase,
} from '@/lib/database';

export default function Home() {
  const [books, setBooks] = useState<EnrichedBook[]>([]);
  const [allBooks, setAllBooks] = useState<EnrichedBook[]>([]);
  const [bookshelves, setBookshelves] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('all');
  const [playlistTitle, setPlaylistTitle] = useState('All Books');
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const { user, profile, loading:  authLoading, signOut } = useAuth();
  const router = useRouter();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load user's books on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userBooks = await getUserBooks(user. id);
      const userShelves = await getUserBookshelves(user.id);
      
      // Extract unique years
      const uniqueYears = Array.from(
        new Set(userBooks.map(b => b.yearRead).filter(Boolean))
      ).sort((a, b) => b!  - a!) as number[];

      setAllBooks(userBooks);
      setBooks(userBooks);
      setBookshelves(userShelves);
      setYears(uniqueYears);
      setCurrentView('all');
      setPlaylistTitle('All Books');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooksLoaded = async (loadedBooks: EnrichedBook[]) => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Save to database
      await saveBooksToDatabase(user.id, loadedBooks);
      // Reload from database
      await loadUserData();
    } catch (error) {
      console.error('Error saving books:', error);
      alert('Error saving books to database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectShelf = async (shelfName: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const shelfBooks = await getBooksByShelf(user.id, shelfName);
      setBooks(shelfBooks);
      setCurrentView(`shelf-${shelfName}`);
      setPlaylistTitle(shelfName);
    } catch (error) {
      console.error('Error loading shelf:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectYear = async (year: number) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const yearBooks = await getBooksByYear(user.id, year);
      setBooks(yearBooks);
      setCurrentView(`year-${year}`);
      setPlaylistTitle(`Books from ${year}`);
    } catch (error) {
      console.error('Error loading year:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/${profile?. username}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard! ');
  };

  const handleSearchUser = () => {
    if (searchUsername.trim()) {
      window.location.href = `/shared/${searchUsername. trim()}`;
    }
  };

  const handleSelectFiveStars = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const fiveStarBooks = await getFiveStarBooks(user.id);
      setBooks(fiveStarBooks);
      setCurrentView('5-stars');
      setPlaylistTitle('5 Star Reads');
    } catch (error) {
      console.error('Error loading 5-star books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAllBooks = () => {
    setBooks(allBooks);
    setCurrentView('all');
    setPlaylistTitle('All Books');
  };

  const handleCreateNewPlaylist = async () => {
    if (!user || !profile) return;

    const friendUsername = prompt('Enter username to compare with: ');
    if (!friendUsername || ! friendUsername.trim()) return;

    try {
      setIsLoading(true);
      
      const { supabase } = await import('@/lib/supabase');
      
      // Get friend's profile
      const { data: friendProfile, error: friendError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', friendUsername. trim())
        .single();

      if (friendError || !friendProfile) {
        alert(`User "${friendUsername}" not found`);
        setIsLoading(false);
        return;
      }

      // Get your books
      const { data: yourBooks, error: yourError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id);

      if (yourError) throw yourError;

      // Get friend's books
      const { data:  theirBooks, error: theirError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', friendProfile. id);

      if (theirError) throw theirError;

      // Find books in common
      const commonBooks:  any[] = [];
      
      yourBooks?.forEach(yourBook => {
        const matchingBook = theirBooks?.find(
          theirBook => 
            yourBook.title. toLowerCase().trim() === theirBook.title.toLowerCase().trim() &&
            yourBook.author. toLowerCase().trim() === theirBook.author.toLowerCase().trim()
        );

        if (matchingBook) {
          commonBooks.push(yourBook);
        }
      });

      if (commonBooks.length === 0) {
        alert(`No books in common with ${friendUsername}`);
        setIsLoading(false);
        return;
      }

      // Create shelf name
      const shelfName = `${profile.username} × ${friendUsername}`;

      // Check if shelf already exists
      const { data: existingShelf } = await supabase
        . from('bookshelves')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', shelfName)
        .single();

      let shelfId;

      if (existingShelf) {
        // Use existing shelf
        shelfId = existingShelf.id;
        
        // Delete old book-shelf relationships
        await supabase
          .from('book_shelves')
          .delete()
          .eq('bookshelf_id', shelfId);
      } else {
        // Create new shelf
        const { data: newShelf, error: shelfError } = await supabase
          .from('bookshelves')
          .insert({
            user_id: user. id,
            name: shelfName,
            is_default: false,
          })
          .select()
          .single();

        if (shelfError) throw shelfError;
        shelfId = newShelf.id;
      }

      // Add common books to the shelf
      const bookShelfRelations = commonBooks.map(book => ({
        book_id: book.id,
        bookshelf_id: shelfId,
      }));

      if (bookShelfRelations.length > 0) {
        const { error: relError } = await supabase
          .from('book_shelves')
          .insert(bookShelfRelations);

        if (relError) throw relError;
      }

      // Reload user data to show the new shelf
      await loadUserData();
      
      // Navigate to the new comparison shelf
      await handleSelectShelf(shelfName);
      
      alert(`Created playlist with ${commonBooks.length} books in common! `);
      
    } catch (error:  any) {
      console.error('Error creating comparison:', error);
      alert(`Error: ${error.message || 'Failed to create comparison'}`);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Don't render if not logged in
  if (!user) {
    return null;
  }

  // Show upload screen if no books
  if (! isLoading && allBooks.length === 0) {
    return (
      <main className="min-h-screen bg-[#121212]">
        {/* Header */}
        <div className="bg-[#181818] border-b border-gray-800">
          <div className="container mx-auto px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">My Reading List</h1>
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

        <div className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Welcome, {profile?.username}!
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Upload your Goodreads library to create your reading playlist
          </p>
          <FileUploader onBooksLoaded={handleBooksLoaded} setIsLoading={setIsLoading} />
        </div>
      </main>
    );
  }

  // Show main app with sidebar
  return (
    <div className="h-screen flex flex-col bg-[#121212]">
      {/* Top Header */}
      <div className="bg-[#181818] border-b border-gray-800 flex-shrink-0">
        <div className="px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Reading List</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                {profile?.username.charAt(0).toUpperCase() || '?'}
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

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          bookshelves={bookshelves}
          years={years}
          onSelectShelf={handleSelectShelf}
          onSelectYear={handleSelectYear}
          onSelectFiveStars={handleSelectFiveStars}
          onSelectAllBooks={handleSelectAllBooks}
          onCreateNewPlaylist={handleCreateNewPlaylist} 
          currentView={currentView}
        />

        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-400">Loading...</p>
              </div>
            </div>
          ) : (
            <BookPlaylist 
            books={books} 
            playlistTitle={playlistTitle} 
            username={profile?.username}
            profile={profile}
            />
          )}
        </main>
      </div>
    </div>
  );
}