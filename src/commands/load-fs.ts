import {CacheCoordinates, CachePersistor} from "../CachePersistor.js";

export type LoadFSOptions = {
    coords: CacheCoordinates;
    directories: string[];
    onInexistantCache: 'fail'|'warn'|'ignore';
};

export async function loadFS(opts: LoadFSOptions) {
    const cacheMetadata = await CachePersistor.loadCacheMetadata(opts.coords);

    if(!cacheMetadata) {
        const message = `No cache metadata found for coordinates=${JSON.stringify(opts.coords)}`;
        switch(opts.onInexistantCache) {
            case 'fail': throw new Error(message);
            case 'warn': console.log(message); return;
            // default ('ignore'): do nothing
        }
    }

    const cachePersistor = CachePersistor.compressed(cacheMetadata!.compressed);

    const namedCachedPaths: {pathName: string, path: string}[] = cacheMetadata!.all
        ?[{pathName: "__all__", path: ""}]
        :opts.directories.map(dir => ({pathName: dir, path: dir}));


    await Promise.all(namedCachedPaths.map(ncp => {
        console.log(`Loading ${ncp.pathName} from cache:${opts.coords.cacheName}`)
        return cachePersistor.loadCache(opts.coords, ncp.path, ncp.pathName);
    }));

    console.log(`Directories loaded from cache !`)
}
