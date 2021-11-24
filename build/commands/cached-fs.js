var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { cacheableCommand } from "../cacheableCommand.js";
function checksumCommandFor(opts) {
    if (opts.checksumFile) {
        return () => __awaiter(this, void 0, void 0, function* () { return (yield $ `md5sum ${opts.checksumFile} | cut -d ' ' -f1`).stdout.trim(); });
    }
    else if (opts.checksumValue) {
        return () => Promise.resolve(opts.checksumValue);
    }
    else {
        throw new Error(`Invalid opts for checksumCommand creation: ${JSON.stringify(opts)}`);
    }
}
export function cachedFS(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield cacheableCommand(opts.coords, {
            compressContent: opts.compressed,
            checksumCommand: checksumCommandFor(opts),
            cachedPaths: opts.directories
        }, () => {
            return opts.cacheableCommand.split("&&").reduce((previousPromise, commandStr) => __awaiter(this, void 0, void 0, function* () {
                yield previousPromise;
                let startingDir = undefined;
                if (opts.rootDir) {
                    startingDir = yield $ `pwd`.then(res => res.stdout.trim());
                    cd(opts.rootDir);
                }
                const [command, ...args] = commandStr.trim().split(" ");
                console.info(`Executing cacheable command ${opts.rootDir ? `(from ${opts.rootDir}) ` : ""}: ${command} ${args}`);
                const result = yield $ `${command} ${args}`;
                if (startingDir) {
                    cd(startingDir);
                }
                return result;
            }), Promise.resolve(undefined));
        });
    });
}
