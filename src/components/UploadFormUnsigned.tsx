"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase"; // adjust path if needed

export default function UploadFormUnsigned() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return alert("File select korun");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!); 
      // Note: for client usage you'll need NEXT_PUBLIC_ prefix in env var
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Upload failed");

      setUrl(data.secure_url);
      // save metadata to Firestore
      await addDoc(collection(db, "uploads"), {
        url: data.secure_url,
        publicId: data.public_id,
        createdAt: serverTimestamp(),
      });
      alert("Upload successful!");
    } catch (err:any) {
      console.error(err);
      alert("Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <input name="file" type="file" accept="image/*" className="mb-3" />
      <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? "Uploading..." : "Upload"}
      </button>
      {url && <img src={url} className="mt-3 w-48 h-48 object-cover rounded" alt="uploaded" />}
    </form>
  );
}
