## 1. Implementation

- [x] 1.1 Remove Switch Site dropdown UI from the Site Switcher Card (FormControl with Select component)
- [x] 1.2 Remove related state variables: `availableSites`, `selectedSite`, `isSwitchingSite`
- [x] 1.3 Remove `loadAvailableSites()` function
- [x] 1.4 Remove `handleSiteChange()` event handler
- [x] 1.5 Remove `fetchOrganizationUserSites` import (no longer needed in this file)
- [x] 1.6 Simplify the Site Switcher Card layout to show breadcrumb only (removed the 6-column grid split)
- [x] 1.7 Verify the card still displays organization and current site in the breadcrumb
- [x] 1.8 Update the `loadData()` function to use `currentSiteId` directly instead of `selectedSite`
