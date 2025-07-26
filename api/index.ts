import { Elysia, t } from 'elysia';
import 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';
import { Browser } from 'puppeteer-core';

puppeteer.use(StealthPlugin());

async function generateTextProImage(effectUrl: string, textToRender: string): Promise<string> {
    let browser: Browser | null = null;
    const maxWaitTime = 45000;

    try {
        browser = (await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true, // Use the boolean value to match older type definitions
        })) as unknown as Browser;

        const page = await browser.newPage();
        page.setDefaultTimeout(maxWaitTime);

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        await page.goto(effectUrl, { waitUntil: 'networkidle2' });
        await page.type('#text-0', textToRender);
        
        const submitButtonSelector = '#create_effect';
        await page.waitForSelector(submitButtonSelector, { visible: true, timeout: 10000 });
        await page.click(submitButtonSelector);

        const resultSelector = '#link-image';
        await page.waitForSelector(resultSelector, { visible: true, timeout: maxWaitTime });

        const rawText = await page.$eval(resultSelector, el => el.textContent);

        if (!rawText) {
            throw new Error('Could not find text in the result element.');
        }

        const urlRegex = /(https?:\/\/\S+\.jpg)/;
        const match = rawText.match(urlRegex);
        const cleanedUrl = match ? match[0] : null;

        if (!cleanedUrl) {
            throw new Error('Could not extract a valid .jpg URL from the result text.');
        }
        
        return cleanedUrl;

    } catch (error) {
        console.error('An error occurred during TextPro image generation:', error);
        
        if (error instanceof Error && error.message.includes("is a peer dependency")) {
             throw new Error("Puppeteer peer dependency issue. Ensure 'puppeteer-core' is correctly installed and bundled.");
        }

        let errorMessage = 'An unknown error occurred during image generation.';
        if (error instanceof Error) {
            errorMessage = error.name === 'TimeoutError'
                ? `Operation timed out after ${maxWaitTime / 1000} seconds.`
                : error.message;
        }
        throw new Error(errorMessage);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

const app = new Elysia()
    .get('/', () => ({
        status: 'API is running',
        endpoints: '/textpro'
    }))
    .get('/textpro', async ({ body, set }) => {
        const { text, effect } = body;

        if (!text) {
            set.status = 400;
            return { error: 'Missing "text" in body.' };
        }

        const effectUrl = effect || 'https://textpro.me/neon-light-text-effect-online-882.html';

        try {
            const imageUrl = await generateTextProImage(effectUrl, text);
            return { image_url: imageUrl };
        } catch (e: any) {
            set.status = 500;
            return { error: e.message || 'Internal Server Error' };
        }
    }, {
        body: t.Object({
            text: t.String(),
            effect: t.Optional(t.String())
        })
    });

export default app.fetch;
