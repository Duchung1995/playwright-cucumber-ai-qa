import type { Page } from '@playwright/test';
import { Header } from './components/Header';

export abstract class BasePage {
  readonly header: Header;

  constructor(protected readonly page: Page) {
    this.header = new Header(page);
  }

  /** Path relative to BASE_URL. */
  protected abstract readonly path: string;

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }
}
