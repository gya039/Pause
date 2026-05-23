'use client';

import { db } from './firebase';
import {
  collection, addDoc, updateDoc, setDoc, doc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, limit,
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

// 3.2 — accepts detected currency on first signup; merge:true won't overwrite existing prefs
export async function createUserProfile(userId, email, detectedCurrency) {
  const data = {
    email,
    createdAt:          serverTimestamp(),
    isPro:              false,
    emailNotifications: true,
  };
  // Only set currency if we have a detected value (new signup) — merge keeps existing
  if (detectedCurrency) data.currency = detectedCurrency;
  await setDoc(doc(db, 'users', userId), data, { merge: true });
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

// 3.3 — consecutive-day review streak
export async function getReviewStreak(userId) {
  const q = query(
    collection(db, 'items'),
    where('userId', '==', userId),
    where('status', 'in', ['saved', 'bought']),
    orderBy('reviewedAt', 'desc'),
    limit(60),
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const days = new Set(
    snap.docs
      .filter(d => d.data().reviewedAt)
      .map(d => {
        const date = d.data().reviewedAt?.toDate?.() ?? new Date(d.data().reviewedAt);
        return date.toDateString();
      }),
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export async function deleteUserData(userId) {
  const snap = await getDocs(query(
    collection(db, 'items'),
    where('userId', '==', userId),
  ));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'users', userId));
}
