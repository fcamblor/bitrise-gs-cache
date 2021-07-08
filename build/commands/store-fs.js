var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CachePersistor } from "../CachePersistor.js";
export function storeFS(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const cachePersistor = CachePersistor.compressed(opts.compressed);
        const synchronizeAll = !opts.directories.length;
        const namedCachedPaths = synchronizeAll
            ? [{ name: "__all__", path: "." }]
            : opts.directories;
        yield Promise.all(namedCachedPaths.map(ncp => {
            console.log(`Storing ${ncp.name} into cache:${opts.coords.cacheName}`);
            return cachePersistor.pushCache(opts.coords, ncp);
        }));
        yield CachePersistor.storeCacheMetadata(opts.coords, {
            compressed: opts.compressed,
            // No need to provide any checksum when storing non-cacheable fs
            checksum: undefined,
            all: synchronizeAll
        });
        console.log(`Directories stored in cache !`);
    });
}
