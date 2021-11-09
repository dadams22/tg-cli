import * as enquirer from "enquirer";
import * as AutoComplete from 'enquirer/lib/prompts/autocomplete.js';
import * as chalk from "chalk";
import { BaseConfig } from '../config/base-config';
import { WorldServiceImpl } from '../service/world.service';
import { app } from "electron";
import { logger } from './colors';
import { isUrl } from './validate';


export async function promptUrl(
  question: string,
  defaultUrl: string,
  config: BaseConfig
): Promise<string> {
  const newUrlOption = "+ New URL";
  let url: string;
  if (config.domains.size === 0) {
    url = await askForUrlTyped(question, defaultUrl);
  } else {
    let choices = Array.from(config.domains).concat([newUrlOption])
    const prompt = new AutoComplete({
      name: 'url',
      message: question,
      multiple: false,
      initial: choices.indexOf(defaultUrl),
      limit: 10,
      choices: choices
    });

    url = await prompt.run().catch(e => "");
    if (url === newUrlOption) {
      url = await askForUrlTyped(url, defaultUrl).catch(e => "");
    }

    if (!url || !isUrl(url)) {
      logger.error("Invalid URL", `${url} is not a valid URL`)
      app.quit()
    }
  }

  if (url.length > 0 && validateUrl(url)) {
    config.domains.add(url);
    config.save();
    new WorldServiceImpl(config).addWorldUrl(url).catch((e) => {
      console.log(chalk.red(`Could not share url with world: ${e}`))
    });
  }

  return url;
}

async function askForUrlTyped(question: string, defaultUrl: string): Promise<string> {
  let response = await enquirer.prompt({
    type: 'input',
    name: 'url',
    message: question,
    initial: defaultUrl ?? 'http://localhost:80',
    required: true,
    validate: validateUrl
  })
  return response['url']
}

function validateUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch (e) {
    return false;
  }
}
