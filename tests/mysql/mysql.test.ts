import {
	bigint,
	getTableConfig,
	int,
	mediumint,
	mysqlTable,
	smallint,
	tinyint,
} from "drizzle-orm/mysql-core";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { setupMySQLTestEnvironment } from "./setup";

const ENABLE_LOGGING = false;

let db: MySql2Database;

beforeAll(async () => {
	const { client } = await setupMySQLTestEnvironment();
	db = drizzle(client, { logger: ENABLE_LOGGING });
});

beforeEach((ctx) => {
	ctx.mysql = { db };
});

describe("common", () => {
	test("table config: unsigned ints", async () => {
		const unsignedInts = mysqlTable("cities1", {
			bigint: bigint("bigint", { mode: "number", unsigned: true }),
			int: int("int", { unsigned: true }),
			smallint: smallint("smallint", { unsigned: true }),
			mediumint: mediumint("mediumint", { unsigned: true }),
			tinyint: tinyint("tinyint", { unsigned: true }),
		});

		const tableConfig = getTableConfig(unsignedInts);

		const bigintColumn = tableConfig.columns.find((c) => c.name === "bigint");
		const intColumn = tableConfig.columns.find((c) => c.name === "int");
		const smallintColumn = tableConfig.columns.find(
			(c) => c.name === "smallint",
		);
		const mediumintColumn = tableConfig.columns.find(
			(c) => c.name === "mediumint",
		);
		const tinyintColumn = tableConfig.columns.find((c) => c.name === "tinyint");

		expect(bigintColumn?.getSQLType()).toBe("bigint unsigned");
		expect(intColumn?.getSQLType()).toBe("int unsigned");
		expect(smallintColumn?.getSQLType()).toBe("smallint unsigned");
		expect(mediumintColumn?.getSQLType()).toBe("mediumint unsigned");
		expect(tinyintColumn?.getSQLType()).toBe("tinyint unsigned");
	});

	test("table config: signed ints", async () => {
		const unsignedInts = mysqlTable("cities1", {
			bigint: bigint("bigint", { mode: "number" }),
			int: int("int"),
			smallint: smallint("smallint"),
			mediumint: mediumint("mediumint"),
			tinyint: tinyint("tinyint"),
		});

		const tableConfig = getTableConfig(unsignedInts);

		const bigintColumn = tableConfig.columns.find((c) => c.name === "bigint");
		const intColumn = tableConfig.columns.find((c) => c.name === "int");
		const smallintColumn = tableConfig.columns.find(
			(c) => c.name === "smallint",
		);
		const mediumintColumn = tableConfig.columns.find(
			(c) => c.name === "mediumint",
		);
		const tinyintColumn = tableConfig.columns.find((c) => c.name === "tinyint");

		expect(bigintColumn?.getSQLType()).toBe("bigint");
		expect(intColumn?.getSQLType()).toBe("int");
		expect(smallintColumn?.getSQLType()).toBe("smallint");
		expect(mediumintColumn?.getSQLType()).toBe("mediumint");
		expect(tinyintColumn?.getSQLType()).toBe("tinyint");
	});
});
