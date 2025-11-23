# Stage 1: build arkd and ark CLI
FROM golang:1.23.1 AS builder

ARG TARGETOS
ARG TARGETARCH
ARG VERSION=dev
ARG BRANCH=next-version

WORKDIR /app

RUN git clone https://github.com/arkade-os/arkd.git && cd arkd && git checkout ${BRANCH}

RUN mkdir -p bin && cd arkd && \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -ldflags="-X 'main.Version=${VERSION}'" -o /app/bin/arkd ./cmd/arkd

RUN cd arkd/pkg/ark-cli && \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -ldflags="-X 'main.Version=${VERSION}'" -o /app/bin/ark main.go

# Stage 2: runtime image
FROM alpine:3.20

RUN apk update && apk upgrade

WORKDIR /app

COPY --from=builder /app/bin/* /app/

ENV PATH="/app:${PATH}"
ENV ARK_DATADIR=/app/data
ENV ARK_WALLET_DATADIR=/app/wallet-data

VOLUME /app/data
VOLUME /app/wallet-data

ENTRYPOINT ["arkd"]
