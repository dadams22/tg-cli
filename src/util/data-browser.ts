import * as chalk from 'chalk';
import { PlayerInfo } from '../lib/player-info';
import { BaseConfig } from '../config/base-config';
import { chromium } from 'playwright-core';
import { promptUrl } from './prompts';

export async function startDataSession(
  url: string | null,
  onClose: () => void,
  seedPlayer: PlayerInfo | null,
  config: BaseConfig
) {
  let mappingUrl: string = url;
  if (!mappingUrl) {
    mappingUrl = await promptUrl(
      `Pick an environment URL you would like to seed ${seedPlayer ? `@${seedPlayer.id}` : "Testgram"} on...`,
      config.defaultMappingUrl ?? "http://localhost:80",
      config
    )
  }

  config.defaultMappingUrl = mappingUrl;
  config.save();

  console.log(chalk.green("\nOpening the browser..."));
  const browser = await chromium.launch({
    args: [
      '--window-size=1600,900',
      '--incognito',
      '--ignore-certificate-errors',
      '--no-sandbox',
      '--allow-running-insecure-content',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials' //for x-frame-options, https://bugs.chromium.org/p/chromium/issues/detail?id=857032
    ],
    devtools: config.debugMode,
    headless: false,
  });

  const context = await browser.newContext({ bypassCSP: true, colorScheme: 'dark', viewport: null });
  const page = await context.newPage();

  page.on('close', it => {
    console.log(chalk.green("Data collection session complete 👍"))
    onClose();
  });

  context.on("page", (it) => {
    it.close()
    console.log(`${chalk.dim.bold.red(`Closed Tab: `)} ${chalk.dim("\`tg map\` only allows one tab at a time")}`)
  })

  const trainer = `${config.mediatorUrl}/js/world/${config.world.id}`;
  const isPrivate = seedPlayer == null;

  await context.addInitScript(function (args) {
    localStorage.setItem("tg-user", args['tgUserId']);
    localStorage.setItem("tg-private", JSON.stringify(args['isPrivate']));
    if (args["seedPlayerAlias"]) sessionStorage.setItem("tg-seed-player", JSON.stringify(args['seedPlayerAlias']));

    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = false;
    script.src = args['trainer'];
    script.crossOrigin = "";
    let organizationDomain = trimURL(args['mappingUrl']);
    window.addEventListener('DOMContentLoaded', event => {
      let currURL = location.href;
      let contentDomain = trimURL(currURL);
      if (organizationDomain == contentDomain) {
        document.head.appendChild(script);
        console.log('Injected Trainer', script.src);
      }
    });

    function trimURL(urlString) {
      return new URL(urlString)
        .hostname
        .split(/\./)
        .slice(-2)
        .join('.');
    }
  }, { mappingUrl, trainer, tgUserId: config.token, isPrivate, seedPlayerAlias: seedPlayer?.id, });
  await page.goto(mappingUrl, { waitUntil: "domcontentloaded" }).catch();
}