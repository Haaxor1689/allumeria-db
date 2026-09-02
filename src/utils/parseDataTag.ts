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

type DataTagTypeName = keyof typeof DataType;

type DataTagMetadata = {
	rootKey: string;
	types: Record<string, DataTagTypeName>;
};

type DataTagJsonRecord = PlainRecord & {
	__meta?: DataTagMetadata;
};

const DataTypeNameByValue = Object.fromEntries(
	Object.entries(DataType).map(([name, value]) => [value, name])
) as Record<DataType, DataTagTypeName>;

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

class BinaryWriter {
	private readonly bytes: number[] = [];

	writeByte(value: number): void {
		this.bytes.push(value & 0xff);
	}

	writeBytes(value: Uint8Array): void {
		for (const byte of value) {
			this.writeByte(byte);
		}
	}

	writeInt16(value: number): void {
		this.writeNumber(2, view => view.setInt16(0, value, true));
	}

	writeInt32(value: number): void {
		this.writeNumber(4, view => view.setInt32(0, value, true));
	}

	writeBigInt64(value: bigint): void {
		this.writeNumber(8, view => view.setBigInt64(0, value, true));
	}

	writeFloat32(value: number): void {
		this.writeNumber(4, view => view.setFloat32(0, value, true));
	}

	writeFloat64(value: number): void {
		this.writeNumber(8, view => view.setFloat64(0, value, true));
	}

	writeDotNetString(value: string): void {
		const bytes = new TextEncoder().encode(value);
		this.write7BitEncodedInt(bytes.length);
		this.writeBytes(bytes);
	}

	write7BitEncodedInt(value: number): void {
		let remaining = value >>> 0;

		while (remaining >= 0x80) {
			this.writeByte((remaining | 0x80) & 0xff);
			remaining >>>= 7;
		}

		this.writeByte(remaining);
	}

	toUint8Array(): Uint8Array {
		return Uint8Array.from(this.bytes);
	}

	private writeNumber(
		byteLength: number,
		write: (view: DataView) => void
	): void {
		const buffer = new ArrayBuffer(byteLength);
		const view = new DataView(buffer);
		write(view);
		this.writeBytes(new Uint8Array(buffer));
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

function writeTag(writer: BinaryWriter, tag: ParsedTag): void {
	writer.writeByte(tag.type);
	writer.writeDotNetString(tag.key);

	switch (tag.type) {
		case DataType.Byte:
			writer.writeByte(tag.value);
			break;
		case DataType.Short:
			writer.writeInt16(tag.value);
			break;
		case DataType.Int:
			writer.writeInt32(tag.value);
			break;
		case DataType.Long:
			writer.writeBigInt64(tag.value);
			break;
		case DataType.Float:
			writer.writeFloat32(tag.value);
			break;
		case DataType.Double:
			writer.writeFloat64(tag.value);
			break;
		case DataType.String:
			writer.writeDotNetString(tag.value);
			break;
		case DataType.Binary:
			writer.writeInt32(tag.value.length);
			writer.writeBytes(tag.value);
			break;
		case DataType.Vector:
			writer.writeFloat32(tag.value.x);
			writer.writeFloat32(tag.value.y);
			writer.writeFloat32(tag.value.z);
			break;
		case DataType.Boolean:
			writer.writeByte(tag.value ? 1 : 0);
			break;
		case DataType.TagList:
			writer.writeInt32(tag.tags.length);
			for (const childTag of tag.tags) {
				writeTag(writer, childTag);
			}
			break;
		default:
			throw new Error(
				`Unknown parsed tag type ${(tag as { type: number }).type}`
			);
	}
}

function stringifyDataTag(tag: ParsedTag): Uint8Array {
	const writer = new BinaryWriter();
	writeTag(writer, tag);
	return writer.toUint8Array();
}

function joinMetaPath(path: string, key: string): string {
	return path ? `${path}.${key}` : key;
}

function collectTagMetadata(
	tag: ParsedTag,
	metadata: DataTagMetadata,
	path = ''
): void {
	metadata.types[path] = DataTypeNameByValue[tag.type];

	if (tag.type !== DataType.TagList) {
		return;
	}

	for (const childTag of tag.tags) {
		collectTagMetadata(childTag, metadata, joinMetaPath(path, childTag.key));
	}
}

function createTagMetadata(tag: ParsedTag): DataTagMetadata {
	const metadata: DataTagMetadata = {
		rootKey: tag.key,
		types: {}
	};
	collectTagMetadata(tag, metadata);
	return metadata;
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
			return tagListToPlainData(tag.tags);
		default:
			throw new Error(
				`Unknown parsed tag type ${(tag as { type: number }).type}`
			);
	}
}

function isArrayLikeTagList(tags: ParsedTag[]): boolean {
	return tags.length > 0 && tags.every((tag, index) => tag.key === `${index}`);
}

function tagListToPlainData(tags: ParsedTag[]): PlainRecord | PlainData[] {
	if (isArrayLikeTagList(tags)) {
		return tags.map(tagToPlainData);
	}

	return tagListToPlainRecord(tags);
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

function isPlainRecord(value: unknown): value is PlainRecord {
	return (
		typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		!(value instanceof Uint8Array)
	);
}

function isVectorValue(value: PlainRecord): boolean {
	const keys = Object.keys(value);
	return (
		keys.length === 3 &&
		keys.includes('x') &&
		keys.includes('y') &&
		keys.includes('z') &&
		typeof value.x === 'number' &&
		typeof value.y === 'number' &&
		typeof value.z === 'number'
	);
}

function isBufferJsonValue(
	value: PlainRecord
): value is { type: 'Buffer'; data: number[] } {
	return (
		value.type === 'Buffer' &&
		Array.isArray(value.data) &&
		value.data.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)
	);
}

function getMetadataType(
	metadata: DataTagMetadata | undefined,
	path: string
): DataType | undefined {
	const typeName = metadata?.types[path];

	if (!typeName) {
		return undefined;
	}

	return DataType[typeName];
}

function numberFromJson(key: string, value: unknown): number {
	if (typeof value !== 'number') {
		throw new Error(`Expected numeric JSON value for key ${key}`);
	}

	return value;
}

function stringFromJson(key: string, value: unknown): string {
	if (typeof value !== 'string') {
		throw new Error(`Expected string JSON value for key ${key}`);
	}

	return value;
}

function booleanFromJson(key: string, value: unknown): boolean {
	if (typeof value !== 'boolean') {
		throw new Error(`Expected boolean JSON value for key ${key}`);
	}

	return value;
}

function binaryFromJson(key: string, value: unknown): Uint8Array {
	if (value instanceof Uint8Array) {
		return value;
	}

	if (isPlainRecord(value) && isBufferJsonValue(value)) {
		return Uint8Array.from(value.data);
	}

	throw new Error(`Expected binary JSON value for key ${key}`);
}

function vectorFromJson(
	key: string,
	value: unknown
): { x: number; y: number; z: number } {
	if (!isPlainRecord(value) || !isVectorValue(value)) {
		throw new Error(`Expected vector JSON value for key ${key}`);
	}

	return {
		x: value.x as number,
		y: value.y as number,
		z: value.z as number
	};
}

function plainDataToTag(
	key: string,
	value: unknown,
	metadata?: DataTagMetadata,
	path = ''
): ParsedTag {
	const metadataType = getMetadataType(metadata, path);

	if (metadataType !== undefined) {
		switch (metadataType) {
			case DataType.Byte:
				return { type: DataType.Byte, key, value: numberFromJson(key, value) };
			case DataType.Short:
				return { type: DataType.Short, key, value: numberFromJson(key, value) };
			case DataType.Int:
				return { type: DataType.Int, key, value: numberFromJson(key, value) };
			case DataType.Long:
				return { type: DataType.Long, key, value: BigInt(value as string) };
			case DataType.Float:
				return { type: DataType.Float, key, value: numberFromJson(key, value) };
			case DataType.Double:
				return {
					type: DataType.Double,
					key,
					value: numberFromJson(key, value)
				};
			case DataType.String:
				return {
					type: DataType.String,
					key,
					value: stringFromJson(key, value)
				};
			case DataType.Binary:
				return {
					type: DataType.Binary,
					key,
					value: binaryFromJson(key, value)
				};
			case DataType.Vector:
				return {
					type: DataType.Vector,
					key,
					value: vectorFromJson(key, value)
				};
			case DataType.Boolean:
				return {
					type: DataType.Boolean,
					key,
					value: booleanFromJson(key, value)
				};
			case DataType.TagList:
				if (Array.isArray(value)) {
					return {
						type: DataType.TagList,
						key,
						tags: value.map((entry, index) =>
							plainDataToTag(
								`${index}`,
								entry,
								metadata,
								joinMetaPath(path, `${index}`)
							)
						)
					};
				}

				if (isPlainRecord(value)) {
					return {
						type: DataType.TagList,
						key,
						tags: Object.entries(value).map(([childKey, childValue]) =>
							plainDataToTag(
								childKey,
								childValue,
								metadata,
								joinMetaPath(path, childKey)
							)
						)
					};
				}

				throw new Error(`Expected object or array JSON value for key ${key}`);
			default:
				throw new Error(
					`Unsupported metadata type ${metadataType} for key ${key}`
				);
		}
	}

	if (typeof value === 'number') {
		if ((key === 'p' || key === 'rotation') && Number.isInteger(value)) {
			return { type: DataType.Byte, key, value };
		}

		if (!Number.isInteger(value)) {
			return { type: DataType.Double, key, value };
		}

		return { type: DataType.Int, key, value };
	}

	if (typeof value === 'string') {
		return { type: DataType.String, key, value };
	}

	if (typeof value === 'boolean') {
		return { type: DataType.Boolean, key, value };
	}

	if (typeof value === 'bigint') {
		return { type: DataType.Long, key, value };
	}

	if (value instanceof Uint8Array) {
		return { type: DataType.Binary, key, value };
	}

	if (Array.isArray(value)) {
		return {
			type: DataType.TagList,
			key,
			tags: value.map((entry, index) =>
				plainDataToTag(
					`${index}`,
					entry,
					metadata,
					joinMetaPath(path, `${index}`)
				)
			)
		};
	}

	if (isPlainRecord(value)) {
		if (isBufferJsonValue(value)) {
			return {
				type: DataType.Binary,
				key,
				value: Uint8Array.from(value.data)
			};
		}

		if (isVectorValue(value)) {
			return {
				type: DataType.Vector,
				key,
				value: {
					x: value.x as number,
					y: value.y as number,
					z: value.z as number
				}
			};
		}

		return {
			type: DataType.TagList,
			key,
			tags: Object.entries(value).map(([childKey, childValue]) =>
				plainDataToTag(
					childKey,
					childValue,
					metadata,
					joinMetaPath(path, childKey)
				)
			)
		};
	}

	throw new Error(`Unsupported JSON value for key ${key}`);
}

function toPlainRecord(tag: ParsedTag): PlainRecord {
	if (tag.type === DataType.TagList) {
		const plainValue = tagListToPlainData(tag.tags);
		return Array.isArray(plainValue)
			? { [tag.key || 'value']: plainValue }
			: plainValue;
	}

	const key = tag.key || 'value';
	return { [key]: tagToPlainData(tag) };
}

export function stringifyDataTagRecord(
	record: DataTagJsonRecord,
	rootKey = 'root'
): Uint8Array {
	const { __meta: metadata, ...plainRecord } = record;
	return stringifyDataTag(
		plainDataToTag(metadata?.rootKey ?? rootKey, plainRecord, metadata)
	);
}

export function parseDataTagFileWithMetadata(
	path: string,
	compressed = false
): DataTagJsonRecord {
	const buffer = readFileSync(path);
	const parsed = compressed
		? parseCompressedDataTag(buffer)
		: parseDataTag(buffer);
	return { __meta: createTagMetadata(parsed), ...toPlainRecord(parsed) };
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
