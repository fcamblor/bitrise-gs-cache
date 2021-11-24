import {cacheableCommand} from "../cacheableCommand.js";
import {CacheCoordinates, NamedDirectory} from "../CachePersistor.js";


export type CachedFSOptions = {
    coords: CacheCoordinates;
    compressed: boolean;
    checksumFile: string;
    cacheableCommand: string;
    rootDir?: string;
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

            let startingDir: string|undefined = undefined;
            if(opts.rootDir) {
                startingDir = await $`pwd`.then(res => res.stdout.trim())
                cd(opts.rootDir);
            }

            const [command, ...args] = commandStr.trim().split(" ");
            console.info(`Executing cacheable command ${opts.rootDir?`(from ${opts.rootDir}) `:""}: ${command} ${args}`)
            const result = await $`${command} ${args}`

            if(startingDir) {
                cd(startingDir);
            }

            return result;
        },  Promise.resolve<any>(undefined));
    })
}
