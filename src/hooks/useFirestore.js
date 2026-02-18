import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch 
} from 'firebase/firestore';

// enabled: 데이터를 불러올지 말지 결정 (로그인 전이나 교무수첩 선택 전에는 false)
export function useFirestore(collectionName, userId, enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !collectionName || !enabled) {
      setData([]);
      return;
    }

    setLoading(true);
    
    // Firestore 구조: users -> {userId} -> {collectionName} -> {documents}
    // 예: users/abc1234/students_homeroom/student_001
    const q = query(collection(db, "users", userId, collectionName));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(fetchedData);
      setLoading(false);
    }, (error) => {
      console.error("DB Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, collectionName, enabled]);

  // 데이터 추가 (ID 자동 생성 또는 지정)
  const add = async (item) => {
    if (!userId) return;
    const newId = item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(db, "users", userId, collectionName, newId);
    await setDoc(docRef, { ...item, id: newId });
    return newId;
  };

  // 데이터 수정
  const update = async (id, fields) => {
    if (!userId || !id) return;
    const docRef = doc(db, "users", userId, collectionName, id);
    await updateDoc(docRef, fields);
  };

  // 데이터 삭제
  const remove = async (id) => {
    if (!userId || !id) return;
    const docRef = doc(db, "users", userId, collectionName, id);
    await deleteDoc(docRef);
  };

  // 일괄 추가 (엑셀 업로드 등)
  const addMany = async (items) => {
    if (!userId || items.length === 0) return;
    const batch = writeBatch(db);
    items.forEach(item => {
      const newId = item.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, "users", userId, collectionName, newId);
      batch.set(docRef, { ...item, id: newId });
    });
    await batch.commit();
  };

  // 전체 교체 (기존 데이터 다 지우고 새로 쓰기)
  const setAll = async (items) => {
    if (!userId) return;
    // 1. 기존 데이터 삭제 (배치 처리는 500개 제한이 있어 나눠서 처리하거나, 단순 반복으로 처리)
    // 간단하게 현재 로드된 data를 순회하며 삭제
    const batchDelete = writeBatch(db);
    data.forEach(item => {
        const docRef = doc(db, "users", userId, collectionName, item.id);
        batchDelete.delete(docRef);
    });
    await batchDelete.commit();

    // 2. 새 데이터 추가
    await addMany(items);
  };

  const updateMany = async (updates) => {
      if (!userId) return;
      const batch = writeBatch(db);
      updates.forEach(({ id, fields }) => {
          const docRef = doc(db, "users", userId, collectionName, id);
          batch.update(docRef, fields);
      });
      await batch.commit();
  }

  return { data, loading, add, update, remove, addMany, setAll, updateMany };
}