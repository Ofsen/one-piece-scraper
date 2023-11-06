const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const cron = require("cron");

const BROWSER_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function getLastChapter() {
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
  });

  // --- Getting chapter infos

  let page = await browser.newPage();
  await page.goto("https://onepiecescan.fr/");
  await page.waitForSelector("li#ceo_latest_comics_widget-2");
  let html = await page.content();
  let $ = cheerio.load(html);

  const lastChapter = $("li#ceo_latest_comics_widget-2 > ul > li:first");
  const title = lastChapter.text();
  const url = lastChapter.find("a").attr("href");
  console.log("Latest chapter:", title, " - ", url);

  // --- Checking stuff

  const chapterNumber = title.split(/[^0-9]/).filter((e) => e.length !== 0)[0];
  // Creating the chapter directory
  const directoryPath = path.join(__dirname, chapterNumber);
  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
      console.log(`Chapter directory created: ${directoryPath}`);
    } catch (error) {
      console.error(`Error creating chapter directory: ${directoryPath}`);
      console.error(error);
    }
  } else {
    console.log(`Chapter directory already exists: ${directoryPath}`);
  }

  // Checking if chapter directory is not empty
  const files = fs.readdirSync(directoryPath);
  if (files.length !== 0) {
    console.log("Chapter directory is NOT empty");
    console.log("Files and subdirectories:", files);
    console.log("Job will stop.", new Date().toLocaleDateString());
  } else {
    // --- Downloading images

    await page.goto(url);
    await page.waitForSelector("div.elementor-element-f766019");
    html = await page.content();
    $ = cheerio.load(html);

    const imgs = $("div.elementor-element-f766019 img");
    console.log("Downloading scans...");
    imgs.map((index, img) => {
      const localFilePath = path.join(__dirname, chapterNumber, `${index}.jpg`);
      fetch(img.attribs.src, {
        mode: "no-cors",
      })
        .then((response) => {
          if (!response.ok) console.error(`HTTP error! Status: ${response.status}`);

          const fileWriteStream = fs.createWriteStream(localFilePath, { flags: "wx" });
          stream.finished(
            stream.Readable.fromWeb(response.body).pipe(fileWriteStream),
            () => {
              console.log(`Scan downloaded to: ${localFilePath}`);
            }
          );
        })
        .catch((error) => {
          console.error("Error downloading the scan:", error);
        });
    });
  }

  await browser.close();
}

const job = new cron.CronJob(
  // "0 0 * * 0", // every week on sundays
  "*/4 * * * *", // every week on sundays
  function () {
    getLastChapter();
  },
  () => {
    console.log(
      "Getting the last chapter | job executed at",
      new Date().toLocaleDateString()
    );
  },
  true,
  "Europe/Paris"
);

job.start();
