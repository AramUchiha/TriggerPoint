# syntax=docker/dockerfile:1
#
# ELMFIRE (Eulerian Level set Model of FIRE spread) image. TODO STUB: not built or tested.
# Source: https://github.com/lautenberger/elmfire   Docs: https://elmfire.io
#
# Intended use: `tp run-elmfire` mounts data-pipeline/work/ and runs ELMFIRE per
# ignition x wind case, producing time-of-arrival rasters.
#
# Plan (verify each step against the upstream install docs before implementing):
#   1. Base image: ubuntu:22.04, linux/amd64.
#   2. apt-get install gfortran, openmpi-bin, libopenmpi-dev, gdal-bin, python3, and the
#      shell tools the ELMFIRE helper scripts use (bc, jq, pigz, unzip, wget, zip, csvkit).
#   3. git clone at a PINNED release/commit (record it in the manifest's method.version);
#      set ELMFIRE_BASE_DIR and ELMFIRE_INSTALL_DIR.
#   4. Build with the GNU toolchain script under build/linux (make_gnu.sh) and put the
#      binaries on PATH.
#   5. Inputs (LANDFIRE fuels/canopy, terrain, WindNinja winds) come from the mounted work/
#      directory, prepared by the pipeline; no network access at run time.
#   6. Run as a non-root user; set OMP/MPI thread counts from env for laptop vs. server.

FROM ubuntu:22.04

RUN echo "TODO: docker/elmfire/Dockerfile is a stub; see the plan in its header." >&2 && exit 1
