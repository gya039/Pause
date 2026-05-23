const { onCall }        = require('firebase-functions/v2/https');
const { getFirestore }  = require('firebase-admin/firestore');

const db = getFirestore();

const MOODS = ['tired', 'bored', 'anxious', 'happy', 'calm'];
const DAYS  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

exports.getInsights = onCall(async (request) => {
  const userId = request.auth?.uid;
  if (!userId) throw new Error('Unauthenticated');

  const snapshot = await db.collection('items')
    .where('userId', '==', userId)
    .where('status', 'in', ['bought', 'saved'])
    .get();

  const items = snapshot.docs.map(d => d.data());

  const moodStats = {};
  MOODS.forEach(m => { moodStats[m] = { total: 0, saved: 0 }; });
  items.forEach(item => {
    if (moodStats[item.mood]) {
      moodStats[item.mood].total++;
      if (item.status === 'saved') moodStats[item.mood].saved++;
    }
  });

  const moodBreakdown = MOODS
    .filter(m => moodStats[m].total > 0)
    .map(m => ({
      mood:     m,
      total:    moodStats[m].total,
      saved:    moodStats[m].saved,
      saveRate: Math.round((moodStats[m].saved / moodStats[m].total) * 100),
    }))
    .sort((a, b) => b.total - a.total);

  const withPrice   = items.filter(i => i.price != null);
  const totalPaused = withPrice.reduce((s, i) => s + i.price, 0);
  const totalSaved  = withPrice.filter(i => i.status === 'saved').reduce((s, i) => s + i.price, 0);
  const totalBought = withPrice.filter(i => i.status === 'bought').reduce((s, i) => s + i.price, 0);

  const summary = {
    totalItems:     items.length,
    totalPaused:    Math.round(totalPaused * 100) / 100,
    totalSaved:     Math.round(totalSaved  * 100) / 100,
    totalBought:    Math.round(totalBought * 100) / 100,
    overallSaveRate: items.length > 0
      ? Math.round((items.filter(i => i.status === 'saved').length / items.length) * 100)
      : 0,
  };

  const hourCounts = {};
  items.forEach(item => {
    const h = item.loggedAt.toDate().getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const dayCounts = {};
  DAYS.forEach(d => { dayCounts[d] = { total: 0, saved: 0 }; });
  items.forEach(item => {
    const day = DAYS[item.loggedAt.toDate().getDay()];
    dayCounts[day].total++;
    if (item.status === 'saved') dayCounts[day].saved++;
  });

  return {
    free: { summary, moodBreakdown },
    pro:  { peakHour: parseInt(peakHour), dayCounts },
  };
});
