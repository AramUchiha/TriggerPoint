# syntax=docker/dockerfile:1
#
# WindNinja (USFS Missoula Fire Sciences Lab) CLI image. TODO STUB: not built or tested.
# Source: https://github.com/firelab/windninja
#
# Intended use: `tp run-windninja` mounts data-pipeline/work/ and runs WindNinja_cli per
# direction x speed case (and HRRR-initialized runs for `tp hindcast-latuna`).
#
# Plan (verify each step against the upstream build docs before implementing):
#   1. Base image: ubuntu:22.04 (upstream ships Ubuntu dependency scripts), linux/amd64.
#   2. apt-get install build tools and libraries: build-essential cmake git, libgdal-dev,
#      libnetcdf-dev, libboost-program-options/date-time/test-dev, libcurl4-openssl-dev.
#   3. git clone at a PINNED release tag (record it in the manifest's method.version).
#   4. cmake -DNINJA_CLI=ON -DNINJA_QTGUI=OFF -DNINJAFOAM=OFF (mass-conserving solver only,
#      no GUI; the momentum solver needs OpenFOAM and is out of scope for now), make install.
#   5. Multi-stage: copy WindNinja_cli + runtime libs into a slim ubuntu:22.04 stage.
#   6. HRRR initialization downloads forecast files at run time; for offline/reproducible
#      runs, pre-fetch them into work/ and point WindNinja at the local files.
#   7. ENTRYPOINT ["WindNinja_cli"]; run as a non-root user.

FROM ubuntu:22.04

RUN echo "TODO: docker/windninja/Dockerfile is a stub; see the plan in its header." >&2 && exit 1
