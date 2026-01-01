import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, 
  addDoc, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';

export function useFirestore(collectionName, userId, handbookId = null) {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!userId) {
      setData([]);
      return;
    }

    const constraints = [where("uid", "==", userId)];
    
    // handbookId가 있으면 해당 수첩 데이터만, 없으면(null) 모든 데이터(예: 수첩 목록) 가져오기
    if (handbookId) {
      constraints.push(where("handbookId", "==", handbookId));
    }

    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
    });

    return () => unsubscribe();
  }, [collectionName, userId, handbookId]);

  const add = async (newItem) => {
    if (!userId) return null;
    
    const docData = {
      ...newItem,
      uid: userId,
      createdAt: new Date().toISOString()
    };

    if (handbookId) {
      docData.handbookId = handbookId;
    }

    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id; 
  };

  const remove = async (id) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  const update = async (id, updatedFields) => {
    await updateDoc(doc(db, collectionName, id), updatedFields);
  };

  return { data, add, remove, update };
}