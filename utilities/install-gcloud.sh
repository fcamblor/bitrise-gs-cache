#!/bin/sh

# Installing gcloud utilities
# see https://discuss.bitrise.io/t/add-google-cloud-cli-gcloud-gsutil-to-mac-stacks/8581/9
BIN_DIR=$1
GCLOUD_VERSION=${2:-347.0.0}
GCLOUD_INSTALL_DIR=${3:-$HOME/tools/gcloud}

mkdir -p $GCLOUD_INSTALL_DIR && cd $GCLOUD_INSTALL_DIR
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    wget -q https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-$GCLOUD_VERSION-linux-x86_64.tar.gz
    tar -xzf google-cloud-sdk-$GCLOUD_VERSION-linux-x86_64.tar.gz
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac OSX
    wget -q https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-sdk-$GCLOUD_VERSION-darwin-x86_64.tar.gz
    tar -xzf google-cloud-sdk-$GCLOUD_VERSION-darwin-x86_64.tar.gz
else
    echo "Unsupported OS: $OSTYPE"
    exit -1
fi
rm *.tar.gz

if [ "$BIN_DIR" != "" ]
then
  ln -s "$GCLOUD_INSTALL_DIR/google-cloud-sdk/bin/gcloud" "$BIN_DIR/gcloud"
  ln -s "$GCLOUD_INSTALL_DIR/google-cloud-sdk/bin/gsutil" "$BIN_DIR/gsutil"
fi
