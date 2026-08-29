import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const DataType = {
	None: 0,
	Byte: 1,
	Short: 2,
	Int: 3,
	Long: 4,
	Float: 5,
	Double: 6,
	String: 7,
	Binary: 8,
	Vector: 9,
	Boolean: 10,
	TagList: 20
} as const;

type DataType = (typeof DataType)[keyof typeof DataType];

type ParsedTag =
	| { type: typeof DataType.Byte; key: string; value: number }
	| { type: typeof DataType.Short; key: string; value: number }
	| { type: typeof DataType.Int; key: string; value: number }
	| { type: typeof DataType.Long; key: string; value: bigint }
	| { type: typeof DataType.Float; key: string; value: number }
	| { type: typeof DataType.Double; key: string; value: number }
	| { type: typeof DataType.String; key: string; value: string }
	| { type: typeof DataType.Binary; key: string; value: Uint8Array }
	| {
			type: typeof DataType.Vector;
			key: string;
			value: { x: number; y: number; z: number };
	  }
	| { type: typeof DataType.Boolean; key: string; value: boolean }
	| { type: typeof DataType.TagList; key: string; tags: ParsedTag[] };

type PlainData =
	| number
	| bigint
	| string
	| boolean
	| Uint8Array
	| { x: number; y: number; z: number }
	| PlainRecord
	| PlainData[];

type PlainRecord = Record<string, unknown>;

class BinaryReader {
	private offset = 0;

	constructor(private readonly buffer: Uint8Array) {}

	get remaining(): number {
		return this.buffer.length - this.offset;
	}

	readByte(): number {
		this.ensureAvailable(1);
		return this.buffer[this.offset++] ?? 0;
	}

	readBytes(length: number): Uint8Array {
		this.ensureAvailable(length);
		const slice = this.buffer.subarray(this.offset, this.offset + length);
		this.offset += length;
		return slice;
	}

	readInt16(): number {
		const value = new DataView(
			this.buffer.buffer,
			this.buffer.byteOffset + this.offset,
			2
		).getInt16(0, true);
		this.offset += 2;
		return value;
	}

	readInt32(): number {
		const value = new DataView(
			this.buffer.buffer,
			this.buffer.byteOffset + this.offset,
			4
		).getInt32(0, true);
		this.offset += 4;
		return value;
	}

	readBigInt64(): bigint {
		const value = new DataView(
			this.buffer.buffer,
			this.buffer.byteOffset + this.offset,
			8
		).getBigInt64(0, true);
		this.offset += 8;
		return value;
	}

	readFloat32(): number {
		const value = new DataView(
			this.buffer.buffer,
			this.buffer.byteOffset + this.offset,
			4
		).getFloat32(0, true);
		this.offset += 4;
		return value;
	}

	readFloat64(): number {
		const value = new DataView(
			this.buffer.buffer,
			this.buffer.byteOffset + this.offset,
			8
		).getFloat64(0, true);
		this.offset += 8;
		return value;
	}

	readDotNetString(): string {
		const byteCount = this.read7BitEncodedInt();
		const bytes = this.readBytes(byteCount);
		return new TextDecoder('utf-8').decode(bytes);
	}

	read7BitEncodedInt(): number {
		let count = 0;
		let shift = 0;

		while (true) {
			const byte = this.readByte();
			count |= (byte & 0x7f) << shift;
			if ((byte & 0x80) === 0) {
				return count;
			}
			shift += 7;
			if (shift > 35) {
				throw new Error('Invalid 7-bit encoded integer');
			}
		}
	}

	skip(length: number): void {
		this.ensureAvailable(length);
		this.offset += length;
	}

	private ensureAvailable(length: number): void {
		if (this.offset + length > this.buffer.length) {
			throw new Error(`Unexpected end of buffer at offset ${this.offset}`);
		}
	}
}

function readTag(reader: BinaryReader): ParsedTag {
	const type = reader.readByte() as DataType;
	const key = reader.readDotNetString();

	switch (type) {
		case DataType.Byte:
			return { type: DataType.Byte, key, value: reader.readByte() };
		case DataType.Short:
			return { type: DataType.Short, key, value: reader.readInt16() };
		case DataType.Int:
			return { type: DataType.Int, key, value: reader.readInt32() };
		case DataType.Long:
			return { type: DataType.Long, key, value: reader.readBigInt64() };
		case DataType.Float:
			return { type: DataType.Float, key, value: reader.readFloat32() };
		case DataType.Double:
			return { type: DataType.Double, key, value: reader.readFloat64() };
		case DataType.String:
			return { type: DataType.String, key, value: reader.readDotNetString() };
		case DataType.Binary: {
			const length = reader.readInt32();
			return { type: DataType.Binary, key, value: reader.readBytes(length) };
		}
		case DataType.Vector:
			return {
				type: DataType.Vector,
				key,
				value: {
					x: reader.readFloat32(),
					y: reader.readFloat32(),
					z: reader.readFloat32()
				}
			};
		case DataType.Boolean:
			return { type: DataType.Boolean, key, value: reader.readByte() === 1 };
		case DataType.TagList: {
			const count = reader.readInt32();
			const tags: ParsedTag[] = [];
			for (let index = 0; index < count; index += 1) {
				tags.push(readTag(reader));
			}
			return { type: DataType.TagList, key, tags };
		}
		default:
			throw new Error(`Unknown tag type ${type} for key ${key}`);
	}
}

function parseDataTag(buffer: Uint8Array): ParsedTag {
	return readTag(new BinaryReader(buffer));
}

function parseCompressedDataTag(buffer: Uint8Array): ParsedTag {
	return parseDataTag(gunzipSync(buffer));
}

function upsertRecordValue(
	record: PlainRecord,
	key: string,
	value: PlainData
): void {
	const existing = record[key];

	if (existing === undefined) {
		record[key] = value;
		return;
	}

	if (Array.isArray(existing)) {
		existing.push(value);
		return;
	}

	record[key] = [existing, value];
}

function tagToPlainData(tag: ParsedTag): PlainData {
	switch (tag.type) {
		case DataType.Byte:
		case DataType.Short:
		case DataType.Int:
		case DataType.Long:
		case DataType.Float:
		case DataType.Double:
		case DataType.String:
		case DataType.Binary:
		case DataType.Vector:
		case DataType.Boolean:
			return tag.value;
		case DataType.TagList:
			return tagListToPlainRecord(tag.tags);
		default:
			throw new Error(
				`Unknown parsed tag type ${(tag as { type: number }).type}`
			);
	}
}

function tagListToPlainRecord(tags: ParsedTag[]): PlainRecord {
	const record: PlainRecord = {};

	for (const tag of tags) {
		const plainValue = tagToPlainData(tag);

		if (!tag.key) {
			if (
				typeof plainValue === 'object' &&
				plainValue &&
				!Array.isArray(plainValue)
			) {
				for (const [nestedKey, nestedValue] of Object.entries(plainValue)) {
					upsertRecordValue(record, nestedKey, nestedValue as PlainData);
				}
			}
			continue;
		}

		upsertRecordValue(record, tag.key, plainValue);
	}

	return record;
}

function toPlainRecord(tag: ParsedTag): PlainRecord {
	if (tag.type === DataType.TagList) {
		return tagListToPlainRecord(tag.tags);
	}

	const key = tag.key || 'value';
	return { [key]: tagToPlainData(tag) };
}

export function parseDataTagFile(
	path: string,
	compressed = false
): PlainRecord {
	const buffer = readFileSync(path);
	const parsed = compressed
		? parseCompressedDataTag(buffer)
		: parseDataTag(buffer);
	return toPlainRecord(parsed);
}
