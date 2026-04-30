import Navbar from "#/components/Navbar";
import Footer from "#/components/Footer";
import VideoPlayer from "#/components/VideoPlayer";
import { mockMovies } from "#/lib/constants";


import { Star, Clock, Calendar, User } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default function MoviePage({ params }: PageProps) {
  const movie = mockMovies.find(m => m.id === params.id) || mockMovies[0]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <VideoPlayer youtubeId={movie.youtubeId} title={movie.title} />
            
            <div className="mt-6">
              <h1 className="text-3xl font-bold mb-4">{movie.title}</h1>
              
              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>{movie.rating}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">{movie.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">{movie.uploadDate}</span>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">{movie.description}</p>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">uploader</h2>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-300" />
                </div>
                <span>{movie.uploader.name}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}