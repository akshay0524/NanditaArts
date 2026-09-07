const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded:', page.url());

    // Scroll to editorial section
    await page.evaluate(() => {
      document.getElementById('editorialCategories')?.scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 500));

    // Click on Landscape link
    const landscapeLink = await page.$('.editorial-cat-link--script');
    if (!landscapeLink) {
      console.log('Landscape link NOT found!');
    } else {
      console.log('Found landscape link! Clicking it...');
      const href = await page.evaluate(el => el.href, landscapeLink);
      console.log('Target href:', href);

      // Check elementFromPoint
      const hit = await page.evaluate(el => {
        const rect = el.getBoundingClientRect();
        const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return {
          tag: topEl?.tagName,
          className: topEl?.className,
          id: topEl?.id,
          isSelfOrChild: el.contains(topEl) || el === topEl
        };
      }, landscapeLink);
      console.log('ElementFromPoint check:', hit);

      await Promise.all([
        page.waitForNavigation({ timeout: 5000 }).catch(e => console.log('Navigation wait timed out/failed:', e.message)),
        landscapeLink.click()
      ]);
      console.log('URL after click:', page.url());
    }

    await browser.close();
  } catch (err) {
    console.error('Test error:', err);
  }
})();
