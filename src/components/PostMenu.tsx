"use client";

import { auth } from "#/lib/firebase";
import { doc, deleteDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "#/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function PostMenu({post}){

 const userId = auth.currentUser.uid;

 const deletePost = async ()=>{
   await deleteDoc(doc(db,"posts",post.id));
 };

 const reportPost = async (reason)=>{

  await addDoc(collection(db,"reports"),{
    postId:post.id,
    reporterId:userId,
    reason,
    createdAt:serverTimestamp()
  });

  await updateDoc(doc(db,"posts",post.id),{
    reportCount:(post.reportCount||0)+1
  });

 };

 const blockUser = async ()=>{

  await updateDoc(
   doc(db,"users",userId),
   {blockedUsers:arrayUnion(post.userId)}
  );

 };

 const notInterested = async ()=>{

  await updateDoc(
   doc(db,"users",userId),
   {notInterestedPosts:arrayUnion(post.id)}
  );

 };


 if(userId === post.userId){

  return(
    <button onClick={deletePost}>
      Delete
    </button>
  );

 }

 return(

  <div className="flex gap-2">

   <button onClick={()=>reportPost("Spam")}>
     Report
   </button>

   <button onClick={notInterested}>
     Not Interested
   </button>

   <button onClick={blockUser}>
     Block User
   </button>

  </div>

 );

}