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
export function cachedFS(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield cacheableCommand(opts.coords, {
            compressContent: opts.compressed,
            checksumCommand: () => $ `md5sum "${opts.checksumFile}" | cut -d ' ' -f1`,
            cachedPaths: opts.directories
        }, () => {
            const [command, ...args] = opts.cacheableCommand.split(" ");
            console.info(`Executing cacheable command: ${command} ${args}`);
            return $ `${command} ${args}`;
        });
    });
}
