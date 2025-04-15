import retry from "async-retry";
import Docker from "dockerode";
import getPort from "get-port";

import type { MySql2Database } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import {} from "vitest";

declare module "vitest" {
	interface TestContext {
		mysql: {
			db: MySql2Database<Record<string, never>>;
		};
	}
}

const Image = "mysql:8";
const DBRootPassword = "mysql";
const DBName = "drizzle";

const createDBContainer = async (): Promise<
	Disposable & {
		port: number;
		container: Docker.Container;
	}
> => {
	const docker = new Docker();
	const port = await getPort({ port: 3306 });

	const pullStream = await docker.pull(Image);
	await new Promise((resolve, reject) =>
		docker.modem.followProgress(pullStream, (err) =>
			err ? reject(err) : resolve(err),
		),
	);

	const container = await docker.createContainer({
		Image: Image,
		Env: [`MYSQL_ROOT_PASSWORD=${DBRootPassword}`, `MYSQL_DATABASE=${DBName}`],
		name: `drizzle-integration-tests-${crypto.randomUUID()}`,
		HostConfig: {
			AutoRemove: true,
			PortBindings: {
				"3306/tcp": [{ HostPort: `${port}` }],
			},
		},
	});

	await container.start();
	await new Promise((resolve) => setTimeout(resolve, 1000));

	return {
		port,
		container,
		[Symbol.dispose]: async () => {
			await container.stop().catch(console.error);
		},
	};
};

const connectDB = async (
	port: number,
): Promise<
	Disposable & {
		client: mysql.Connection;
	}
> => {
	let client: mysql.Connection;
	const connectionString = `mysql://root:${DBRootPassword}@127.0.0.1:${port}/${DBName}`;

	client = await retry(
		async () => {
			client = await mysql.createConnection({
				uri: connectionString,
				supportBigNumbers: true,
			});
			await client.connect();
			return client;
		},
		{
			retries: 20,
			factor: 1,
			minTimeout: 250,
			maxTimeout: 250,
			randomize: false,
			onRetry() {
				client?.end();
			},
		},
	);

	return {
		client,
		[Symbol.dispose]: async () => {
			await client.end();
		},
	};
};

export async function setupMySQLTestEnvironment(): Promise<{
	client: mysql.Connection;
	container: Docker.Container;
}> {
	await using db = await createDBContainer();
	await using connection = await connectDB(db.port);

	return {
		client: connection.client,
		container: db.container,
	};
}
