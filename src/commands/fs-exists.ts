import {CacheCoordinates, CachePersistor} from "../CachePersistor.js";


export type FSExistsOptions = {
    coords: CacheCoordinates;
};

export async function fsExists(opts: FSExistsOptions) {
    const cacheMetadata = await CachePersistor.loadCacheMetadata(opts.coords);
    return !!cacheMetadata;
}
