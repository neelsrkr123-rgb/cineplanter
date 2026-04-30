"use client";
import { useSearchParams } from "next/navigation";

export default function MoviePage() {
  const searchParams = useSearchParams();
  const youtube = searchParams.get("youtube");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="aspect-video mb-6">
        {youtube ? (
          <iframe
            src={youtube.replace("watch?v=", "embed/")}
            className="w-full h-full rounded-lg"
            allowFullScreen
          ></iframe>
        ) : (
          <p>No video available</p>
        )}
      </div>
      <h1 className="text-3xl font-bold mb-4">Movie Title</h1>
      <p className="text-gray-400 mb-4">Cast & Crew | Year</p>
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="font-semibold mb-2">Reviews</h2>
        <p className="text-gray-400">No reviews yet.</p>
      </div>
    </div>
  );
}
