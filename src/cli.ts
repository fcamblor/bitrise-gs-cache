#!/usr/bin/env node

import 'zx'
import {hideBin} from "yargs/helpers";
import yargs, {Options} from "yargs";
import {CacheCoordinates, CachePersistor} from "./CachePersistor";
import {cacheableCommand} from "./cacheableCommand";


type CoordsKeys = "bucket-url"|"branch"|"cache-name";
const cacheCoordsOptions: Record<CoordsKeys, Options> = {
    'bucket-url': {
        type: 'string',
        demandOption: true,
        describe: 'bucket url (gs://<name>)'
    },
    'branch': {
        type: 'string',
        demandOption: true,
        describe: 'cache branch name'
    },
    'cache-name': {
        type: 'string',
        demandOption: true,
        describe: 'cache name'
    }
};

function coordsFromOpts(argv: {[key in CoordsKeys]: string|unknown}): CacheCoordinates {
    return {
        bucketUrl: argv["bucket-url"] as string,
        branch: argv["branch"] as string,
        cacheName: argv["cache-name"] as string
    };
}

yargs(hideBin(process.argv))
    .command(["auth"], 'authenticates against your gcs bucket', (yargs) =>
        yargs.options({
            'key-config': {
                type: 'string',
                demandOption: true,
                describe: 'url from where to download your account service key'
            }
        }), async (argv) => {
            const tmpLocalFile = `/tmp/google-service-account.json`;
            await $`curl -sSL ${argv["key-config"]} > ${tmpLocalFile}`
            await $`gcloud auth activate-service-account -q --key-file ${tmpLocalFile}`
            await $`rm -f ${tmpLocalFile}`
        }
    ).command("store-fs [directories..]", 'Stores directories into filesystem cache', (yargs) =>
        yargs.options({
            ...cacheCoordsOptions,
            'skip-compress': {
                type: 'boolean',
                describe: 'avoids compressing files prior to sending it in store'
            }
        }), async (argv) => {

            const coords = coordsFromOpts(argv);
            let compressed = !argv["skip-compress"];
            const cachePersistor = CachePersistor.compressed(compressed);

            await Promise.all((argv["directories"] as string[]).map(dir => {
                console.log(`Storing ${dir} into cache:${coords.cacheName}`)
                return cachePersistor.pushCache(coords, dir);
            }));
            await CachePersistor.storeCacheMetadata(coords, {
                compressed,
                // No need to provide any checksum when storing non-cacheable fs
                checksum: undefined
            });

            console.log(`Directories stored in cache !`)
        }
    ).command("load-fs [directories..]", 'Loads directories previously stored into filesystem cache', (yargs) =>
        yargs.options({
            ...cacheCoordsOptions
        }), async (argv) => {

            const coords = coordsFromOpts(argv);
            const cacheMetadata = await CachePersistor.loadCacheMetadata(coords);

            if(!cacheMetadata) {
                throw new Error(`No cache metadata found for coordinates=${JSON.stringify(coords)}`)
            }

            const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);

            await Promise.all((argv["directories"] as string[]).map(dir => {
                console.log(`Loading ${dir} from cache:${coords.cacheName}`)
                return cachePersistor.loadCache(coords, dir);
            }));

            console.log(`Directories loaded from cache !`)
        }
    ).command("cached-fs [directories..]", 'Either loads cached filesystem or rebuild it from scratch based on a checksum', (yargs) =>
        yargs.options({
            ...cacheCoordsOptions,
            'checksum-file': {
                type: 'string',
                demandOption: true,
                describe: 'path to file used to guess if cache can be retrieved as is or if it should be invalidated'
            },
            'cacheable-command': {
                type: 'string',
                demandOption: true,
                describe: 'command to execute to reproduce cache when it gets invalidated'
            },
            'skip-compress': {
                type: 'boolean',
                describe: 'avoids compressing files prior to sending it in store'
            }
        }), async (argv) => {
            const coords = coordsFromOpts(argv);
            const compressed = !argv["skip-compress"];

            await cacheableCommand(coords, {
                compressContent: compressed,
                checksumCommand: () => $`md5 "${argv["checksum-file"]}"`,
                cachedPaths: argv["directories"] as string[]
            }, () => {
                const [command, ...args] = argv["cacheable-command"].split(" ");
                console.info(`Executing cacheable command: ${command} ${args}`)
                return $`${command} ${args}`
            })
        }
    ).help().argv
