FROM alpine:3.18

RUN apk add --no-cache tzdata unzip wget

# Install logcli
RUN wget -qO logcli.zip https://github.com/grafana/loki/releases/download/v2.9.2/logcli-linux-amd64.zip && \
    unzip logcli.zip && \
    mv logcli-linux-amd64 /usr/local/bin/logcli && \
    chmod +x /usr/local/bin/logcli && \
    rm logcli.zip

ENV TZ=Asia/Ho_Chi_Minh

COPY export.sh /export.sh
RUN chmod +x /export.sh

# Run the export script every day at 23:59
RUN echo "59 23 * * * /export.sh" > /etc/crontabs/root

CMD ["crond", "-f", "-d", "8"]
