import {ProcessOutput, ProcessPromise} from "zx";
import {CacheCoordinates, CacheMetadata, CachePersistor, NamedDirectory} from "./CachePersistor.js";

export type CacheableCommandOptions = {
    cachedPaths: NamedDirectory[],
    compressContent?: boolean,
    checksumCommand?: () => Promise<string>
};

export async function cacheableCommand(coords: CacheCoordinates, opts: CacheableCommandOptions, commandIfOutdatedCache: () => Promise<any>) {
    let cacheMetadata: CacheMetadata|undefined = undefined, expectedChecksum = undefined;
    // With cached-fs, we cannot cache "everything", we systematically need some cachedPaths
    const synchronizeAll = false;
    cacheMetadata = await CachePersistor.loadCacheMetadata(coords);
    if(!cacheMetadata) {
        cacheMetadata = { checksum: undefined, compressed: !!opts.compressContent, all: synchronizeAll }
    }

    if(opts.checksumCommand) {
        try {
            expectedChecksum = await opts.checksumCommand();
        }
        catch(e: any) {
            throw new Error(`No expected checksum were calculated: ${e.toString()}`);
        }
    }

    const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);
    if(cacheMetadata.checksum && expectedChecksum && cacheMetadata.checksum === expectedChecksum) {
        console.info("Checksum didn't changed ! Loading cache content...")

        await Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.loadCache(coords, cachedPath)));

        console.info("Cache loaded !");
    } else {
        console.info(`${opts.checksumCommand?'Detected checksum change, u':'U'}pdating cache...`)

        await cachePersistor.deleteCache(coords)

        await commandIfOutdatedCache();

        await Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.pushCache(coords, cachedPath)))
        await CachePersistor.storeCacheMetadata(coords, {
            checksum: expectedChecksum,
            compressed: !!opts.compressContent,
            all: synchronizeAll
        });

        console.info("Cache updated !");
    }
}
