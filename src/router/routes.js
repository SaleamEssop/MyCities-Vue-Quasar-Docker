const routes = [
  // Auth Routes (with AuthLayout - no header/footer)
  {
    path: "/",
    component: () => import("layouts/AuthLayout.vue"),
    children: [
      {
        path: "login",
        component: () => import("pages/LoginPage.vue"),
        name: "login",
        meta: { title: "Login", guest: true },
      },
      {
        path: "account-setup",
        component: () => import("pages/AccountSetupPage.vue"),
        name: "account-setup",
        meta: { title: "Create Account", guest: true },
      },
      {
        path: "register",
        component: () => import("pages/RegisterPage.vue"),
        name: "register",
        meta: { title: "Register", guest: true },
      },
      {
        path: "forgot-password",
        component: () => import("pages/ForgotPasswordPage.vue"),
        name: "forgot-password",
        meta: { title: "Forgot Password", guest: true },
      },
      // Account Select - shown after login
      {
        path: "select-account",
        component: () => import("pages/AccountSelectPage.vue"),
        name: "account-select",
        meta: { title: "Select Account", requiresAuth: true },
      },
      {
        path: "dashboard",
        component: () => import("pages/user/DashboardPage.vue"),
        name: "home",
        meta: { title: "Dashboard", requiresAuth: true },
      },
      {
        path: "enter-readings",
        component: () => import("pages/user/EnterReadingsPage.vue"),
        name: "enter-readings",
        meta: { title: "Enter Readings", requiresAuth: true },
      },
      {
        path: "water-reading",
        component: () => import("pages/user/WaterReadingPage.vue"),
        name: "water-reading",
        meta: { title: "Enter Water Reading", requiresAuth: true },
      },
      {
        path: "electricity-reading",
        component: () => import("pages/user/ElectricityReadingPage.vue"),
        name: "electricity-reading",
        meta: { title: "Enter Electricity Reading", requiresAuth: true },
      },
      {
        path: "meter-input",
        component: () => import("pages/user/MeterInputPage.vue"),
        name: "meter-input",
        meta: { title: "Enter Meter Reading", requiresAuth: true },
      },
      {
        path: "readings-list",
        component: () => import("pages/user/ReadingsListPage.vue"),
        name: "readings-list",
        meta: { title: "Readings List", requiresAuth: true },
      },
      {
        path: "reading/:id",
        component: () => import("pages/user/ReadingPreviewPage.vue"),
        name: "reading-preview",
        meta: { title: "Reading Details", requiresAuth: true },
      },
      {
        path: "settings",
        component: () => import("pages/user/SettingsPage.vue"),
        name: "settings",
        meta: { title: "Settings", requiresAuth: true },
      },
      {
        path: "about",
        component: () => import("pages/user/AboutPage.vue"),
        name: "about",
        meta: { title: "About", requiresAuth: true },
      },
      {
        path: "accounts",
        component: () => import("pages/AccountsListPage.vue"),
        name: "accounts-list",
        meta: { title: "Accounts", requiresAuth: true },
      },
      {
        path: "account/new",
        component: () => import("pages/AccountSetupPage.vue"),
        name: "account-new",
        meta: { title: "Add Account", requiresAuth: true },
      },
      {
        path: "account/edit/:accountId",
        component: () => import("pages/AccountSetupPage.vue"),
        name: "account-edit",
        meta: { title: "Edit Account", requiresAuth: true },
      },
    ],
  },

  // Admin Login (separate - no layout required)
  {
    path: "/admin/login",
    component: () => import("pages/admin/AdminLoginPage.vue"),
    name: "admin-login",
    meta: { title: "Admin Login", guest: true },
  },

  // Admin Routes
  {
    path: "/admin",
    component: () => import("layouts/AdminLayout.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: "",
        redirect: { name: "admin-dashboard" },
      },
      {
        path: "dashboard",
        component: () => import("pages/admin/AdminDashboard.vue"),
        name: "admin-dashboard",
        meta: { title: "Admin Dashboard" },
      },
      {
        path: "readings",
        component: () => import("pages/admin/AdminMeterReadings.vue"),
        name: "admin-readings",
        meta: { title: "Manage Readings" },
      },
      {
        path: "readings/entry",
        component: () => import("pages/admin/ReadingsEntryAdmin.vue"),
        name: "admin-readings-entry",
        meta: { title: "Enter Readings (Admin)" },
      },
      {
        path: "billing",
        component: () => import("pages/admin/AdminBilling.vue"),
        name: "admin-billing",
        meta: { title: "Billing Management" },
      },
      {
        path: "accounts",
        component: () => import("pages/admin/AdminAccounts.vue"),
        name: "admin-accounts",
        meta: { title: "User Accounts" },
      },
      {
        path: "accounts/:accountId/bill",
        component: () => import("pages/admin/AdminAccountBill.vue"),
        name: "admin-account-bill",
        meta: { title: "Account Bill" },
      },
      {
        path: "tariffs",
        component: () => import("pages/admin/AdminTariffs.vue"),
        name: "admin-tariffs",
        meta: { title: "Tariff Management" },
      },
      {
        path: "audit",
        component: () => import("pages/admin/AdminAudit.vue"),
        name: "admin-audit",
        meta: { title: "Audit Log" },
      },
    ],
  },

  // Legacy routes - redirect
  {
    path: "/auth",
    redirect: "/login",
  },
  {
    path: "/auth/login",
    redirect: "/login",
  },

  // 404 - Always leave this as last one
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
    name: "Error",
  },
];

export default routes;
