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
import { CachePersistor } from "./CachePersistor.js";
import { cacheableCommand } from "./cacheableCommand.js";
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
    'cache-name': {
        type: 'string',
        demandOption: true,
        describe: 'cache name'
    }
};
function coordsFromOpts(argv) {
    return {
        bucketUrl: argv["bucket-url"],
        branch: (argv["branch"] || 'unknown-branch'),
        cacheName: argv["cache-name"]
    };
}
yargs(hideBin(process.argv))
    .command(["auth"], 'authenticates against your gcs bucket', (yargs) => yargs.options({
    'key-config': {
        type: 'string',
        demandOption: true,
        describe: 'url from where to download your account service key'
    }
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const tmpLocalFile = `/tmp/google-service-account.json`;
    yield $ `curl -sSL ${argv["key-config"]} > ${tmpLocalFile}`;
    yield $ `gcloud auth activate-service-account -q --key-file ${tmpLocalFile}`;
    yield $ `rm -f ${tmpLocalFile}`;
})).command("store-fs [directories..]", 'Stores directories into filesystem cache', (yargs) => yargs.options(Object.assign(Object.assign({}, cacheCoordsOptions), { 'skip-compress': {
        type: 'boolean',
        describe: 'avoids compressing files prior to sending it in store'
    } })), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const coords = coordsFromOpts(argv);
    let compressed = !argv["skip-compress"];
    const cachePersistor = CachePersistor.compressed(compressed);
    const directories = (argv["directories"] || []);
    const synchronizeAll = !directories.length;
    const namedCachedPaths = synchronizeAll
        ? [{ pathName: "__all__", path: "." }]
        : directories.map(dir => ({ pathName: dir, path: dir }));
    yield Promise.all(namedCachedPaths.map(ncp => {
        console.log(`Storing ${ncp.pathName} into cache:${coords.cacheName}`);
        return cachePersistor.pushCache(coords, ncp.path, ncp.pathName);
    }));
    yield CachePersistor.storeCacheMetadata(coords, {
        compressed,
        // No need to provide any checksum when storing non-cacheable fs
        checksum: undefined,
        all: synchronizeAll
    });
    console.log(`Directories stored in cache !`);
})).command("load-fs [directories..]", 'Loads directories previously stored into filesystem cache', (yargs) => yargs.options(Object.assign({}, cacheCoordsOptions)), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const coords = coordsFromOpts(argv);
    const cacheMetadata = yield CachePersistor.loadCacheMetadata(coords);
    if (!cacheMetadata) {
        throw new Error(`No cache metadata found for coordinates=${JSON.stringify(coords)}`);
    }
    const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);
    const directories = (argv["directories"] || []);
    const namedCachedPaths = cacheMetadata.all
        ? [{ pathName: "__all__", path: "" }]
        : directories.map(dir => ({ pathName: dir, path: dir }));
    yield Promise.all(namedCachedPaths.map(ncp => {
        console.log(`Loading ${ncp.pathName} from cache:${coords.cacheName}`);
        return cachePersistor.loadCache(coords, ncp.path, ncp.pathName);
    }));
    console.log(`Directories loaded from cache !`);
})).command("cached-fs [directories..]", 'Either loads cached filesystem or rebuild it from scratch based on a checksum', (yargs) => yargs.options(Object.assign(Object.assign({}, cacheCoordsOptions), { 'checksum-file': {
        type: 'string',
        demandOption: true,
        describe: 'path to file used to guess if cache can be retrieved as is or if it should be invalidated'
    }, 'cacheable-command': {
        type: 'string',
        demandOption: true,
        describe: 'command to execute to reproduce cache when it gets invalidated'
    }, 'skip-compress': {
        type: 'boolean',
        describe: 'avoids compressing files prior to sending it in store'
    } })), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const coords = coordsFromOpts(argv);
    const compressed = !argv["skip-compress"];
    yield cacheableCommand(coords, {
        compressContent: compressed,
        checksumCommand: () => $ `md5 -q "${argv["checksum-file"]}"`,
        cachedPaths: argv["directories"]
    }, () => {
        const [command, ...args] = argv["cacheable-command"].split(" ");
        console.info(`Executing cacheable command: ${command} ${args}`);
        return $ `${command} ${args}`;
    });
})).help().argv;
