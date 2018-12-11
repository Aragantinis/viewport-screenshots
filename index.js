const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const url = require('url');
const filenamify = require('filenamify');
const args = require('minimist')(process.argv.slice(2));

(async () => {
  const resolutions = await JSON.parse(fs.readFileSync('devices.json', 'utf8'));

  let pages = args._;

  let resultsFolder = path.join(__dirname, 'results');
  let folderExist = await fs.existsSync(resultsFolder);
  if (!folderExist) {
    await fs.mkdirSync(resultsFolder);
  }

  const browser = await puppeteer.launch();

  for (let index = 0; index < pages.length; index++) {
    const page = await browser.newPage();
    // let newUrl = await url.resolve();,
    let newUrl = await new url.URL(pages[index]);
    console.log(newUrl.href);
    await page.goto(newUrl.href, {
      waitUntil: 'networkidle2'
    });
    let pageHeight = await page.evaluate(() => {
      return document.body.clientHeight;
    });
    for (
      let resolutionKey = 0;
      resolutionKey < resolutions.length;
      resolutionKey++
    ) {
      let device = resolutions[resolutionKey];
      await page.setViewport({ width: device.width, height: device.height });
      let folder = path.join(resultsFolder, newUrl.host);
      let subFolder = path.join(folder, filenamify(newUrl.pathname));
      folderExist = await fs.existsSync(folder);
      if (!folderExist) {
        await fs.mkdirSync(folder);
        folderExist = await fs.existsSync(subFolder);
        if (!folderExist) {
          await fs.mkdirSync(subFolder);
        }
      }
      let fileName = `${device.width}x${device.height}.png`;
      let filePath = path.join(subFolder, fileName);
      console.log(fileName);
      await page.screenshot({
        path: filePath,
        fullPage: true
      });
    }
  }
  await browser.close();
})();
