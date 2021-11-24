var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CachePersistor } from "./CachePersistor.js";
export function cacheableCommand(coords, opts, commandIfOutdatedCache) {
    return __awaiter(this, void 0, void 0, function* () {
        let cacheMetadata = undefined, expectedChecksum = undefined;
        // With cached-fs, we cannot cache "everything", we systematically need some cachedPaths
        const synchronizeAll = false;
        cacheMetadata = yield CachePersistor.loadCacheMetadata(coords);
        if (!cacheMetadata) {
            cacheMetadata = { checksum: undefined, compressed: !!opts.compressContent, all: synchronizeAll };
        }
        if (opts.checksumCommand) {
            try {
                expectedChecksum = yield opts.checksumCommand();
            }
            catch (e) {
                throw new Error(`No expected checksum were calculated: ${e.toString()}`);
            }
        }
        const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);
        if (cacheMetadata.checksum && expectedChecksum && cacheMetadata.checksum === expectedChecksum) {
            console.info("Checksum didn't changed ! Loading cache content...");
            yield Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.loadCache(coords, cachedPath)));
            console.info("Cache loaded !");
        }
        else {
            console.info(`${opts.checksumCommand ? 'Detected checksum change, u' : 'U'}pdating cache...`);
            yield cachePersistor.deleteCache(coords);
            yield commandIfOutdatedCache();
            yield Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.pushCache(coords, cachedPath)));
            yield CachePersistor.storeCacheMetadata(coords, {
                checksum: expectedChecksum,
                compressed: !!opts.compressContent,
                all: synchronizeAll
            });
            console.info("Cache updated !");
        }
    });
}
