<template>
  <div class="dashboard">
    <h1 class="page-title">Welcome back, {{ user?.name }}</h1>

    <div class="top-overview">
      <div class="overview-card">
        <h2 class="overview-title">Activity Overview</h2>
        <div class="overview-row">
          <div class="overview-item">
            <div class="overview-value">{{ totalWorkouts }}</div>
            <div class="overview-label">Total Workouts</div>
          </div>
          <div class="overview-item">
            <div class="overview-value">{{ formatMinutes(totalMinutesEver) }}</div>
            <div class="overview-label">Total time</div>
          </div>
        </div>
      </div>

        <div class="overview-card">
          <h2 class="overview-title">Progress</h2>
          <div class="overview-row">
            <div class="overview-item">
              <div class="overview-value">{{ workoutsThisWeek }}</div>
              <div class="overview-label">Workouts this week</div>
            </div>
            <div class="overview-item">
              <div class="overview-value">{{ avgDurationThisWeek }}min</div>
              <div class="overview-label">Avg duration this week</div>
            </div>
          </div>
        </div>
    </div>

    <div class="quick-actions">
      <h2 class="section-title">Quick Actions</h2>
      <div class="actions-grid">
        <router-link to="/workout/start" class="action-card">
          <h3>Quick Workout</h3>
          <p>Start a workout without a template</p>
        </router-link>

        <router-link to="/templates" class="action-card">
          <h3>My Templates</h3>
          <p>View and manage workout templates</p>
        </router-link>

        <router-link to="/exercises" class="action-card">
          <h3>Exercises</h3>
          <p>Browse exercise library</p>
        </router-link>

        <router-link to="/history" class="action-card">
          <h3>History</h3>
          <p>View past workouts</p>
        </router-link>
      </div>
    </div>

    <div class="recent-activity" v-if="recentSessions.length > 0">
      <h2 class="section-title">Recent Activity</h2>
      <div class="activity-list">
        <div v-for="session in recentSessions" :key="session.id" class="activity-item">
          <div class="activity-content">
            <h4>{{ session.name }}</h4>
            <p>{{ formatDate(session.date_completed) }}</p>
          </div>
          <div class="activity-duration">{{ session.duration_minutes }} min</div>
        </div>
      </div>
    </div>

    <div class="calendar-section">
      <h2 class="section-title">This Month</h2>
      <div class="calendar-row">
        <div class="calendar">
        <div class="calendar-weekdays">
          <div v-for="d in weekdays" :key="d" class="weekday">{{ d }}</div>
        </div>
        <div class="calendar-days">
          <div v-for="cell in monthCells" :key="cell.key" class="calendar-cell">
            <div v-if="cell.day" class="day-wrapper">
              <div :class="['day-number', { 'workout-day': isWorkoutDay(cell.dateStr) }]">
                {{ cell.day }}
              </div>
              <span v-if="cell.dateStr === todayYMD" class="today-dot" aria-hidden="true"></span>
            </div>
          </div>
        </div>
        </div>

        <div class="calendar-summary">
          <h3 class="summary-title">Month Summary</h3>
          <div class="summary-item">
            <div class="summary-value">{{ workoutsThisMonth }}</div>
            <div class="summary-label">Workouts</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ avgDurationThisMonth }}</div>
            <div class="summary-label">Avg duration (min)</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ setsThisMonth }}</div>
            <div class="summary-label">Sets</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ formatVolume(monthlyVolume) }}</div>
            <div class="summary-label">Volume (kg)</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ activeDaysThisMonth }}</div>
            <div class="summary-label">Active days</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ longestStreak }}</div>
            <div class="summary-label">Longest streak</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useSessionStore } from '../../stores/sessions';

const authStore = useAuthStore();
const sessionStore = useSessionStore();

const user = computed(() => authStore.user);
const totalWorkouts = ref(0);
const workoutsThisWeek = ref(0);
const weeklyVolume = ref(0);
const avgDurationThisWeek = ref(0);
const recentSessions = ref([]);
const workoutsThisMonth = ref(0);
const totalMinutesThisMonth = ref(0);
const monthlyVolume = ref(0);
const longestStreak = ref(0);
const activeDaysThisMonth = ref(0);
const avgDurationThisMonth = ref(0);
const setsThisMonth = ref(0);
const totalMinutesEver = ref(0);
const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const today = new Date();
const displayYear = ref(today.getFullYear());
const displayMonth = ref(today.getMonth());
const todayYMD = formatYMD(today);

const monthCells = computed(() => {
  const year = displayYear.value;
  const month = displayMonth.value;
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const leadingEmpty = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < leadingEmpty; i++) {
    cells.push({ key: `empty-${i}`, day: null, dateStr: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dateStr = formatYMD(dt);
    cells.push({ key: `d-${d}`, day: d, dateStr });
  }

  return cells;
});

function formatYMD(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function updateMonthStats(sessions) {
  const year = displayYear.value;
  const month = displayMonth.value;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const inMonth = [];
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    if (!s.date_completed) continue;
    const d = new Date(s.date_completed);
    if (d >= monthStart && d <= monthEnd) inMonth.push(s);
  }

  workoutsThisMonth.value = inMonth.length;

  let minutes = 0;
  for (let i = 0; i < inMonth.length; i++) {
    minutes += Number(inMonth[i].duration_minutes || 0);
  }
  totalMinutesThisMonth.value = minutes;

  const seenDays = new Set();
  for (let i = 0; i < inMonth.length; i++) {
    seenDays.add(formatYMD(new Date(inMonth[i].date_completed)));
  }
  activeDaysThisMonth.value = seenDays.size;

  if (inMonth.length > 0) {
    avgDurationThisMonth.value = Math.round(totalMinutesThisMonth.value / inMonth.length);
  } else {
    avgDurationThisMonth.value = 0;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let maxDaily = 0;
  let current = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = formatYMD(new Date(year, month, d));
    if (workoutDatesSet.value.has(ds)) {
      current += 1;
      if (current > maxDaily) maxDaily = current;
    } else {
      current = 0;
    }
  }

  const weekStarts = new Set();
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    if (!s.date_completed) continue;
    const d = new Date(s.date_completed);
    d.setHours(0, 0, 0, 0);
    const wd = d.getDay();
    const off = (wd + 6) % 7;
    d.setDate(d.getDate() - off);
    weekStarts.add(formatYMD(d));
  }

  let streak = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const twd = todayStart.getDay();
  const toff = (twd + 6) % 7;
  todayStart.setDate(todayStart.getDate() - toff);
  const cur = new Date(todayStart);
  while (weekStarts.has(formatYMD(cur))) {
    streak += 1;
    cur.setDate(cur.getDate() - 7);
  }

  longestStreak.value = streak;
}

async function fetchMonthlyVolume() {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiBase}/stats/progress`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    if (!response.ok) return;
    const data = await response.json();

    const monthKey = `${displayYear.value}-${(displayMonth.value + 1).toString().padStart(2, '0')}`;
    const found = (data.monthlyVolume || []).find(m => m.month === monthKey);
    monthlyVolume.value = found ? Number(found.volume || 0) : 0;
  } catch (err) {
    console.error('Failed to fetch monthly volume:', err);
  }
}

function isWorkoutDay(dateStr) {
  if (!dateStr) return false;
  return workoutDatesSet.value.has(dateStr);
}

const workoutDatesSet = ref(new Set());

onMounted(async () => {
  try {
    await sessionStore.fetchSessions();
    const sessions = sessionStore.sessions.filter(s => s.date_completed);
    totalWorkouts.value = sessions.length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = [];
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.date_completed) continue;
      if (new Date(s.date_completed) >= weekAgo) weekSessions.push(s);
    }
    workoutsThisWeek.value = weekSessions.length;
    if (weekSessions.length > 0) {
      let total = 0;
      for (let i = 0; i < weekSessions.length; i++) {
        total += Number(weekSessions[i].duration_minutes || 0);
      }
      avgDurationThisWeek.value = Math.round(total / weekSessions.length);
    } else {
      avgDurationThisWeek.value = 0;
    }

    recentSessions.value = sessions.slice(0, 5);

    const datesSet = new Set();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.date_completed) continue;
      const d = new Date(s.date_completed);
      datesSet.add(formatYMD(d));
    }
    workoutDatesSet.value = datesSet;

    updateMonthStats(sessions);
    await fetchMonthlyVolume();

    let totalEver = 0;
    for (let i = 0; i < sessions.length; i++) {
      totalEver += Number(sessions[i].duration_minutes || 0);
    }
    totalMinutesEver.value = totalEver;

    const monthKey = `${displayYear.value}-${(displayMonth.value + 1).toString().padStart(2, '0')}`;
    const monthSessions = sessions.filter(s => formatYMD(new Date(s.date_completed)).startsWith(monthKey));
    try {
      let totalSets = 0;
      for (let i = 0; i < monthSessions.length; i++) {
        const ms = monthSessions[i];
        try {
          const full = await sessionStore.fetchSession(ms.id);
          const exercises = full.exercises || [];
          for (let j = 0; j < exercises.length; j++) {
            const ex = exercises[j];
            totalSets += (ex.sets ? ex.sets.length : 0);
          }
        } catch (err) {
          console.debug('Failed to load full session for sets count', ms.id, err?.message || err);
        }
      }
      setsThisMonth.value = totalSets;
    } catch (e) {
      console.warn('Error counting sets for month', e?.message || e);
      setsThisMonth.value = 0;
    }

    const statsResponse = await fetchWeeklyStats();
    weeklyVolume.value = statsResponse?.totalVolume ?? 0;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetchWeeklyStats() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/stats/weekly-summary`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to load weekly stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading weekly stats:', error);
    return null;
  }
}

function formatVolume(value) {
  if (value === null || value === undefined) return 0;
  const num = Number(value) || 0;
  return Math.round(num);
}

function formatMinutes(totalMinutes) {
  const mins = Number(totalMinutes) || 0;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours > 0) return `${hours}h ${rem}min`;
  return `${rem}min`;
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #1a1a1a;
  font-weight: 400;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 400;
  margin: 0;
  color: #1a1a1a;
}

.stat-label {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.8125rem;
}

.section-title {
  font-size: 1.125rem;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
  font-weight: 400;
}

.top-overview {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.overview-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  flex: 1;
}

.overview-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #1a1a1a;
}

.overview-row {
  display: flex;
  gap: 1rem;
}

.overview-item {
  flex: 1;
  text-align: center;
}

.overview-value {
  font-size: 1.75rem;
  color: #1a1a1a;
  font-weight: 600;
}

.overview-label {
  color: #666;
  font-size: 0.85rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.action-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1.5rem;
  text-align: left;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s;
  display: block;
}

.action-card:hover {
  border-color: #b0b0b0;
}

.action-card h3 {
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  font-weight: 400;
  font-size: 1rem;
}

.action-card p {
  margin: 0;
  color: #666;
  font-size: 0.8125rem;
}

.recent-activity {
  margin-top: 3rem;
}

.activity-list {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-content {
  flex: 1;
}

.activity-content h4 {
  margin: 0 0 0.25rem 0;
  color: #1a1a1a;
  font-weight: 400;
  font-size: 0.9375rem;
}

.activity-content p {
  margin: 0;
  color: #666;
  font-size: 0.8125rem;
}

.activity-duration {
  color: #666;
  font-weight: 400;
  font-size: 0.8125rem;
}

.calendar-section {
  margin-top: 3rem;
}

.calendar {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  width: 520px;
  max-width: 90%;
  min-height: 360px;
}

.calendar-row {
  display: flex;
  gap: 2rem;
  align-items: stretch;
  justify-content: center;
}

.calendar-summary {
  width: 320px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 360px;
}

.summary-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  color: #1a1a1a;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.summary-label {
  color: #666;
  font-size: 0.8rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: #666;
  font-size: 0.8125rem;
  margin-bottom: 0.5rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-cell {
  min-height: 56px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.day-number {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #333;
}

.day-number.workout-day {
  background: #1a1a1a;
  color: #fff;
}

.day-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.today-dot {
  width: 6px;
  height: 6px;
  background: #bdbdbd;
  border-radius: 50%;
  margin-top: 4px;
}
</style>