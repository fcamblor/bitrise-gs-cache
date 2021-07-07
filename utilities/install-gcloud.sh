#!/bin/sh

# Installing gcloud utilities
# see https://discuss.bitrise.io/t/add-google-cloud-cli-gcloud-gsutil-to-mac-stacks/8581/9
BIN_DIR=$1
GCLOUD_INSTALL_DIR=${2:-$HOME/tools/gcloud}
export CLOUDSDK_CONFIG=${3:-$HOME/.config/}
curl -sSL https://sdk.cloud.google.com > /tmp/gcl && bash /tmp/gcl --install-dir=$GCLOUD_INSTALL_DIR --disable-prompts

if [ "$BIN_DIR" != "" ]
then
  ln -s "$GCLOUD_INSTALL_DIR/google-cloud-sdk/bin/gcloud" "$BIN_DIR/gcloud"
  ln -s "$GCLOUD_INSTALL_DIR/google-cloud-sdk/bin/gsutil" "$BIN_DIR/gsutil"
fi
