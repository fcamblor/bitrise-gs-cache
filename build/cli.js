#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import 'zx';
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
console.log(JSON.stringify(yargs));
yargs(hideBin(process.argv))
    .command(["auth"], 'authenticates against your gcs bucket', (yargs) => yargs.options({
    'key-config': { type: 'string', demandOption: true, describe: 'url from where to download your account service key' }
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`yay ${argv["key-config"]}`);
    yield $ `echo 'hello'`;
})).help().argv;
