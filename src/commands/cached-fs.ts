import {cacheableCommand} from "../cacheableCommand.js";
import {CacheCoordinates, NamedDirectory} from "../CachePersistor.js";


export type CachedFSOptions = {
    coords: CacheCoordinates;
    compressed: boolean;
    checksumFile: string;
    cacheableCommand: string;
    directories: NamedDirectory[];
};

export async function cachedFS(opts: CachedFSOptions) {
    await cacheableCommand(opts.coords, {
        compressContent: opts.compressed,
        checksumCommand: () => $`md5sum ${opts.checksumFile} | cut -d ' ' -f1`,
        cachedPaths: opts.directories
    }, () => {
        return opts.cacheableCommand.split("&&").reduce(async (previousPromise, commandStr) => {
            await previousPromise;

            const [command, ...args] = commandStr.trim().split(" ");
            console.info(`Executing cacheable command: ${command} ${args}`)
            return $`${command} ${args}`
        },  Promise.resolve<any>(undefined));
    })
}
