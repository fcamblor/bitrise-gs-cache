
export type AuthOptions = {
    keyConfig: string;
};

export async function auth(opts: AuthOptions) {
    const tmpLocalFile = `/tmp/google-service-account.json`;
    await $`curl -sSL ${opts.keyConfig} > ${tmpLocalFile}`
    await $`gcloud auth activate-service-account -q --key-file ${tmpLocalFile}`
    await $`rm -f ${tmpLocalFile}`
}
