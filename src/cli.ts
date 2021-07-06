#!/usr/bin/env node

import 'zx'
import {hideBin} from "yargs/helpers";
import yargs from "yargs";

console.log(JSON.stringify(yargs));
yargs(hideBin(process.argv))
    .command(["auth"], 'authenticates against your gcs bucket', (yargs) => yargs.options({
        'key-config': { type: 'string', demandOption: true, describe: 'url from where to download your account service key' }
    }),
    async (argv) => {
        console.log(`yay ${argv["key-config"]}`)
        await $`echo 'hello'`
    }).help().argv
