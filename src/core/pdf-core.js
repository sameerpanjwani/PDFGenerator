/* eslint-disable */

const puppeteer = require('puppeteer');
const _ = require('lodash');
const config = require('../config');
const logger = require('../util/logger')(__filename);
const request = require('request')
let imgData = "";



async function render(_opts = {}) {
        const opts = _.merge({
        cookies: [],
        scrollPage: false,
        emulateScreenMedia: true,
        ignoreHttpsErrors: false,
        html: null,
        waitFor: 15000,
        logo_url: 'https://www.mondovo.com/app/templates/metronic/frontend_new/assets/frontend/layout/img/logos/logo.png',
        width: 1024,
        height: 500,
        deviceScaleFactor: 1,

        }, _opts);

    if (_.get(_opts, 'pdf.width') && _.get(_opts, 'pdf.height')) {
        opts.pdf.format = undefined;
    }


    const browser = await puppeteer.launch(
        {
            headless: true,
            timeout: 3000,
            args: [
                '--start-fullscreen',
                '--ash-host-window-bounds: 1920,1080',
                '--window-size: 1920,1080',
                '--app-shell-host-window-size: "1920,1080"',
                '--content-shell-host-window-size: "1920,1080"',

            ]
        }
    );
    const page = await browser.newPage();



    let data;
    try {

        console.log('Set browser viewport.. 1920');
        console.log(opts);

        var buf = Buffer.from(opts.url, 'base64');
        console.log('URL decoded');


        request.get({url : opts.logo_url, encoding: null}, (err, res, body) => {
            if (!err) {
                const type = res.headers["content-type"];
                const prefix = "data:" + type + ";base64,";
                const base64 = body.toString('base64');
                imgData = prefix + base64;
            }
        });

        await page.goto(buf.toString());
        await page.setViewport(
                {
                        width: opts.width,
                        height: opts.height,
                        isLandscape: opts.isLandscape,
                        deviceScaleFactor: 60
                }
        );
        await page.waitFor(opts.waitFor);
        data = await page.pdf({
            format: opts.pageType,
            width: opts.width,
            height: opts.height,
            scale: opts.scale == '' ? 1: parseInt(opts.scale,10),
            landscape: true,
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div style="padding-left:20px; border-bottom: 1px solid #ccc; width: 100%; padding-bottom: 10px; margin-top: -3px;"> <img style="height: 34px;" alt="logo"  src="'+ imgData+'"></div>',
            footerTemplate: '<div style="padding:10px;font-size: 14px;width: 100%;border-top: 1px solid #ccc;">Showing <span class="pageNumber"></span> of <span class="totalPages"></span> pages</div>',
            margin: {
                top: "90px",
                bottom: "110px"
            },

        });

    } catch (err) {
        logger.error(`Error when rendering page: ${err}`);
        logger.error(err.stack);
        throw err;
    } finally {
        logger.info('Closing browser..');
        if (!config.DEBUG_MODE) {
            await browser.close();
        }
    }

    return data;
}

async function scrollPage(page) {
    // Scroll to page end to trigger lazy loading elements
    await page.evaluate(() => {
        const scrollInterval = 100;
        const scrollStep = Math.floor(window.innerHeight / 2);
        const bottomThreshold = 400;

        function bottomPos() {
            return window.pageYOffset + window.innerHeight;
        }

        return new Promise((resolve, reject) => {
            function scrollDown() {
                window.scrollBy(0, scrollStep);

                if (document.body.scrollHeight - bottomPos() < bottomThreshold) {
                    window.scrollTo(0, 0);
                    setTimeout(resolve, 500);
                    return;
                }

                setTimeout(scrollDown, scrollInterval);
            }

            setTimeout(reject, 30000);
            scrollDown();
        });
    });
}

function logOpts(opts) {
    const supressedOpts = _.cloneDeep(opts);
    if (opts.html) {
        supressedOpts.html = '...';
    }

    logger.info(`Rendering with opts: ${JSON.stringify(supressedOpts, null, 2)}`);
}

module.exports = {
    render,
};
