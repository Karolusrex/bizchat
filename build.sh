#!/usr/bin/env bash

# Don't run if other instances are already running
lockrun -L=build.lock -q -- npm run build