export interface RabbitMqConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
  protocol?: "amqp" | "amqps";
}

export function buildRabbitMqUrl(
  config: RabbitMqConnectionConfig,
): string {
  const protocol = config.protocol ?? "amqp";
  const username = encodeURIComponent(config.username);
  const password = encodeURIComponent(config.password);
  const vhost =
    config.vhost.trim() === "" || config.vhost === "/"
      ? ""
      : `/${encodeURIComponent(config.vhost.replace(/^\//, ""))}`;

  return `${protocol}://${username}:${password}@${config.host}:${String(config.port)}${vhost}`;
}
