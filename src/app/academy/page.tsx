import Navbar from '#/components/Navbar';
import Footer from '#/components/Footer';
import { GraduationCap, Clock, Users, Star, Play, Award } from 'lucide-react';

const courses = [
  {
    id: 1,
    title: "Basic Film Making",
    instructor: "Riazul Karim",
    rating: 4.8,
    students: 1250,
    duration: "6 Weeks",
    price: 1999,
    originalPrice: 2999,
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400"
  },
  {
    id: 2,
    title: "Advanced Cinematography",
    instructor: "Sojal Ahmed",
    rating: 4.9,
    students: 890,
    duration: "8 Weeks",
    price: 2999,
    originalPrice: 3999,
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1542190905-4c41edf5e0fb?w=400"
  },
  {
    id: 3,
    title: "Video Editing Masterclass",
    instructor: "Nusrat Jahan",
    rating: 4.7,
    students: 1567,
    duration: "10 Weeks",
    price: 2499,
    originalPrice: 3499,
    level: "Advanced",
    thumbnail: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400"
  },
  {
    id: 4,
    title: "Sound Designing",
    instructor: "Ariful Islam",
    rating: 4.6,
    students: 678,
    duration: "4 Weeks",
    price: 1499,
    originalPrice: 1999,
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
  }
];

export default function Academy() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Cinema Academy</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Learn professional film making from industry experts. Start your cinema career today!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">5,000+</h3>
            <p className="text-gray-400">Students</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">50+</h3>
            <p className="text-gray-400">Courses</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">4.8/5</h3>
            <p className="text-gray-400">Rating</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <GraduationCap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">100+</h3>
            <p className="text-gray-400">Experts</p>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-gray-400 mb-3">by {course.instructor}</p>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{course.students}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{course.duration}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="bg-blue-600 px-2 py-1 rounded text-sm">{course.level}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-400">₹{course.price}</span>
                    <span className="text-gray-400 line-through">₹{course.originalPrice}</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Enroll Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Free Resources Section */}
        <div className="mt-16 bg-gray-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Free Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <Play className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Free Tutorials</h3>
              <p className="text-gray-300">50+ free video tutorials</p>
            </div>
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <Award className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Certification</h3>
              <p className="text-gray-300">Get certified after course completion</p>
            </div>
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Community</h3>
              <p className="text-gray-300">10,000+ filmmakers community</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}