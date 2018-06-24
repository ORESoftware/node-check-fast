#!/usr/bin/env bash


get_latest_ncf(){
  . "$HOME/.oresoftware/bash/ncf.sh"
}

ncf(){

  if ! type -f ncf &> /dev/null || ! which ncf &> /dev/null; then

       echo "Installing NPM package '@oresoftware/ncf' globally...";

       npm i -s -g '@oresoftware/ncf' || {
         echo -e "Could not install NPM package '@oresoftware/ncf' globally." >&2
         echo -e "Please check your permissions to install global NPM packages." >&2
         return 1;
       }

  fi

  command ncf $@;
}

node_check_fast(){
  ncf $@;
}

node-check-fast(){
  ncf $@;
}


export -f ncf;
export -f node_check_fast;
export -f get_latest_ncf;
export -f node-check-fast;