
export type CacheCoordinates = {
    bucketUrl: string;
    branch: string;
    cacheName: string,
};

export type CacheMetadata = {
    checksum: string|undefined;
    compressed: boolean;
};

export class CachePersistor {
    static jsonMetadataUrlFor(coords: CacheCoordinates) {
        return `${coords.bucketUrl}/metadata/${coords.branch}/${coords.cacheName}.json`;
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

    async loadCache(coords: CacheCoordinates, cachedPath: string) {
        await $`gsutil -m rsync -r ./${cachedPath} ${coords.bucketUrl}/content/${coords.branch}/${coords.cacheName}/${cachedPath}`
    }

    async deleteCache(coords: CacheCoordinates) {
        try {
            await Promise.all([
                $`gsutil rm -f -R ${coords.bucketUrl}/content/${coords.branch}/${coords.cacheName} 2> /dev/null`,
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            ])
        }catch(e){}
    }

    async pushCache(coords: CacheCoordinates, cachedPath: string) {
        await $`gsutil -m rsync -r ${cachedPath} ${coords.bucketUrl}/content/${coords.branch}/${coords.cacheName}/${cachedPath}`
    }
}
export class CompressedCachePersistor extends CachePersistor {
    async loadCache(coords: CacheCoordinates, cachedPath: string) {
        await $`gsutil cp ${coords.bucketUrl}/content/${coords.branch}/${coords.cacheName}/${cachedPath}.tar.gz /tmp/${cachedPath}.tar.gz`
        console.log(`Extracting compressed cache...`)
        await $`tar -xzf /tmp/${cachedPath}.tar.gz --directory ./`
    }

    async deleteCache(coords: CacheCoordinates) {
        try {
            await Promise.all([
                $`gsutil rm -f -R ${coords.bucketUrl}/content/${coords.branch}/${coords.cacheName}.tar.gz 2> /dev/null`,
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            ])
        }catch(e){}
    }

    async pushCache(coords: CacheCoordinates, cachedPath: string) {
        console.log(`Compressing path ${cachedPath} prior to sending it into the cache...`)
        await $`tar -czf /tmp/${cachedPath}.tar.gz ${cachedPath}`
        await $`gsutil cp /tmp/${cachedPath}.tar.gz ${coords.bucketUrl}/content/${coords.branch}/${coords.cacheName}/${cachedPath}.tar.gz`
        await $`rm -rf /tmp/${cachedPath}.tar.gz`
    }
}
