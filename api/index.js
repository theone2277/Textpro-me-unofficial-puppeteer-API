const express = require('express');
require('puppeteer-core'); 
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const chromium = require('@sparticuz/chromium');

require('puppeteer-extra-plugin-stealth/evasions/chrome.app');

puppeteerExtra.use(StealthPlugin());

const app = express();
const port = process.env.PORT || 3000;

async function generateTextProImage(effectUrl, textToRender) {
    let browser = null;
    const maxWaitTime = 45000;

    try {
        browser = await puppeteerExtra.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(maxWaitTime);

        await page.goto(effectUrl, { waitUntil: 'networkidle2' });
        await page.type('#text-0', textToRender);
        await page.click('#submit');

        const resultSelector = '#result-image';
        await page.waitForSelector(resultSelector, { visible: true, timeout: maxWaitTime });

        const imageUrl = await page.$eval(`${resultSelector} img`, el => el.src);

        if (!imageUrl) {
            throw new Error('Could not extract the final image source URL.');
        }

        return imageUrl;
    } catch (error) {
        let errorMessage = 'An unknown error occurred during image generation.';
        if (error instanceof Error) {
            if (error.name === 'TimeoutError') {
                errorMessage = `Operation timed out. The result did not appear within ${maxWaitTime / 1000} seconds.`;
            } else {
                errorMessage = error.message;
            }
        }
        console.error(errorMessage);
        throw new Error(errorMessage);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}

app.get('/textpro', async (req, res) => {
    const { text, effect } = req.query;

    if (!text) {
        return res.status(400).json({ error: 'Missing "text" query parameter.' });
    }

    const effectUrl = effect || 'https://textpro.me/create-a-cool-liquid-text-effect-online-941.html';

    try {
        const imageUrl = await generateTextProImage(effectUrl, text);
        res.json({ image_url: imageUrl });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the TextPro API! Use /textpro?text=YourText[&effect=URL]');
});

app.listen(port, () => {
    console.log(`✅ Server running at http:
});

module.exports = app;
