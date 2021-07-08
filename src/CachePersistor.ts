
export type CacheCoordinates = {
    bucketUrl: string;
    app: string;
    branch: string;
    cacheName: string,
};

export type CacheMetadata = {
    checksum: string|undefined;
    compressed: boolean;
    all: boolean;
};

export type NamedDirectory = {
    name: string;
    path: string;
}

export class CachePersistor {
    static jsonMetadataUrlFor(coords: CacheCoordinates) {
        return `${coords.bucketUrl}/${coords.app}/metadata/${coords.branch}/${coords.cacheName}.json`;
    }
    static compressed(compressed: boolean) {
        return compressed?new CompressedCachePersistor():new CachePersistor();
    }
    static async loadCacheMetadata(coords: CacheCoordinates) {
        try {
            const metadataContent = await $`gsutil cat ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            return JSON.parse(metadataContent.stdout.trim()) as CacheMetadata;
        }catch(e) {
            return undefined
        }
    }
    static async storeCacheMetadata(coords: CacheCoordinates, metadata: CacheMetadata) {
        await $`echo ${JSON.stringify(metadata)} > /tmp/metadata`
        await $`gsutil cp /tmp/metadata ${CachePersistor.jsonMetadataUrlFor(coords)}`
        await $`rm -f /tmp/metadata`
    }

    async loadCache(coords: CacheCoordinates, namedDir: NamedDirectory) {
        await $`gsutil -m rsync -r ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name} ./${namedDir.path}`
    }

    async deleteCache(coords: CacheCoordinates) {
        try {
            await Promise.all([
                $`gsutil rm -f -R ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName} 2> /dev/null`,
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            ])
        }catch(e){}
    }

    async pushCache(coords: CacheCoordinates, namedDir: NamedDirectory) {
        await $`gsutil -m rsync -r ${namedDir.path} ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name}`
    }
}
export class CompressedCachePersistor extends CachePersistor {
    async loadCache(coords: CacheCoordinates, namedDir: NamedDirectory) {
        await $`gsutil cp ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name}.tar.gz /tmp/${namedDir.name}.tar.gz`
        console.log(`Extracting compressed cache...`)
        await $`tar -xzf /tmp/${namedDir.name}.tar.gz --directory ./`
    }

    async deleteCache(coords: CacheCoordinates) {
        try {
            await Promise.all([
                $`gsutil rm -f -R ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}.tar.gz 2> /dev/null`,
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            ])
        }catch(e){}
    }

    async pushCache(coords: CacheCoordinates, namedDir: NamedDirectory) {
        console.log(`Compressing path ${namedDir.path} (named ${namedDir.name}) prior to sending it into the cache...`)
        await $`tar -czf /tmp/${namedDir.name}.tar.gz ${namedDir.path}`
        await $`gsutil cp /tmp/${namedDir.name}.tar.gz ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name}.tar.gz`
        await $`rm -rf /tmp/${namedDir.name}.tar.gz`
    }
}
