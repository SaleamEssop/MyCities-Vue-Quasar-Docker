# UI Core - Versioned UI Assets

## Purpose

This directory contains **frozen, versioned UI assets** that are treated as immutable once approved.

## Structure

```
/src/ui-core/
├── README.md          (this file)
├── v1/                (FROZEN - 16 Dec 2025)
│   ├── UI_LOCK.md
│   ├── DashboardPage.vue
│   ├── AccountsListPage.vue
│   ├── EnterReadingsPage.vue
│   └── SplashPage.vue
├── v2/                (future version)
└── v3/                (future version)
```

## Rules

| Rule | Description |
|------|-------------|
| 🔒 **Frozen versions are immutable** | Once approved, NO changes allowed |
| 📁 **New version for any change** | Even small changes require a new version |
| 📋 **UI_LOCK.md required** | Each frozen version must have a lock file |
| ⏪ **Keep old versions** | For rollback and reference |

## Workflow

1. **Development**: Work on active files in `/src/pages/`
2. **Approval**: User explicitly approves the UI
3. **Freeze**: Copy files to `/src/ui-core/vN/`
4. **Lock**: Add `UI_LOCK.md` to the version folder
5. **Future changes**: Create new version folder (v2, v3, etc.)

## Current Versions

| Version | Status | Date | Notes |
|---------|--------|------|-------|
| v1 | 🔒 FROZEN | 16 Dec 2025 | Initial unified header design |

## Usage

### Active Development
```javascript
// Uses files from /src/pages/
import DashboardPage from 'pages/user/DashboardPage.vue'
```

### Rollback to Frozen Version
```bash
# Copy from frozen version to active pages
cp src/ui-core/v1/*.vue src/pages/
```

