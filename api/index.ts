import { Elysia, t } from 'elysia';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';
import { Browser, Protocol } from 'puppeteer-core';

puppeteer.use(StealthPlugin());

async function generateTextProImage(effectUrl: string, textToRender: string): Promise<string> {
    let browser: Browser | null = null;
    const maxWaitTime = 45000;

    try {
        browser = await puppeteer.launch({
            args: chromium.args,
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

        const imageUrl = await page.$eval(`${resultSelector} img`, el => (el as HTMLImageElement).src);

        if (!imageUrl) {
            throw new Error('Could not extract the final image source URL.');
        }

        return imageUrl;
    } catch (error) {
        console.error('An error occurred during TextPro image generation:', error);
        let errorMessage = 'An unknown error occurred during image generation.';
        if (error instanceof Error) {
            errorMessage = error.name === 'TimeoutError'
                ? `Operation timed out after ${maxWaitTime / 1000} seconds.`
                : error.message;
        }
        throw new Error(errorMessage);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}


async function getAnimePaheCookies(): Promise<Protocol.Network.Cookie[]> {
    let browser: Browser | null = null;
    const siteUrl = 'https://animepahe.ru/';
    console.log(`Starting Puppeteer for: ${siteUrl}`);

    try {
        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

        console.log('Navigating and waiting for network idle...');
        await page.goto(siteUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        console.log('Network is idle. Waiting an extra 5 seconds for JS challenges...');
        await new Promise((r) => setTimeout(r, 5000));

        console.log('Challenge should be solved. Extracting cookies...');
        const cookies = await page.cookies();

        if (cookies.length === 0) {
            throw new Error('Failed to extract any cookies. The anti-bot page may have changed.');
        }

        console.log('Successfully extracted cookies.');
        return cookies;

    } catch (error) {
        console.error('An error occurred during Puppeteer execution:', error);
        if (error instanceof Error && error.message.includes("is a peer dependency")) {
             throw new Error("Puppeteer peer dependency issue. Ensure 'puppeteer-core' is correctly installed and bundled.");
        }
        throw new Error('Failed to solve the anti-bot challenge or the site is down.');
    } finally {
        if (browser !== null) {
            console.log('Closing browser...');
            await browser.close();
        }
    }
}

const app = new Elysia()
    .get('/', () => ({
        status: 'API is running',
        endpoints: ['/anime-cookies', '/textpro']
    }))
    .get('/anime-cookies', async ({ set }) => {
        try {
            const cookiesArray = await getAnimePaheCookies();
            const cookieString = cookiesArray.map(c => `${c.name}=${c.value}`).join('; ');

            return {
                message: "Successfully retrieved session cookies from Animepahe.",
                cookies: {
                    asArray: cookiesArray,
                    asString: cookieString
                }
            };
        } catch (e: any) {
            set.status = 500;
            return { error: e.message };
        }
    })
    .get('/textpro', async ({ query, set }) => {
        const { text, effect } = query;

        if (!text) {
            set.status = 400;
            return { error: 'Missing "text" query parameter.' };
        }

        const effectUrl = effect || 'https://textpro.me/create-a-cool-liquid-text-effect-online-941.html';

        try {
            const imageUrl = await generateTextProImage(effectUrl, text);
            return { image_url: imageUrl };
        } catch (e: any) {
            set.status = 500;
            return { error: e.message || 'Internal Server Error' };
        }
    });

export default app.fetch;
