import request from 'supertest';
import { TEST_PASSWORD_PLAIN } from './factories.js';

/**
 * Log a user in via /auth/login and return a supertest agent that
 * carries the resulting session cookies. Use:
 *
 *   const agent = await loginAs(app, user);
 *   await agent.post('/messages/direct').send({...});
 */
export const loginAs = async (app, user) => {
  const agent = request.agent(app);

  const payload =
    user.role === 'operator'
      ? { fullName: user.fullName, personalCode: user.personalCode }
      : { email: user.email, password: TEST_PASSWORD_PLAIN };

  const res = await agent.post('/auth/login').send(payload);
  if (res.status !== 200) {
    throw new Error(
      `loginAs failed for ${user.email ?? user.fullName} (${user.role}): ` +
        `${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  return agent;
};
