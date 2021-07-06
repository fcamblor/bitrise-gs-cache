var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let CONFIG = {
    bucketUrl: "bucket-to-be-defined",
    branch: "branch-to-be-defined"
};
export function currentArgs(process) {
    return process.argv.slice(process.argv.findIndex(arg => arg.endsWith("zx")) + 2);
}
export function config(process) {
    const args = currentArgs(process);
    CONFIG = {
        bucketUrl: stripSlash(args[0]),
        branch: args[1]
    };
}
class CachePersistor {
    static jsonMetadataUrlFor(bucketUrl, branch, cacheName) {
        return `${bucketUrl}/metadata/${branch}/${cacheName}.json`;
    }
    static compressed(compressed) {
        return compressed ? new CompressedCachePersistor() : new CachePersistor();
    }
    loadCache(bucketUrl, branch, cacheName, cachedPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil -m rsync -r ./${cachedPath} ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}`;
        });
    }
    deleteCache(bucketUrl, branch, cacheName) {
        return __awaiter(this, void 0, void 0, function* () {
            return $ `gsutil rm -f -R ${bucketUrl}/content/${branch}/${cacheName} 2> /dev/null`;
        });
    }
    pushCache(bucketUrl, branch, cacheName, cachedPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil -m rsync -r ${cachedPath} ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}`;
        });
    }
}
class CompressedCachePersistor extends CachePersistor {
    loadCache(bucketUrl, branch, cacheName, cachedPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil cp ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}.tar.gz /tmp/${cachedPath}.tar.gz`;
            console.log(`Extracting compressed cache...`);
            yield $ `tar -xzf /tmp/${cachedPath}.tar.gz --directory ./`;
        });
    }
    deleteCache(bucketUrl, branch, cacheName) {
        return __awaiter(this, void 0, void 0, function* () {
            return $ `gsutil rm -f -R ${bucketUrl}/content/${branch}/${cacheName}.tar.gz 2> /dev/null`;
        });
    }
    pushCache(bucketUrl, branch, cacheName, cachedPath) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Compressing path ${cachedPath} prior to sending it into the cache...`);
            yield $ `tar -czf /tmp/${cachedPath}.tar.gz ${cachedPath}`;
            yield $ `gsutil cp /tmp/${cachedPath}.tar.gz ${bucketUrl}/content/${branch}/${cacheName}/${cachedPath}.tar.gz`;
            yield $ `rm -rf /tmp/${cachedPath}.tar.gz`;
        });
    }
}
export function cacheableCommand(opts, commandIfOutdatedCache) {
    return __awaiter(this, void 0, void 0, function* () {
        let cacheMetadata = { checksum: undefined, compressed: !!opts.compressContent }, expectedChecksum = undefined;
        try {
            const metadataContent = yield $ `gsutil cat ${CachePersistor.jsonMetadataUrlFor(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName)} 2> /dev/null`;
            cacheMetadata = JSON.parse(metadataContent.stdout.trim());
        }
        catch (e) { }
        if (opts.checksumCommand) {
            try {
                const expectedChecksumContent = yield opts.checksumCommand();
                expectedChecksum = expectedChecksumContent.stdout.trim();
            }
            catch (e) {
                throw new Error(`No expected checksum were calculated: ${e.toString()}`);
            }
        }
        console.log(`Status: ${JSON.stringify({ cacheMetadata, expectedChecksum })}`);
        const cachePersistor = CachePersistor.compressed(cacheMetadata.compressed);
        if (cacheMetadata.checksum && expectedChecksum && cacheMetadata.checksum === expectedChecksum) {
            console.info("Checksum didn't changed ! Loading cache content...");
            yield Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.loadCache(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName, cachedPath)));
        }
        else {
            console.info("Detected checksum change, updating cache...");
            try {
                yield Promise.all([
                    cachePersistor.deleteCache(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName),
                    $ `gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName)} 2> /dev/null`
                ]);
            }
            catch (e) { }
            yield commandIfOutdatedCache();
            yield Promise.all(opts.cachedPaths.map(cachedPath => cachePersistor.pushCache(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName, cachedPath)));
            cacheMetadata = {
                checksum: expectedChecksum,
                compressed: !!opts.compressContent
            };
            yield $ `echo ${JSON.stringify(cacheMetadata)} > /tmp/metadata`;
            yield $ `gsutil cp /tmp/metadata ${CachePersistor.jsonMetadataUrlFor(CONFIG.bucketUrl, CONFIG.branch, opts.cacheName)}`;
            yield $ `rm -f /tmp/metadata`;
        }
    });
}
export function stripSlash(str) {
    return str[str.length - 1] === '/' ? str.substr(0, str.length - 1) : str;
}
