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
    loadCache(coords, namedDir) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil -m rsync -r ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name} ./${namedDir.path}`;
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
    pushCache(coords, namedDir) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil -m rsync -r ${namedDir.path} ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name}`;
        });
    }
}
export class CompressedCachePersistor extends CachePersistor {
    loadCache(coords, namedDir) {
        return __awaiter(this, void 0, void 0, function* () {
            yield $ `gsutil cp ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name}.tar.gz /tmp/${namedDir.name}.tar.gz`;
            console.log(`Extracting compressed cache...`);
            yield $ `tar -xzf /tmp/${namedDir.name}.tar.gz --directory ./`;
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
    pushCache(coords, namedDir) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Compressing path ${namedDir.path} (named ${namedDir.name}) prior to sending it into the cache...`);
            yield $ `tar -czf /tmp/${namedDir.name}.tar.gz ${namedDir.path}`;
            yield $ `gsutil cp /tmp/${namedDir.name}.tar.gz ${coords.bucketUrl}/${coords.app}/content/${coords.branch}/${coords.cacheName}/${namedDir.name}.tar.gz`;
            yield $ `rm -rf /tmp/${namedDir.name}.tar.gz`;
        });
    }
}
