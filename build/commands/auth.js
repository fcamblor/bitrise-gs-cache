var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function auth(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        let keyConfigFile;
        switch (opts.type) {
            case 'url':
                keyConfigFile = `/tmp/google-service-account.json`;
                yield $ `curl -sSL ${opts.keyConfig} > ${keyConfigFile}`;
                break;
            case 'file':
                keyConfigFile = opts.keyConfig;
                break;
        }
        yield $ `gcloud auth activate-service-account -q --key-file ${keyConfigFile}`;
        if (opts.type === 'url') {
            yield $ `rm -f ${keyConfigFile}`;
        }
    });
}
