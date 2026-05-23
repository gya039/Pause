'use client';

import { db } from './firebase';
import {
  collection, addDoc, updateDoc, setDoc, doc, getDoc, getDocs,
  query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp, deleteDoc,
} from 'firebase/firestore';

export async function logItem(userId, { name, price, mood, url, imageUrl }) {
  const now       = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return addDoc(collection(db, 'items'), {
    userId,
    name,
    price:     price ? Math.abs(parseFloat(price)) : null,
    mood,
    url:       url       || null,
    imageUrl:  imageUrl  || null,
    status:    'waiting',
    loggedAt:  Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
    reviewedAt: null,
    notified:  false,
  });
}

export function subscribeToWaitingItems(userId, callback) {
  const q = query(
    collection(db, 'items'),
    where('userId', '==', userId),
    where('status', '==', 'waiting'),
    orderBy('expiresAt', 'asc'),
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToHistory(userId, filterStatus, callback) {
  const statuses = filterStatus === 'all' ? ['bought', 'saved'] : [filterStatus];
  const q = query(
    collection(db, 'items'),
    where('userId', '==', userId),
    where('status', 'in', statuses),
    orderBy('reviewedAt', 'desc'),
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function getItem(itemId) {
  const snap = await getDoc(doc(db, 'items', itemId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function reviewItem(itemId, decision) {
  await updateDoc(doc(db, 'items', itemId), {
    status:     decision,
    reviewedAt: serverTimestamp(),
  });
}

export async function getSavedTotal(userId) {
  const snap = await getDocs(query(
    collection(db, 'items'),
    where('userId', '==', userId),
    where('status', '==', 'saved'),
  ));
  return snap.docs
    .map(d => d.data().price)
    .filter(p => p != null && p >= 0)
    .reduce((sum, p) => sum + p, 0);
}

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(userId, updates) {
  await setDoc(doc(db, 'users', userId), updates, { merge: true });
}

export async function createUserProfile(userId, email) {
  await setDoc(doc(db, 'users', userId), {
    email,
    createdAt:          serverTimestamp(),
    isPro:              false,
    currency:           'GBP',
    emailNotifications: true,
  }, { merge: true });
}

export async function exportUserData(userId) {
  const snap = await getDocs(query(
    collection(db, 'items'),
    where('userId', '==', userId),
  ));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id:         d.id,
      name:       data.name,
      price:      data.price,
      mood:       data.mood,
      status:     data.status,
      loggedAt:   data.loggedAt?.toDate().toISOString(),
      expiresAt:  data.expiresAt?.toDate().toISOString(),
      reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() ?? null,
    };
  });
}

export async function deleteUserData(userId) {
  const snap = await getDocs(query(
    collection(db, 'items'),
    where('userId', '==', userId),
  ));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'users', userId));
}
