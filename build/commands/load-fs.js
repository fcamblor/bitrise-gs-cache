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
export function loadFS(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        let cacheMetadata = yield CachePersistor.loadCacheMetadata(opts.coords);
        if (!cacheMetadata) {
            const message = `No cache metadata found for coordinates=${JSON.stringify(opts.coords)}`;
            switch (opts.onInexistantCache) {
                case 'fail': throw new Error(message);
                case 'warn': console.log(message);
                // default ('ignore'): do nothing
            }
            return;
        }
        const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);
        const namedCachedPaths = cacheMetadata.all
            ? [{ name: "__all__", path: "" }]
            : opts.directories;
        yield Promise.all(namedCachedPaths.map(ncp => {
            console.log(`Loading ${ncp.name} from cache:${opts.coords.cacheName}`);
            return cachePersistor.loadCache(opts.coords, ncp);
        }));
        console.log(`Directories loaded from cache !`);
    });
}
