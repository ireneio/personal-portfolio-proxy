#!/bin/bash

# $1 = Dockerfile location

docker build --file $1 -t personal-portfolio-proxy-local .
docker run -it -p 3000:3000 personal-portfolio-proxy-local
