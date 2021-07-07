import {cacheableCommand} from "../cacheableCommand.js";
import {CacheCoordinates} from "../CachePersistor.js";


export type CachedFSOptions = {
    coords: CacheCoordinates;
    compressed: boolean;
    checksumFile: string;
    cacheableCommand: string;
    directories: string[];
};

export async function cachedFS(opts: CachedFSOptions) {
    await cacheableCommand(opts.coords, {
        compressContent: opts.compressed,
        checksumCommand: () => $`md5 -q "${opts.checksumFile}"`,
        cachedPaths: opts.directories
    }, () => {
        const [command, ...args] = opts.cacheableCommand.split(" ");
        console.info(`Executing cacheable command: ${command} ${args}`)
        return $`${command} ${args}`
    })
}
