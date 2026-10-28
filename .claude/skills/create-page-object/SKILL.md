---
name: create-page-object
description: Scaffold a new typed Page Object (or component) that follows the repo's POM and locator rules and register it in PageObjects. Use when a scenario needs a page or widget that has no page object yet.
---
# Create a page object

1. Explore the page first (`explore-page` skill) and pick locators by the priority in `.claude/rules/locators.md`.
2. Create `src/pages/<Name>Page.ts`:
   ```ts
   import type { Locator, Page } from '@playwright/test';
   import { BasePage } from './BasePage';

   export class FavoritesPage extends BasePage {
     protected readonly path = '/account/favorites';

     readonly items: Locator;
     readonly emptyMessage: Locator;

     constructor(page: Page) {
       super(page);
       this.items = page.getByTestId('favorite-item');
       this.emptyMessage = page.getByText('You have no favorites');
     }

     item(name: string): Locator {
       return this.items.filter({ hasText: name });
     }

     async remove(name: string): Promise<void> {
       await this.item(name).getByRole('button', { name: 'Delete' }).click();
     }
   }
   ```
   Reusable widgets (header, filters, modals) go in `src/pages/components/` and are composed into pages.
3. Register it in `src/pages/index.ts`:
   ```ts
   get favorites(): FavoritesPage {
     return this.get('favorites', () => new FavoritesPage(this.page));
   }
   ```
4. Run `npm run typecheck`. The post-edit hook also does this automatically.
