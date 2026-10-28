import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { credentialsFor } from '../../config/env';
import { loginTokenSchema } from '../../schemas';
import type { CustomWorld } from '../../support/world';

When('I log in via the API as the {string} user', async function (this: CustomWorld, role: string) {
  const { email, password } = credentialsFor(role);
  await this.remember(await this.api.auth.login(email, password));
  const parsed = loginTokenSchema.safeParse(this.state.responseBody);
  if (parsed.success) this.state.token = parsed.data.access_token;
});

When(
  'I log in via the API with email {string} and password {string}',
  async function (this: CustomWorld, email: string, password: string) {
    const credentials = email || password ? { email, password } : {};
    await this.remember(
      await this.request.post('/users/login', { data: credentials, failOnStatusCode: false }),
    );
  },
);

When('I request my profile with the issued token', async function (this: CustomWorld) {
  expect(this.state.token, 'no token was issued by the previous login').toBeTruthy();
  await this.remember(await this.api.auth.me(this.state.token));
});

When('I request my profile with token {string}', async function (this: CustomWorld, token: string) {
  await this.remember(await this.api.auth.me(token || undefined));
});

Then('the profile email should belong to the {string} user', function (this: CustomWorld, role: string) {
  expect(this.state.responseBody).toMatchObject({ email: credentialsFor(role).email });
});

Then('no access token should be issued', function (this: CustomWorld) {
  expect(this.state.responseBody).not.toHaveProperty('access_token');
});
