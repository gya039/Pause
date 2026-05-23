const { onSchedule }              = require('firebase-functions/v2/scheduler');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth }                 = require('firebase-admin/auth');
const { Resend }                  = require('resend');

const db     = getFirestore();
const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = 'https://pause-d4fe8.web.app';

exports.checkExpiredItems = onSchedule('every 15 minutes', async () => {
  const now = Timestamp.now();

  const snapshot = await db.collection('items')
    .where('status', '==', 'waiting')
    .where('expiresAt', '<=', now)
    .where('notified', '==', false)
    .limit(100)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();

  for (const doc of snapshot.docs) {
    const item = doc.data();

    const userDoc = await db.collection('users').doc(item.userId).get();
    if (!userDoc.data()?.emailNotifications) continue;

    let email;
    try {
      const user = await getAuth().getUser(item.userId);
      email = user.email;
    } catch {
      continue;
    }

    const reviewUrl = `${APP_URL}/review?id=${doc.id}`;

    try {
      await resend.emails.send({
        from:    'Pause <notifications@pause-app.co>',
        to:      email,
        subject: `⏰ Still want ${item.name}?`,
        html:    buildEmail(item, reviewUrl),
      });
      batch.update(doc.ref, { notified: true });
    } catch (emailErr) {
      console.error(`Failed to send email for item ${doc.id}:`, emailErr.message);
      // Don't mark as notified — will retry next run
    }
  }

  await batch.commit();
});

function buildEmail(item, reviewUrl) {
  const emoji = { tired: '😴', bored: '😐', anxious: '😰', happy: '😊', calm: '😌' };
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
      <h2 style="font-size:20px;margin-bottom:4px">Time's up</h2>
      <p style="color:#666;margin-bottom:20px">Yesterday you wanted:</p>
      <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin-bottom:20px;text-align:center">
        <strong style="font-size:18px">${item.name}</strong>
        ${item.price != null ? `<br><span style="color:#666">£${item.price}</span>` : ''}
        <br><span style="margin-top:8px;display:inline-block">You were feeling: ${emoji[item.mood] || ''} ${item.mood}</span>
      </div>
      <p style="margin-bottom:16px;font-weight:600">Still want it?</p>
      <div style="display:flex;gap:12px">
        <a href="${reviewUrl}?decision=bought"
           style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">
          Yes, buy it
        </a>
        <a href="${reviewUrl}?decision=saved"
           style="display:inline-block;background:#f0f0f0;color:#111;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          No, I'm good
        </a>
      </div>
    </div>
  `;
}
