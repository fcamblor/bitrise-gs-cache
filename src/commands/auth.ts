
export type AuthOptions = {
    keyConfig: string;
    type: 'url'|'file';
};

export async function auth(opts: AuthOptions) {
    let keyConfigFile: string;
    switch(opts.type) {
        case 'url':
            keyConfigFile = `/tmp/google-service-account.json`;
            await $`curl -sSL ${opts.keyConfig} > ${keyConfigFile}`
            break;
        case 'file':
            keyConfigFile = opts.keyConfig;
            break;
    }
    await $`gcloud auth activate-service-account -q --key-file ${keyConfigFile}`

    if(opts.type === 'url') {
        await $`rm -f ${keyConfigFile}`
    }
}
