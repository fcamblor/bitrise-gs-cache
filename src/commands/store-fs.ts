import {CacheCoordinates, CachePersistor, NamedDirectory} from "../CachePersistor.js";

export type StoreFSOptions = {
    coords: CacheCoordinates;
    compressed: boolean;
    directories: NamedDirectory[];
};

export async function storeFS(opts: StoreFSOptions) {
    const cachePersistor = CachePersistor.compressed(opts.compressed);

    const synchronizeAll = !opts.directories.length;
    const namedCachedPaths = synchronizeAll
        ?[{name: "__all__", path: "."}]
        :opts.directories;

    await Promise.all(namedCachedPaths.map(ncp => {
        console.log(`Storing ${ncp.name} into cache:${opts.coords.cacheName}`)
        return cachePersistor.pushCache(opts.coords, ncp);
    }));

    await CachePersistor.storeCacheMetadata(opts.coords, {
        compressed: opts.compressed,
        // No need to provide any checksum when storing non-cacheable fs
        checksum: undefined,
        all: synchronizeAll
    });

    console.log(`Directories stored in cache !`)
}
