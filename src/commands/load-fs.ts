import {CacheCoordinates, CachePersistor, NamedDirectory} from "../CachePersistor.js";

export type LoadFSOptions = {
    coords: CacheCoordinates;
    directories: NamedDirectory[];
    onInexistantCache: 'fail'|'warn'|'ignore';
};

export async function loadFS(opts: LoadFSOptions) {
    let cacheMetadata = await CachePersistor.loadCacheMetadata(opts.coords);

    if(!cacheMetadata) {
        const message = `No cache metadata found for coordinates=${JSON.stringify(opts.coords)}`;
        switch(opts.onInexistantCache) {
            case 'fail': throw new Error(message);
            case 'warn': console.log(message);
            // default ('ignore'): do nothing
        }
        return;
    }

    const cachePersistor = CachePersistor.compressed(cacheMetadata!.compressed);

    const namedCachedPaths = cacheMetadata!.all
        ?[{name: "__all__", path: ""}]
        :opts.directories;


    await Promise.all(namedCachedPaths.map(ncp => {
        console.log(`Loading ${ncp.name} from cache:${opts.coords.cacheName}`)
        return cachePersistor.loadCache(opts.coords, ncp);
    }));

    console.log(`Directories loaded from cache !`)
}
