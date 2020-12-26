const puppeteer = require('puppeteer');
const sessionFactory = require('./factories/sessionFactory');

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false // 表示要顯示頁面
  });
  page = await browser.newPage();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await browser.close();
});

it('The header has the correct text', async () => {
  const text = await page.$eval('a.brand-logo', el => el.innerHTML);
  expect(text).toEqual('Blogster');
});

it('Clicking login starts oauth flow', async () => {
  await page.click('.right a');
  const url = await page.url();
  expect(url).toMatch(/accounts.google.com/);
});

it('When signed in, shows logout button', async () => {
  // const id = '5f84532d9534d2861c982769';
  const { session, sig } = sessionFactory();

  await page.setCookie({ name: 'session', value: session });
  await page.setCookie({ name: 'session.sig', value: sig });
  await page.goto('localhost:3000');

  // 因為上面刷新頁面按鈕不會馬上出現, 需要透過 waitFor ,等待該元素出現後才接續執行後續邏輯
  await page.waitFor('a[href="/auth/logou"]');
  const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);

  expect(text).toEqual('Logout');
});
