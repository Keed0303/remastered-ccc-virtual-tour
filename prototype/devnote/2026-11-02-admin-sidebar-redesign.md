# Admin page redesign with a sidebar

**Date:** 2026-11-02
**Status:** Implemented on `main`, not committed yet

## Goal

Replace the admin page's top navigation bar with a left sidebar, and refresh the page around it so the two look like one design.

## Layout

**Wide screens, above 900px:** a fixed dark sidebar on the left, with the content beside it.

- **Top:** CCC mark and "Campus Admin"
- **Middle:** Dashboard, Users, and Settings, each with an icon. The current section is marked for screen readers too.
- **Bottom:** the logged-in name and role, a link back to the campus, and Log out

**Phones and small tablets, 900px and below:** there is no room for a fixed sidebar, so it becomes a drawer.

- A slim top bar shows a menu button and the current section's name.
- The drawer slides in from the left. Choosing a section, tapping outside it, or pressing Escape closes it.

## Visual refresh

This uses the existing colours and fonts, and adds no new features.

- Cards and the table share one border and shadow style.
- Settings checkboxes look like toggle switches. They stay real checkboxes, so keyboards and screen readers work as before.
- The dashboard says when nobody is online, instead of showing an empty space.

## What stays the same

- All data, permissions, and the login page
- Element ids that the browser tests use, including `#tabs`, `#me-name`, and `#logout`
- The user table still becomes cards on phones
- The copyright line

## Files

- New: `src/components/admin/AdminSidebar.tsx`
- Changed: `AdminPage.tsx`, `DashboardTab.tsx`, `src/styles/admin.css`, `tests/e2e/regression.spec.ts`

## Checks

- A browser test for the sidebar on wide screens and the drawer on phones
- Screenshots of each section at 1440, 1024, and 390px wide
- All admin tests run on the demo backend, so nothing touches live data

## Outcome

Found in the screenshots: at 1024px the sidebar narrowed the table enough to push Edit and Delete out of view. That column is now pinned to the table's right edge, and the other columns scroll beneath it.
