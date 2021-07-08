#!/bin/sh

# Installing gcloud utilities
# see https://discuss.bitrise.io/t/add-google-cloud-cli-gcloud-gsutil-to-mac-stacks/8581/9
BIN_DIR=$1
GCLOUD_INSTALL_DIR=${2:-$HOME/tools/gcloud}

mkdir -p $GCLOUD_INSTALL_DIR && cd $GCLOUD_INSTALL_DIR
wget -q https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-347.0.0-darwin-x86_64.tar.gz
tar -xzf google-cloud-sdk-347.0.0-darwin-x86_64.tar.gz
rm *.tar.gz

if [ "$BIN_DIR" != "" ]
then
  ln -s "$GCLOUD_INSTALL_DIR/google-cloud-sdk/bin/gcloud" "$BIN_DIR/gcloud"
  ln -s "$GCLOUD_INSTALL_DIR/google-cloud-sdk/bin/gsutil" "$BIN_DIR/gsutil"
fi
