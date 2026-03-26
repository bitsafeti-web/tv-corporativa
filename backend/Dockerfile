FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /pb

# Binário Linux (ver README — não é o .exe)
COPY pocketbase /pb/pocketbase
COPY pb_migrations/ /pb/pb_migrations/
COPY pb_hooks/     /pb/pb_hooks/

RUN chmod +x /pb/pocketbase

EXPOSE 8090

# pb_data é montado como volume persistente no Fly.io
VOLUME /pb/pb_data

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
