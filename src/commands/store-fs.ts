import {CacheCoordinates, CachePersistor} from "../CachePersistor.js";

export type StoreFSOptions = {
    coords: CacheCoordinates;
    compressed: boolean;
    directories: string[];
};

export async function storeFS(opts: StoreFSOptions) {
    const cachePersistor = CachePersistor.compressed(opts.compressed);

    const synchronizeAll = !opts.directories.length;
    const namedCachedPaths: {pathName: string, path: string}[] = synchronizeAll
        ?[{pathName: "__all__", path: "."}]
        :opts.directories.map(dir => ({pathName: dir, path: dir}));

    await Promise.all(namedCachedPaths.map(ncp => {
        console.log(`Storing ${ncp.pathName} into cache:${opts.coords.cacheName}`)
        return cachePersistor.pushCache(opts.coords, ncp.path, ncp.pathName);
    }));

    await CachePersistor.storeCacheMetadata(opts.coords, {
        compressed: opts.compressed,
        // No need to provide any checksum when storing non-cacheable fs
        checksum: undefined,
        all: synchronizeAll
    });

    console.log(`Directories stored in cache !`)
}
