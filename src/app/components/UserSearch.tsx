'use client';

import { useState } from "react";
import { db } from "#/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", searchTerm));
      const querySnapshot = await getDocs(q);

      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      setResults(users);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = (uid: string) => {
    router.push(`/profile/${uid}`);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-900 rounded-2xl shadow-lg">
      {/* Search Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name..."
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white outline-none"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700"
        >
          Search
        </button>
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-400 mt-3">Searching...</p>}

      {/* Results */}
      <ul className="mt-4 space-y-2">
        {results.length > 0 ? (
          results.map((user) => (
            <li
              key={user.id}
              onClick={() => goToProfile(user.id)}
              className="cursor-pointer px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </li>
          ))
        ) : (
          !loading &&
          searchTerm && (
            <p className="text-gray-400 mt-3">No users found.</p>
          )
        )}
      </ul>
    </div>
  );
}
