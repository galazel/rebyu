
export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',

  DASHBOARD: '/dashboard',
  DASHBOARD_ENHANCED: '/dashboard/enhanced',
  PROFILE_SETTINGS: '/settings/profile',

  ASSESSMENT_ATTEMPT: '/assessment/attempt',
  ASSESSMENT_RESULTS: '/assessment/:attemptId/results',
  LESSONS: '/lessons',
  LESSON_VIEW: '/lessons/:id',

  LEADERBOARD: '/leaderboard',
  STREAKS: '/streaks',
  STUDY_PLANS: '/study-plans',
  STUDY_PLAN_VIEW: '/study-plans/:id',

  NOTIFICATION_PREFERENCES: '/settings/notifications',

  SUBSCRIPTION: '/subscription',
  CHECKOUT_SUCCESS: '/subscription/success',
  CHECKOUT_CANCEL: '/subscription/cancel',

  COMMUNITY: '/community',
  COMMUNITY_POST_VIEW: '/community/posts/:id',
  COMMUNITY_POST_EDIT: '/community/posts/:id/edit',
  COMMUNITY_POST_CREATE: '/community/posts/new',

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_REVENUE: '/admin/revenue',
  ADMIN_USERS: '/admin/users',
}


export const PHASE_1_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PROFILE_SETTINGS,
  ROUTES.ASSESSMENT_ATTEMPT,
  ROUTES.LESSONS,
  ROUTES.COMMUNITY_POST_EDIT,
]

export const PHASE_2_ROUTES = [
  ROUTES.LEADERBOARD,
  ROUTES.STREAKS,
  ROUTES.STUDY_PLANS,
  ROUTES.NOTIFICATION_PREFERENCES,
  ROUTES.SUBSCRIPTION,
  ROUTES.ADMIN_REVENUE,
]

export const ALL_ROUTES = [
  ...Object.values(ROUTES),
  ...PHASE_1_ROUTES,
  ...PHASE_2_ROUTES,
]
