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
import { auth } from "./commands/auth.js";
import { storeFS } from "./commands/store-fs.js";
import { loadFS } from "./commands/load-fs.js";
import { cachedFS } from "./commands/cached-fs.js";
const cacheCoordsOptions = {
    'bucket-url': {
        type: 'string',
        demandOption: true,
        describe: 'bucket url (gs://<name>)'
    },
    'branch': {
        type: 'string',
        describe: 'cache branch name'
    },
    'app': {
        type: 'string',
        describe: 'your app identifier'
    },
    'cache-name': {
        type: 'string',
        demandOption: true,
        describe: 'cache name'
    }
};
function coordsFromOpts(argv) {
    return {
        bucketUrl: argv["bucket-url"],
        app: argv["app"],
        branch: (argv["branch"] || 'unknown-branch'),
        cacheName: argv["cache-name"]
    };
}
function namedDirectoriesFrom(nameableDirs) {
    return nameableDirs.map(nameableDir => {
        const [chunk1, chunk2] = nameableDir.split(":");
        return { name: chunk1, path: chunk2 || chunk1 };
    });
}
yargs(hideBin(process.argv))
    .command(["auth"], 'authenticates against your gcs bucket', (yargs) => yargs.options({
    'key-config-url': {
        type: 'string',
        describe: 'url from where to download your google service account JSON key'
    },
    'key-config-file': {
        type: 'string',
        describe: 'local file containing your google service account JSON key'
    }
}).check((argv, options) => {
    if (!argv['key-config-url'] && !argv['key-config-file']) {
        throw new Error("Either --key-config-url or --key-config-file options need to be set");
    }
    return true;
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    yield auth({
        keyConfig: (argv["key-config-url"] || argv["key-config-file"]),
        type: argv["key-config-url"] ? 'url' : 'file'
    });
})).command("store-fs [nameableDirectories..]", 'Stores directories into filesystem cache', (yargs) => yargs.options(Object.assign(Object.assign({}, cacheCoordsOptions), { 'skip-compress': {
        type: 'boolean',
        describe: 'avoids compressing files prior to sending it in store'
    } })), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const coords = coordsFromOpts(argv);
    let compressed = !argv["skip-compress"];
    const directories = namedDirectoriesFrom((argv["nameableDirectories"] || []));
    yield storeFS({
        coords, compressed, directories
    });
})).command("load-fs [nameableDirectories..]", 'Loads directories previously stored into filesystem cache', (yargs) => yargs.options(Object.assign(Object.assign({}, cacheCoordsOptions), { 'on-inexistant-cache': {
        type: 'string',
        default: 'ignore',
        describe: `allows to either ignore or fail the command when the cache doesn't exist`,
        choices: ['ignore', 'warn', 'fail']
    } })), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const coords = coordsFromOpts(argv);
    const directories = namedDirectoriesFrom((argv["nameableDirectories"] || []));
    const onInexistantCache = argv['on-inexistant-cache'];
    yield loadFS({
        coords, directories, onInexistantCache
    });
})).command("cached-fs [nameableDirectories..]", 'Either loads cached filesystem or rebuild it from scratch based on a checksum', (yargs) => yargs.options(Object.assign(Object.assign({}, cacheCoordsOptions), { 'checksum-file': {
        type: 'string',
        demandOption: true,
        describe: 'path to file used to guess if cache can be retrieved as is or if it should be invalidated'
    }, 'cacheable-command': {
        type: 'string',
        demandOption: true,
        describe: 'command to execute to reproduce cache when it gets invalidated'
    }, 'root-dir': {
        type: 'string',
        demandOption: false,
        describe: 'root directory from where cacheable-command is executed'
    }, 'skip-compress': {
        type: 'boolean',
        describe: 'avoids compressing files prior to sending it in store'
    } })).check((argv, options) => {
    if (!argv['nameableDirectories'] || argv['nameableDirectories'].length === 0) {
        throw new Error("At least 1 directory must be provided !");
    }
    return true;
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const coords = coordsFromOpts(argv);
    const compressed = !argv["skip-compress"];
    const directories = namedDirectoriesFrom((argv["nameableDirectories"] || []));
    yield cachedFS({
        coords, compressed, directories,
        checksumFile: argv["checksum-file"],
        cacheableCommand: argv["cacheable-command"],
        rootDir: argv["root-dir"]
    });
})).help().argv;
