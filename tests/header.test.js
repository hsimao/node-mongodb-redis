const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await page.close();
});

it('The header has the correct text', async () => {
  const text = await page.getContentsOf('a.brand-logo');
  expect(text).toEqual('Blogster');
});

it('Clicking login starts oauth flow', async () => {
  await page.click('.right a');
  const url = await page.url();
  expect(url).toMatch(/accounts.google.com/);
});

it('When signed in, shows logout button', async () => {
  await page.login();
  // 因為上面刷新頁面按鈕不會馬上出現, 需要透過 waitFor ,等待該元素出現後才接續執行後續邏輯
  await page.waitFor('a[href="/auth/logout"]');
  const text = await page.getContentsOf('a[href="/auth/logout"]');

  expect(text).toEqual('Logout');
});
