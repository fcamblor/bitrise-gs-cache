#!/usr/bin/env zx

export function currentArgs() {
    return process.argv.slice(process.argv.findIndex(arg => arg.endsWith("zx"))+2);
}

void async function(serviceAccountConfigFile) {
    await $`gcloud auth activate-service-account -q --key-file ${serviceAccountConfigFile}`
    await $`rm -f ${serviceAccountConfigFile}`
}(currentArgs()[0])
