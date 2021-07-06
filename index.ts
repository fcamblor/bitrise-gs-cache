import {ProcessOutput, ProcessPromise} from "zx";

let CONFIG = {
    bucketUrl: undefined,
    branch: undefined
};

export function currentArgs(process: NodeJS.Process) {
    return process.argv.slice(process.argv.findIndex(arg => arg.endsWith("zx"))+2);
}

export function config(process: NodeJS.Process) {
    const args = currentArgs(process);
    CONFIG = {
        bucketUrl: stripSlash(args[0]),
        branch: args[1]
    };
}

export type CacheableCommandOptions = {
    cacheName: string,
    cachedPaths: string[],
    compressContent?: boolean,
    checksumCommand?: () => ProcessPromise<ProcessOutput>
};
export type CacheMetadata = {
    checksum: string|undefined;
    compressed: boolean;
};

class CachePersistor {
    static jsonMetadataUrlFor(bucketUrl: string, branch: string, cacheName: string) {
        return `${bucketUrl}/metadata/${branch}/${cacheName}.json`;
    }
    static compressed(compressed: boolean) {
        return compressed?new CompressedCachePersistor():new CachePersistor();
    }

    async loadCache(bucketUrl: string, branch: string, cacheName: string, cachedPath: string) {
        await $`gsutil -m rsync -r ./${cachedPath} ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}`
    }

    async deleteCache(bucketUrl: string, branch: string, cacheName: string) {
        return $`gsutil rm -f -R ${bucketUrl}/content/${branch}/${cacheName} 2> /dev/null`
    }

    async pushCache(bucketUrl: string, branch: string, cacheName: string, cachedPath: string) {
        await $`gsutil -m rsync -r ${cachedPath} ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}`
    }
}
class CompressedCachePersistor extends CachePersistor {
    async loadCache(bucketUrl: string, branch: string, cacheName: string, cachedPath: string) {
        await $`gsutil cp ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}.tar.gz /tmp/${cachedPath}.tar.gz`
        console.log(`Extracting compressed cache...`)
        await $`tar -xzf /tmp/${cachedPath}.tar.gz --directory ./`
    }

    async deleteCache(bucketUrl: string, branch: string, cacheName: string) {
        return $`gsutil rm -f -R ${bucketUrl}/content/${branch}/${cacheName}.tar.gz 2> /dev/null`
    }

    async pushCache(bucketUrl: string, branch: string, cacheName: string, cachedPath: string) {
        console.log(`Compressing path ${cachedPath} prior to sending it into the cache...`)
        await $`tar -czf /tmp/${cachedPath}.tar.gz ${cachedPath}`
        await $`gsutil cp /tmp/${cachedPath}.tar.gz ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}.tar.gz`
        await $`rm -rf /tmp/${cachedPath}.tar.gz`
    }
}

export async function cacheableCommand(opts: CacheableCommandOptions, commandIfOutdatedCache: () => ProcessPromise<ProcessOutput>) {
    let cacheMetadata: CacheMetadata = { checksum: undefined, compressed: opts.compressContent }, expectedChecksum = undefined;
    try {
        const metadataContent = await $`gsutil cat ${CachePersistor.jsonMetadataUrlFor(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName)} 2> /dev/null`
        cacheMetadata = JSON.parse(metadataContent.stdout.trim());
    } catch(e) {}

    if(opts.checksumCommand) {
        try {
            const expectedChecksumContent = await opts.checksumCommand();
            expectedChecksum = expectedChecksumContent.stdout.trim();
        }
        catch(e) {
            throw new Error(`No expected checksum were calculated: ${e.toString()}`);
        }
    }

    console.log(`Status: ${JSON.stringify({cacheMetadata, expectedChecksum})}`)

    const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);
    if(cacheMetadata.checksum && expectedChecksum && cacheMetadata.checksum === expectedChecksum) {
        console.info("Checksum didn't changed ! Loading cache content...")
        await Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.loadCache(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName, cachedPath)));
    } else {
        console.info("Detected checksum change, updating cache...")
        try {
            await Promise.all([
                cachePersistor.deleteCache(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName),
                $`gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName)} 2> /dev/null`
            ])
        }catch(e){}

        await commandIfOutdatedCache();

        await Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.pushCache(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName, cachedPath)))

        cacheMetadata = {
            checksum: expectedChecksum,
            compressed: opts.compressContent
        };

        await $`echo ${JSON.stringify(cacheMetadata)} > /tmp/metadata`
        await $`gsutil cp /tmp/metadata ${CachePersistor.jsonMetadataUrlFor(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName)}`
        await $`rm -f /tmp/metadata`
    }
}

export function stripSlash(str: string) {
    return str[str.length-1] === '/'?str.substr(0, str.length-1):str;
}
