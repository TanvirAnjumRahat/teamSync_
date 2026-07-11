import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useFirestore = <T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, JSON.stringify(constraints)]);

  const add = async (item: Omit<T, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding document:', err);
      throw new Error(err.message);
    }
  };

  const update = async (id: string, item: Partial<T>) => {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...item,
        updatedAt: Timestamp.now(),
      });
    } catch (err: any) {
      console.error('Error updating document:', err);
      throw new Error(err.message);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (err: any) {
      console.error('Error deleting document:', err);
      throw new Error(err.message);
    }
  };

  const getById = async (id: string): Promise<T | null> => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (err: any) {
      console.error('Error getting document:', err);
      throw new Error(err.message);
    }
  };

  return { data, loading, error, add, update, remove, getById };
};

// Helper functions for common queries
export const createQuery = {
  where,
  orderBy,
};

// Type for Firestore Timestamp
export type FirestoreTimestamp = Timestamp;