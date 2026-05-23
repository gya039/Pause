export const MOODS = [
  { id: 'tired',   emoji: '😴', label: 'Tired',   bg: '#E0E7FF', text: '#3730A3' },
  { id: 'bored',   emoji: '😐', label: 'Bored',   bg: '#EBEBEB', text: '#52525B' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', bg: '#FEF3C7', text: '#9A3412' },
  { id: 'happy',   emoji: '😊', label: 'Happy',   bg: '#DCFCE7', text: '#15803D' },
  { id: 'calm',    emoji: '😌', label: 'Calm',    bg: '#EDE9FE', text: '#5B21B6' },
];

export const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.id, m]));
