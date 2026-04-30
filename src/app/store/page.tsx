import Navbar from '#/components/Navbar';
import Footer from '#/components/Footer';
import { ShoppingCart, Download, Star, Users, Clock, Shield } from 'lucide-react';

const products = [
  {
    id: 1,
    name: "Premium Movie Pack",
    description: "10+ Exclusive HD Movies",
    price: 599,
    originalPrice: 999,
    rating: 4.8,
    sales: 234,
    image: "🎬",
    features: ["Lifetime Access", "HD Quality", "Mobile Friendly"]
  },
  {
    id: 2,
    name: "Editing Presets Bundle",
    description: "50+ Professional Presets",
    price: 299,
    originalPrice: 499,
    rating: 4.7,
    sales: 156,
    image: "🎨",
    features: ["4K Ready", "Easy Install", "Regular Updates"]
  },
  {
    id: 3,
    name: "Sound Effects Library",
    description: "200+ High Quality Sounds",
    price: 399,
    originalPrice: 699,
    rating: 4.9,
    sales: 189,
    image: "🔊",
    features: ["Royalty Free", "High Quality", "Multiple Formats"]
  },
  {
    id: 4,
    name: "Stocker Images Pack",
    description: "100+ 4K Stock Images",
    price: 199,
    originalPrice: 399,
    rating: 4.6,
    sales: 97,
    image: "🖼️",
    features: ["4K Resolution", "Commercial Use", "Regular Updates"]
  },
  {
    id: 5,
    name: "Animation Pack",
    description: "50+ Ready to Use Animations",
    price: 499,
    originalPrice: 799,
    rating: 4.8,
    sales: 123,
    image: "✨",
    features: ["After Effects", "4K Ready", "Easy Customize"]
  },
  {
    id: 6,
    name: "LUTs Pack",
    description: "30+ Cinematic LUTs",
    price: 249,
    originalPrice: 449,
    rating: 4.7,
    sales: 87,
    image: "🎥",
    features: ["All Formats", "Cinematic Look", "Easy Apply"]
  }
];

export default function Store() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-600 p-4 rounded-full">
              <ShoppingCart className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Digital Assets Store</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Take your filmmaking journey to the next level with our premium assets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <ShoppingCart className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">500+</h3>
            <p className="text-gray-400">Products</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">2,500+</h3>
            <p className="text-gray-400">Happy Customers</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">4.8/5</h3>
            <p className="text-gray-400">Average Rating</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <Download className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <h3 className="text-2xl font-bold">10,000+</h3>
            <p className="text-gray-400">Downloads</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="text-6xl mb-4 text-center">{product.image}</div>
              
              <h3 className="text-xl font-bold mb-2 text-center">{product.name}</h3>
              <p className="text-gray-400 text-center mb-4">{product.description}</p>

              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">{product.sales} sales</span>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-2xl font-bold text-blue-400">₹{product.price}</span>
                <span className="text-gray-400 line-through">₹{product.originalPrice}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Buy Now</span>
              </button>
            </div>
          ))}
        </div>

        {/* Guarantee Section */}
        <div className="mt-16 bg-gray-800 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Guarantee</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Download className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Instant Download</h3>
              <p className="text-gray-300">Download immediately after payment</p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Quality Guarantee</h3>
              <p className="text-gray-300">30-day money-back guarantee</p>
            </div>
            <div className="text-center">
              <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Lifetime Updates</h3>
              <p className="text-gray-300">Free lifetime updates for all products</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}