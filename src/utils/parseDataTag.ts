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

const NumberSuffix = {
	Byte: 'b',
	Short: 's',
	Long: 'L',
	Float: 'f',
	Double: 'd'
} as const;

type DataTagNumberType = keyof typeof NumberSuffix;

export class DataTagNumber<Type extends DataTagNumberType = DataTagNumberType> {
	constructor(
		readonly type: Type,
		readonly value: Type extends 'Long' ? bigint : number
	) {}

	toJSON() {
		return {
			$type: this.type,
			$value: this.type === 'Long' ? this.value.toString() : this.value
		};
	}

	toString() {
		return `${this.value}${NumberSuffix[this.type]}`;
	}
}

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
		const slice = new Uint8Array(
			this.buffer.buffer,
			this.buffer.byteOffset + this.offset,
			length
		);
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

const readTag = (reader: BinaryReader): [string, unknown] => {
	const type = reader.readByte();
	const key = reader.readDotNetString();
	if (key === '$type') throw new Error('Data tag key $type is reserved');
	let value: unknown;

	switch (type) {
		case DataType.Byte:
			value = new DataTagNumber('Byte', reader.readByte());
			break;
		case DataType.Short:
			value = new DataTagNumber('Short', reader.readInt16());
			break;
		case DataType.Int:
			value = reader.readInt32();
			break;
		case DataType.Long:
			value = new DataTagNumber('Long', reader.readBigInt64());
			break;
		case DataType.Float:
			value = new DataTagNumber('Float', reader.readFloat32());
			break;
		case DataType.Double:
			value = new DataTagNumber('Double', reader.readFloat64());
			break;
		case DataType.String:
			value = reader.readDotNetString();
			break;
		case DataType.Binary:
			value = reader.readBytes(reader.readInt32());
			break;
		case DataType.Vector:
			value = {
				$type: 'Vector',
				x: reader.readFloat32(),
				y: reader.readFloat32(),
				z: reader.readFloat32()
			};
			break;
		case DataType.Boolean:
			value = reader.readByte() === 1;
			break;
		case DataType.TagList: {
			const count = reader.readInt32();
			const entries: [string, unknown][] = [];
			for (let index = 0; index < count; index += 1) {
				entries.push(readTag(reader));
			}
			if (
				entries.length > 0 &&
				entries.every(([childKey], index) => childKey === `${index}`)
			) {
				value = entries.map(([, childValue]) => childValue);
				break;
			}
			value = Object.fromEntries(entries);
			break;
		}
		default:
			throw new Error(`Unknown tag type ${type} for key ${key}`);
	}
	return [key, value];
};

const writeTagHeader = (
	writer: BinaryWriter,
	type: number,
	key: string
): void => {
	writer.writeByte(type);
	writer.writeDotNetString(key);
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' &&
	value !== null &&
	!Array.isArray(value) &&
	!(value instanceof Uint8Array);

const integerFromJson = (
	key: string,
	value: unknown,
	minimum: number,
	maximum: number
): number => {
	if (
		typeof value !== 'number' ||
		!Number.isInteger(value) ||
		value < minimum ||
		value > maximum
	) {
		throw new Error(
			`Expected integer from ${minimum} to ${maximum} for key ${key}`
		);
	}
	return value;
};

const floatFromJson = (
	key: string,
	value: unknown,
	singlePrecision: boolean
): number => {
	if (
		typeof value !== 'number' ||
		!Number.isFinite(value) ||
		(singlePrecision && !Number.isFinite(Math.fround(value)))
	) {
		throw new Error(
			`Expected finite ${singlePrecision ? 'Float' : 'Double'} for key ${key}`
		);
	}
	return value;
};

const writeNamedTag = (writer: BinaryWriter, json: unknown): void => {
	if (!isPlainRecord(json) || Object.keys(json).length !== 1) {
		throw new Error('Expected exactly one named tag property');
	}
	const [key, value] = Object.entries(json)[0]!;
	writeTag(writer, key, value);
};

const writeTag = (writer: BinaryWriter, key: string, json: unknown): void => {
	if (key === '$type') throw new Error('Data tag key $type is reserved');
	if (json instanceof DataTagNumber) json = json.toJSON();
	if (typeof json === 'number') {
		if (Number.isInteger(json)) {
			writeTagHeader(writer, DataType.Int, key);
			writer.writeInt32(integerFromJson(key, json, -2147483648, 2147483647));
		} else {
			writeTagHeader(writer, DataType.Double, key);
			writer.writeFloat64(floatFromJson(key, json, false));
		}
		return;
	}
	if (typeof json === 'string') {
		writeTagHeader(writer, DataType.String, key);
		writer.writeDotNetString(json);
		return;
	}
	if (typeof json === 'boolean') {
		writeTagHeader(writer, DataType.Boolean, key);
		writer.writeByte(json ? 1 : 0);
		return;
	}
	if (json instanceof Uint8Array) {
		writeTagHeader(writer, DataType.Binary, key);
		writer.writeInt32(json.length);
		writer.writeBytes(json);
		return;
	}
	if (Array.isArray(json)) {
		writeTagHeader(writer, DataType.TagList, key);
		writer.writeInt32(json.length);
		for (const [index, entry] of json.entries())
			writeTag(writer, `${index}`, entry);
		return;
	}
	if (!isPlainRecord(json))
		throw new Error(`Unsupported JSON value for key ${key}`);
	if (!Object.hasOwn(json, '$type')) {
		const entries = Object.entries(json);
		writeTagHeader(writer, DataType.TagList, key);
		writer.writeInt32(entries.length);
		for (const [childKey, value] of entries) writeTag(writer, childKey, value);
		return;
	}
	if (json.$type === 'Vector') {
		if (
			Object.keys(json).length !== 4 ||
			!['x', 'y', 'z'].every(axis => Object.hasOwn(json, axis))
		) {
			throw new Error(
				`Expected Vector with exactly $type, x, y, z for key ${key}`
			);
		}
		writeTagHeader(writer, DataType.Vector, key);
		writer.writeFloat32(floatFromJson(`${key}.x`, json.x, true));
		writer.writeFloat32(floatFromJson(`${key}.y`, json.y, true));
		writer.writeFloat32(floatFromJson(`${key}.z`, json.z, true));
		return;
	}
	if (Object.keys(json).length !== 2 || !Object.hasOwn(json, '$value')) {
		throw new Error(
			`Expected typed value with exactly $type and $value for key ${key}`
		);
	}
	const value = json.$value;
	switch (json.$type) {
		case 'Byte':
			writeTagHeader(writer, DataType.Byte, key);
			writer.writeByte(integerFromJson(key, value, 0, 255));
			break;
		case 'Short':
			writeTagHeader(writer, DataType.Short, key);
			writer.writeInt16(integerFromJson(key, value, -32768, 32767));
			break;
		case 'Long': {
			if (
				typeof value !== 'string' ||
				value.length > 20 ||
				!/^-?(0|[1-9]\d*)$/.test(value)
			) {
				throw new Error(`Expected signed 64-bit decimal string for key ${key}`);
			}
			const longValue = BigInt(value);
			if (
				longValue < -9223372036854775808n ||
				longValue > 9223372036854775807n
			) {
				throw new Error(`Long value out of signed 64-bit range for key ${key}`);
			}
			writeTagHeader(writer, DataType.Long, key);
			writer.writeBigInt64(longValue);
			break;
		}
		case 'Float':
			writeTagHeader(writer, DataType.Float, key);
			writer.writeFloat32(floatFromJson(key, value, true));
			break;
		case 'Double':
			writeTagHeader(writer, DataType.Double, key);
			writer.writeFloat64(floatFromJson(key, value, false));
			break;
		case 'Binary':
			if (!Array.isArray(value))
				throw new Error(`Expected byte array for key ${key}`);
			writeTagHeader(writer, DataType.Binary, key);
			writer.writeInt32(value.length);
			for (const byte of value)
				writer.writeByte(integerFromJson(key, byte, 0, 255));
			break;
		default:
			throw new Error(
				`Unknown JSON tag type ${String(json.$type)} for key ${key}`
			);
	}
};

export const fromDataTagBuffer = (buffer: Uint8Array) => {
	const reader = new BinaryReader(buffer);
	return Object.fromEntries([readTag(reader)]);
};

export const toDataTagBuffer = (value: unknown) => {
	const writer = new BinaryWriter();
	writeNamedTag(writer, value);
	return writer.toUint8Array();
};
