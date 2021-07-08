var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class CachePersistor {
    static jsonMetadataUrlFor(coords) {
        return `${coords.bucketUrl}/${coords.app}/metadata/${coords.branch}/${coords.cacheName}.json`;
    }
    static compressed(compressed) {
        return compressed ? new CompressedCachePersistor() : new CachePersistor();
    }
    static loadCacheMetadata(coords) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const metadataContent = yield $ `gsutil cat ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`;
                return JSON.parse(metadataContent.stdout.trim());
            }
            catch (e) {
                return undefined;
            }
        });
    }
    static storeCacheMetadata(coords, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `echo ${JSON.stringify(metadata)} > /tmp/metadata`;
            yield $ `gsutil cp /tmp/metadata ${CachePersistor.jsonMetadataUrlFor(coords)}`;
            yield $ `rm -f /tmp/metadata`;
        });
    }
    loadCache(coords, path, pathName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil -m rsync -r ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName} ./${path}`;
        });
    }
    deleteCache(coords) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.all([
                    $ `gsutil rm -f -R ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName} 2> /dev/null`,
                    $ `gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
                ]);
            }
            catch (e) { }
        });
    }
    pushCache(coords, path, pathName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil -m rsync -r ${path} ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName}`;
        });
    }
}
export class CompressedCachePersistor extends CachePersistor {
    loadCache(coords, path, pathName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil cp ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName}.tar.gz /tmp/${pathName}.tar.gz`;
            console.log(`Extracting compressed cache...`);
            yield $ `tar -xzf /tmp/${pathName}.tar.gz --directory ./`;
        });
    }
    deleteCache(coords) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.all([
                    $ `gsutil rm -f -R ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}.tar.gz 2> /dev/null`,
                    $ `gsutil rm -f -R ${CachePersistor.jsonMetadataUrlFor(coords)} 2> /dev/null`
                ]);
            }
            catch (e) { }
        });
    }
    pushCache(coords, path, pathName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Compressing path ${path} (named ${pathName}) prior to sending it into the cache...`);
            yield $ `tar -czf /tmp/${pathName}.tar.gz ${path}`;
            yield $ `gsutil cp /tmp/${pathName}.tar.gz ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${pathName}.tar.gz`;
            yield $ `rm -rf /tmp/${pathName}.tar.gz`;
        });
    }
}
