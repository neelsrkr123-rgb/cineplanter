"use client";

import { useState,useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "#/lib/firebase";
import { auth } from "#/lib/firebase";

export default function CommentSection({postId}){

 const [comments,setComments] = useState([]);
 const [text,setText] = useState("");

 useEffect(()=>{

  const q = query(
    collection(db,"posts",postId,"comments"),
    orderBy("createdAt","desc")
  );

  const unsubscribe = onSnapshot(q,(snapshot)=>{

    const data = snapshot.docs.map(doc=>({
      id:doc.id,
      ...doc.data()
    }));

    setComments(data);

  });

  return ()=>unsubscribe();

 },[postId]);


 const addComment = async ()=>{

   if(!text.trim()) return;

   await addDoc(
     collection(db,"posts",postId,"comments"),
     {
       text,
       userId:auth.currentUser.uid,
       createdAt:serverTimestamp()
     }
   );

   const postRef = doc(db,"posts",postId);

   await updateDoc(postRef,{
     commentsCount:increment(1)
   });

   setText("");

 };


 return(

  <div className="mt-3">

    <div className="flex gap-2">

      <input
       value={text}
       onChange={(e)=>setText(e.target.value)}
       className="border flex-1 p-1"
       placeholder="Write comment..."
      />

      <button onClick={addComment}>
        Post
      </button>

    </div>

    {comments.map(c=>(
      <div key={c.id} className="text-sm mt-2">
        {c.text}
      </div>
    ))}

  </div>

 );
}