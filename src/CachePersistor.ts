
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

    async loadCache(coords: CacheCoordinates, path: string, pathName: string) {
        await $`gsutil -m rsync -r ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName} ./${path}`
    }

    async deleteCache(coords: CacheCoordinates) {
        try {
            await Promise.all([
                $`gsutil rm -f -R ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName} 2> /dev/null`,
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            ])
        }catch(e){}
    }

    async pushCache(coords: CacheCoordinates, path: string, pathName: string) {
        await $`gsutil -m rsync -r ${path} ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName}`
    }
}
export class CompressedCachePersistor extends CachePersistor {
    async loadCache(coords: CacheCoordinates, path: string, pathName: string) {
        await $`gsutil cp ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName}.tar.gz /tmp/${pathName}.tar.gz`
        console.log(`Extracting compressed cache...`)
        await $`tar -xzf /tmp/${pathName}.tar.gz --directory ./`
    }

    async deleteCache(coords: CacheCoordinates) {
        try {
            await Promise.all([
                $`gsutil rm -f -R ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}.tar.gz 2> /dev/null`,
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
            ])
        }catch(e){}
    }

    async pushCache(coords: CacheCoordinates, path: string, pathName: string) {
        console.log(`Compressing path ${path} (named ${pathName}) prior to sending it into the cache...`)
        await $`tar -czf /tmp/${pathName}.tar.gz ${path}`
        await $`gsutil cp /tmp/${pathName}.tar.gz ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName}.tar.gz`
        await $`rm -rf /tmp/${pathName}.tar.gz`
    }
}
