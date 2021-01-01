const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('When logged in', async () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  it('Can see blog create formr', async () => {
    const label = await page.getContentsOf('form label');

    expect(label).toEqual('Blog Title');
  });

  // input 欄位輸入正確後 submit
  describe('And using valid inputs', async () => {
    beforeEach(async () => {
      await page.type('.title input', 'Test Title');
      await page.type('.content input', 'Test Content');
      await page.click('form button');
    });

    it('Submitting takes user to review screen', async () => {
      const text = await page.getContentsOf('h5');
      await page.waitFor('.container');

      expect(text).toEqual('Please confirm your entries');
    });

    it('Submitting then saving adds blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');

      const title = await page.getContentsOf('.card-title');
      const content = await page.getContentsOf('p');

      expect(title).toEqual('Test Title');
      expect(content).toEqual('Test Content');
    });
  });

  // input 未輸入直接 submit
  describe('And using invalid inputs', async () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    it('The form shows am error message', async () => {
      const titleError = await page.getContentsOf('.title .red-text');
      const contentError = await page.getContentsOf('.content .red-text');

      expect(titleError).toEqual('You must provide a value');
      expect(contentError).toEqual('You must provide a value');
    });
  });
});
